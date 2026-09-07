import { Router, Response } from 'express';
import { Verification } from '../models/Verification';
import { Application, ApplicationStatus } from '../models/Application';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { generateCertificateHash } from '../utils/crypto';
import { logAudit } from '../utils/audit';

export const syncRouter = Router();

interface SyncItem {
  syncOperationId: string;
  type: 'VERIFICATION_DRAFT' | 'VERIFICATION_COMPLETE';
  applicationId: string;
  data: {
    checklist?: {
      physicalCondition: boolean;
      identification: boolean;
      sealCondition: boolean;
      displayFunction: boolean;
    };
    tests?: {
      standardWeight: number;
      observedValue: number;
    }[];
    remarks?: string;
    timestamp?: string;
  };
}

// POST /api/sync - Batch process offline operations with idempotency
syncRouter.post(
  '/',
  authenticate,
  authorize(UserRole.LMO, UserRole.VERIFICATION_OFFICER, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { operations } = req.body as { operations: SyncItem[] };

      if (!Array.isArray(operations) || operations.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYLOAD', message: 'Array of sync operations is required.' },
        });
        return;
      }

      const results = [];

      for (const op of operations) {
        if (!op.syncOperationId) {
          results.push({ success: false, error: 'Missing syncOperationId' });
          continue;
        }

        // 1. Idempotency check: look if this syncOperationId was already processed
        const existing = await Verification.findOne({ syncOperationId: op.syncOperationId });
        if (existing) {
          results.push({
            syncOperationId: op.syncOperationId,
            status: 'ALREADY_SYNCED',
            verificationId: existing._id,
            applicationId: existing.applicationId,
          });
          continue;
        }

        // 2. Process operation
        const application = await Application.findOne({
          $or: [{ _id: op.applicationId?.match(/^[0-9a-fA-F]{24}$/) ? op.applicationId : null }, { applicationId: op.applicationId }],
        });

        if (!application) {
          results.push({
            syncOperationId: op.syncOperationId,
            status: 'FAILED',
            error: `Application ${op.applicationId} not found`,
          });
          continue;
        }

        const rawTests = op.data?.tests || [{ standardWeight: 10, observedValue: 10 }];
        const evaluatedTests = rawTests.map((t, idx) => {
          const standardWeight = Number(t.standardWeight);
          const observedValue = Number(t.observedValue);
          const error = Math.round((observedValue - standardWeight) * 100) / 100;
          const allowedTolerance = Math.round(standardWeight * 0.005 * 100) / 100;
          return {
            testNumber: idx + 1,
            standardWeight,
            observedValue,
            error,
            allowedTolerance,
            result: Math.abs(error) <= allowedTolerance ? ('PASS' as const) : ('FAIL' as const),
          };
        });

        const checklist = op.data?.checklist || {
          physicalCondition: true,
          identification: true,
          sealCondition: true,
          displayFunction: true,
        };

        const pass =
          checklist.physicalCondition &&
          checklist.identification &&
          checklist.sealCondition &&
          checklist.displayFunction &&
          evaluatedTests.every((t) => t.result === 'PASS');

        const verificationHash = generateCertificateHash({
          certificateNumber: 'SYNC-' + op.syncOperationId.slice(0, 8),
          instrumentId: application.instrumentDetails.serialNumber,
          type: application.instrumentDetails.type,
          manufacturer: application.instrumentDetails.manufacturer,
          model: application.instrumentDetails.model,
          serialNumber: application.instrumentDetails.serialNumber,
          capacity: application.instrumentDetails.capacity,
          ownerName: application.businessName,
          location: application.inspectionLocation,
          verificationDate: new Date().toLocaleDateString('en-IN'),
          validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString('en-IN'),
          officerName: user.name,
        });

        const verification = await Verification.create({
          application: application._id,
          applicationId: application.applicationId,
          instrument: application.instrument,
          officer: user._id,
          officerName: user.name,
          checklist,
          tests: evaluatedTests,
          result: pass ? 'PASS' : 'FAIL',
          remarks: op.data?.remarks || 'Synchronized from offline field inspection cache.',
          verificationHash,
          syncOperationId: op.syncOperationId,
          isOfflineSubmission: true,
          completedAt: op.data?.timestamp ? new Date(op.data.timestamp) : new Date(),
        });

        if (application.status === ApplicationStatus.SCHEDULED || application.status === ApplicationStatus.ASSIGNED) {
          application.status = ApplicationStatus.FIELD_VERIFICATION;
          await application.save();
        }

        await logAudit({
          action: 'OFFLINE_SYNCED',
          actor: user,
          entityType: 'VERIFICATION',
          entityId: op.syncOperationId,
          detail: `Offline verification synced for ${application.applicationId}. Result: ${pass ? 'PASS' : 'FAIL'}.`,
        });

        results.push({
          syncOperationId: op.syncOperationId,
          status: 'SUCCESS',
          verificationId: verification._id,
          applicationId: application.applicationId,
          result: verification.result,
        });
      }

      res.json({
        success: true,
        data: {
          processedCount: results.length,
          results,
        },
      });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process sync operations.' } });
    }
  }
);
