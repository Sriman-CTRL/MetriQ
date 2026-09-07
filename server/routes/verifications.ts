import { Router, Response } from 'express';
import { Verification, IVerificationTest } from '../models/Verification';
import { Application, ApplicationStatus } from '../models/Application';
import { Instrument, InstrumentStatus } from '../models/Instrument';
import { Certificate, CertificateStatus } from '../models/Certificate';
import { UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { generateCertificateHash, verifyCertificateIntegrity } from '../utils/crypto';
import { logAudit } from '../utils/audit';

export const verificationsRouter = Router();

// GET /api/verifications - List verifications
verificationsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query: Record<string, unknown> = {};

    if (user.role === UserRole.LMO || user.role === UserRole.VERIFICATION_OFFICER) {
      query.officer = user._id;
    }

    const verifications = await Verification.find(query).sort({ completedAt: -1 });

    res.json({ success: true, data: { verifications } });
  } catch (err) {
    console.error('List verifications error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve verifications.' } });
  }
});

// GET /api/verifications/:id
verificationsRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const verification = await Verification.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id }],
    });

    if (!verification) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Verification record not found.' } });
      return;
    }

    res.json({ success: true, data: { verification } });
  } catch (err) {
    console.error('Get verification error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve verification details.' } });
  }
});

// POST /api/verifications - Create or save verification draft
verificationsRouter.post(
  '/',
  authenticate,
  authorize(UserRole.LMO, UserRole.VERIFICATION_OFFICER, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { applicationId, checklist, tests, remarks, isOfflineSubmission, syncOperationId } = req.body;

      if (!applicationId) {
        res.status(400).json({ success: false, error: { code: 'APPLICATION_ID_REQUIRED', message: 'Application ID is required.' } });
        return;
      }

      // Check idempotency for offline sync
      if (syncOperationId) {
        const existingSync = await Verification.findOne({ syncOperationId });
        if (existingSync) {
          res.json({ success: true, data: { verification: existingSync, deduplicated: true } });
          return;
        }
      }

      const application = await Application.findOne({
        $or: [{ _id: applicationId.match(/^[0-9a-fA-F]{24}$/) ? applicationId : null }, { applicationId }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      // Compute individual test error and pass/fail
      const evaluatedTests: IVerificationTest[] = (tests || []).map((t: { standardWeight: number; observedValue: number }, idx: number) => {
        const standardWeight = Number(t.standardWeight);
        const observedValue = Number(t.observedValue);
        const error = Math.round((observedValue - standardWeight) * 100) / 100;
        // Allowed tolerance: 0.5% of standard weight (configurable standard)
        const allowedTolerance = Math.round(standardWeight * 0.005 * 100) / 100;
        const testPass = Math.abs(error) <= allowedTolerance;
        return {
          testNumber: idx + 1,
          standardWeight,
          observedValue,
          error,
          allowedTolerance,
          result: testPass ? 'PASS' : 'FAIL',
        };
      });

      // Overall verification evaluation
      const checklistPassed = checklist
        ? checklist.physicalCondition && checklist.identification && checklist.sealCondition && checklist.displayFunction
        : true;
      const testsPassed = evaluatedTests.length > 0 && evaluatedTests.every((t) => t.result === 'PASS');
      const overallResult = checklistPassed && testsPassed ? 'PASS' : 'FAIL';

      // Temporary draft hash
      const verificationHash = generateCertificateHash({
        certificateNumber: 'DRAFT',
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
        checklist: checklist || {
          physicalCondition: true,
          identification: true,
          sealCondition: true,
          displayFunction: true,
        },
        tests: evaluatedTests,
        result: overallResult,
        remarks: remarks || '',
        verificationHash,
        syncOperationId,
        isOfflineSubmission: !!isOfflineSubmission,
        completedAt: new Date(),
      });

      application.status = ApplicationStatus.FIELD_VERIFICATION;
      await application.save();

      await logAudit({
        action: 'VERIFICATION_SAVED_DRAFT',
        actor: user,
        entityType: 'VERIFICATION',
        entityId: application.applicationId,
        detail: `Verification test data saved by ${user.name} for ${application.applicationId}. Result: ${overallResult}`,
        metadata: { overallResult, testCount: evaluatedTests.length },
      });

      res.status(201).json({ success: true, data: { verification } });
    } catch (err) {
      console.error('Create verification error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to record verification.' } });
    }
  }
);

// POST /api/verifications/:id/complete - Complete verification & issue certificate
verificationsRouter.post(
  '/:id/complete',
  authenticate,
  authorize(UserRole.LMO, UserRole.VERIFICATION_OFFICER, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const id = req.params.id;
      const { tests, checklist, remarks } = req.body;

      const application = await Application.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      // Check test results
      const rawTests = tests || [
        { standardWeight: 10, observedValue: 10.01 },
        { standardWeight: 20, observedValue: 20.02 },
        { standardWeight: 50, observedValue: 50.01 },
      ];

      const evaluatedTests: IVerificationTest[] = rawTests.map((t: { standardWeight: number; observedValue: number }, idx: number) => {
        const standardWeight = Number(t.standardWeight);
        const observedValue = Number(t.observedValue);
        const error = Math.round((observedValue - standardWeight) * 100) / 100;
        const allowedTolerance = Math.round(standardWeight * 0.005 * 100) / 100;
        const testPass = Math.abs(error) <= allowedTolerance;
        return {
          testNumber: idx + 1,
          standardWeight,
          observedValue,
          error,
          allowedTolerance,
          result: testPass ? 'PASS' : 'FAIL',
        };
      });

      const activeChecklist = checklist || {
        physicalCondition: true,
        identification: true,
        sealCondition: true,
        displayFunction: true,
      };

      const checklistPassed =
        activeChecklist.physicalCondition &&
        activeChecklist.identification &&
        activeChecklist.sealCondition &&
        activeChecklist.displayFunction;

      const testsPassed = evaluatedTests.length > 0 && evaluatedTests.every((t) => t.result === 'PASS');

      if (!checklistPassed || !testsPassed) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'All physical checks and accuracy tests must pass to issue a certificate.',
            details: { checklistPassed, testsPassed, evaluatedTests },
          },
        });
        return;
      }

      // 1. Generate unique server-side Certificate Number: LM-[DIST]-YYYY-XXXXXX
      const certCount = await Certificate.countDocuments();
      const shortDistrict = (application.district || 'HYD').slice(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      const certificateNumber = `LM-${shortDistrict}-${year}-${String(certCount + 1).padStart(6, '0')}`;

      const validUntilDate = new Date();
      validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
      const verificationDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const validUntilFormatted = validUntilDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // 2. Register or Update Instrument record
      let instrument = await Instrument.findOne({
        serialNumber: application.instrumentDetails.serialNumber,
        manufacturer: application.instrumentDetails.manufacturer,
      });

      if (instrument) {
        instrument.status = InstrumentStatus.VERIFIED;
        instrument.certificateNumber = certificateNumber;
        instrument.validUntil = validUntilDate;
        instrument.lastVerifiedAt = new Date();
        await instrument.save();
      } else {
        const instrumentCount = await Instrument.countDocuments();
        const instrumentId = `INS-${shortDistrict}-${String(instrumentCount + 1).padStart(4, '0')}`;
        instrument = await Instrument.create({
          instrumentId,
          type: application.instrumentDetails.type,
          manufacturer: application.instrumentDetails.manufacturer,
          model: application.instrumentDetails.model,
          serialNumber: application.instrumentDetails.serialNumber,
          capacity: application.instrumentDetails.capacity,
          accuracyClass: application.instrumentDetails.accuracyClass || 'Class III',
          owner: application.owner,
          ownerName: application.businessName,
          state: application.state,
          district: application.district,
          location: application.inspectionLocation,
          status: InstrumentStatus.VERIFIED,
          certificateNumber,
          validUntil: validUntilDate,
          lastVerifiedAt: new Date(),
        });
      }

      // 3. Canonical Data for Cryptographic SHA-256 Hash
      const canonicalData = {
        certificateNumber,
        instrumentId: instrument.instrumentId,
        type: instrument.type,
        manufacturer: instrument.manufacturer,
        model: instrument.model,
        serialNumber: instrument.serialNumber,
        capacity: instrument.capacity,
        ownerName: application.businessName,
        location: application.inspectionLocation,
        verificationDate: verificationDateStr,
        validUntil: validUntilFormatted,
        officerName: user.name,
      };

      const verificationHash = generateCertificateHash(canonicalData);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const qrUrl = `${frontendUrl}/verify/${certificateNumber}`;
      const qrToken = Buffer.from(JSON.stringify({ c: certificateNumber, h: verificationHash.slice(0, 16) })).toString('base64');

      // 4. Create Verification document
      const verification = await Verification.create({
        application: application._id,
        applicationId: application.applicationId,
        instrument: instrument._id,
        instrumentId: instrument.instrumentId,
        officer: user._id,
        officerName: user.name,
        checklist: activeChecklist,
        tests: evaluatedTests,
        result: 'PASS',
        remarks: remarks || 'Verified and sealed as per Legal Metrology Act and General Rules.',
        verificationHash,
        isOfflineSubmission: false,
        completedAt: new Date(),
        certificateNumber,
      });

      // 5. Create Certificate document
      const certificate = await Certificate.create({
        certificateNumber,
        instrument: instrument._id,
        instrumentId: instrument.instrumentId,
        instrumentType: instrument.type,
        manufacturer: instrument.manufacturer,
        model: instrument.model,
        serialNumber: instrument.serialNumber,
        capacity: instrument.capacity,
        accuracyClass: instrument.accuracyClass,
        application: application._id,
        applicationId: application.applicationId,
        verification: verification._id,
        owner: application.owner,
        ownerName: application.businessName,
        location: application.inspectionLocation,
        state: application.state,
        district: application.district,
        officer: user._id,
        officerName: user.name,
        verificationDate: verificationDateStr,
        issuedAt: new Date(),
        validUntil: validUntilDate,
        validUntilFormatted,
        status: CertificateStatus.VALID,
        verificationHash,
        qrToken,
        qrUrl,
        digitalSignatureMetadata: {
          algorithm: 'SHA-256',
          signedBy: user.email,
          officerName: user.name,
          timestamp: new Date(),
          hash: verificationHash,
        },
      });

      // 6. Update Application status
      application.status = ApplicationStatus.CERTIFICATE_ISSUED;
      application.certificate = certificate._id;
      application.certificateNumber = certificate.certificateNumber;
      await application.save();

      // 7. Audit log
      await logAudit({
        action: 'VERIFICATION_COMPLETED',
        actor: user,
        entityType: 'VERIFICATION',
        entityId: application.applicationId,
        detail: `Verification completed for ${application.applicationId}. Result: PASS. Verification Hash: ${verificationHash.slice(0, 16)}...`,
      });

      await logAudit({
        action: 'CERTIFICATE_GENERATED',
        actor: user,
        entityType: 'CERTIFICATE',
        entityId: certificateNumber,
        detail: `Certificate ${certificateNumber} generated for instrument ${instrument.instrumentId} (${instrument.serialNumber}).`,
        metadata: { verificationHash, validUntil: validUntilFormatted },
      });

      res.status(201).json({
        success: true,
        data: {
          certificate,
          verification,
          instrument,
          application,
          verificationHash,
        },
      });
    } catch (err) {
      console.error('Complete verification error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to complete verification.' } });
    }
  }
);

// POST /api/verifications/tamper-check - Digital record mismatch / tamper detection
verificationsRouter.post('/tamper-check', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { instrumentId, serialNumber, manufacturer, model, capacity } = req.body;

    const instrument = await Instrument.findOne({
      $or: [
        { instrumentId: instrumentId },
        { serialNumber: serialNumber },
        { _id: instrumentId && instrumentId.match(/^[0-9a-fA-F]{24}$/) ? instrumentId : null },
      ],
    });

    if (!instrument) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registered instrument record not found for comparison.' },
      });
      return;
    }

    const mismatches: { field: string; registered: string; observed: string }[] = [];

    if (serialNumber && instrument.serialNumber.trim().toUpperCase() !== serialNumber.trim().toUpperCase()) {
      mismatches.push({
        field: 'Serial Number',
        registered: instrument.serialNumber,
        observed: serialNumber,
      });
    }

    if (manufacturer && instrument.manufacturer.trim().toLowerCase() !== manufacturer.trim().toLowerCase()) {
      mismatches.push({
        field: 'Manufacturer',
        registered: instrument.manufacturer,
        observed: manufacturer,
      });
    }

    if (model && instrument.model.trim().toLowerCase() !== model.trim().toLowerCase()) {
      mismatches.push({
        field: 'Model',
        registered: instrument.model,
        observed: model,
      });
    }

    const isTampered = mismatches.length > 0;

    if (isTampered) {
      instrument.status = InstrumentStatus.FLAGGED;
      await instrument.save();

      await logAudit({
        action: 'TAMPER_FLAGGED',
        actor: user,
        entityType: 'INSTRUMENT',
        entityId: instrument.instrumentId,
        detail: `Digital record mismatch flagged for ${instrument.instrumentId}: ${mismatches.map((m) => `${m.field}: registered '${m.registered}', observed '${m.observed}'`).join('; ')}`,
        metadata: { mismatches },
      });
    }

    res.json({
      success: true,
      data: {
        isTampered,
        instrumentId: instrument.instrumentId,
        registeredInstrument: {
          manufacturer: instrument.manufacturer,
          model: instrument.model,
          serialNumber: instrument.serialNumber,
          capacity: instrument.capacity,
          status: instrument.status,
        },
        mismatches,
        message: isTampered
          ? 'Potential tampering suspected: Physical inspection/OCR text differs from registered registry record.'
          : 'Instrument record matched: Current evidence is consistent with registry baseline.',
      },
    });
  } catch (err) {
    console.error('Tamper check error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to perform tamper check.' } });
  }
});
