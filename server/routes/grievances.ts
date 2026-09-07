import { Router, Request, Response } from 'express';
import { Grievance, GrievanceStatus } from '../models/Grievance';
import { User } from '../models/User';
import { logAudit } from '../utils/audit';

export const grievancesRouter = Router();

// GET /api/grievances - List all filed grievances
grievancesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, violationType, search } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (violationType) filter.violationType = violationType;
    if (search) {
      filter.$or = [
        { grievanceId: { $regex: String(search), $options: 'i' } },
        { merchantName: { $regex: String(search), $options: 'i' } },
        { location: { $regex: String(search), $options: 'i' } },
        { instrumentId: { $regex: String(search), $options: 'i' } },
        { certificateNumber: { $regex: String(search), $options: 'i' } },
      ];
    }

    const list = await Grievance.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Error listing grievances:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve grievances.' } });
  }
});

// GET /api/grievances/stats - Metrics for enforcement dashboard
grievancesRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, pending, investigating, confirmedViolations, resolved, totalPenalties] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: GrievanceStatus.SUBMITTED }),
      Grievance.countDocuments({ status: { $in: [GrievanceStatus.INSPECTOR_DISPATCHED, GrievanceStatus.INVESTIGATING] } }),
      Grievance.countDocuments({
        status: { $in: [GrievanceStatus.VIOLATION_CONFIRMED, GrievanceStatus.SEIZURE_ORDER_ISSUED, GrievanceStatus.PENALTY_COMPOUNDED] },
      }),
      Grievance.countDocuments({ status: GrievanceStatus.RESOLVED }),
      Grievance.aggregate([{ $group: { _id: null, total: { $sum: '$penaltyAmount' } } }]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        investigating,
        confirmedViolations,
        resolved,
        totalPenaltiesCompounded: totalPenalties[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve grievance stats.' } });
  }
});

// GET /api/grievances/:id - Retrieve detail
grievancesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const grievance = await Grievance.findOne({
      $or: [{ grievanceId: req.params.id }, { _id: req.params.id }],
    });

    if (!grievance) {
      res.status(404).json({ success: false, error: { message: 'Grievance record not found.' } });
      return;
    }

    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to get grievance.' } });
  }
});

// PATCH /api/grievances/:id/status - Update grievance stage & take statutory enforcement action
grievancesRouter.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, officerRemarks, assignedOfficerName, penaltyAmount, statutorySection } = req.body;

    const grievance = await Grievance.findOne({
      $or: [{ grievanceId: req.params.id }, { _id: req.params.id }],
    });

    if (!grievance) {
      res.status(404).json({ success: false, error: { message: 'Grievance not found.' } });
      return;
    }

    if (status) grievance.status = status;
    if (officerRemarks) grievance.officerRemarks = officerRemarks;
    if (assignedOfficerName) grievance.assignedOfficerName = assignedOfficerName;
    if (penaltyAmount !== undefined) grievance.penaltyAmount = Number(penaltyAmount);
    if (statutorySection) grievance.statutorySection = statutorySection;

    if (status === GrievanceStatus.RESOLVED) {
      grievance.resolutionDate = new Date();
    }

    await grievance.save();

    await logAudit({
      action: 'GRIEVANCE_STATUS_UPDATED',
      actorName: assignedOfficerName || 'Enforcement Officer',
      actorRole: 'INSPECTOR',
      entityType: 'GRIEVANCE',
      entityId: grievance.grievanceId,
      detail: `Grievance ${grievance.grievanceId} updated to ${status}. Penalty: ₹${grievance.penaltyAmount}. Remarks: ${officerRemarks || 'Updated'}.`,
    });

    res.json({ success: true, data: grievance });
  } catch (err: any) {
    console.error('Error updating grievance:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Failed to update grievance.' } });
  }
});
