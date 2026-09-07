import { Router, Response } from 'express';
import { Application, ApplicationStatus } from '../models/Application';
import { Instrument } from '../models/Instrument';
import { Assignment, AssignmentType } from '../models/Assignment';
import { User, UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const applicationsRouter = Router();

// GET /api/applications - List applications
applicationsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, district, priority, search, officerId } = req.query;

    const query: Record<string, unknown> = {};

    // Role-based visibility
    if (user.role === UserRole.OWNER) {
      query.owner = user._id;
    } else if (user.role === UserRole.LMO || user.role === UserRole.VERIFICATION_OFFICER) {
      // Officers see tasks assigned to them, or field verification queue
      if (officerId === 'me' || !status) {
        query.$or = [
          { assignedOfficer: user._id },
          { status: { $in: [ApplicationStatus.ASSIGNED, ApplicationStatus.SCHEDULED, ApplicationStatus.FIELD_VERIFICATION] } },
        ];
      } else {
        query.assignedOfficer = user._id;
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }
    if (district) {
      query.district = district;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { applicationId: searchRegex },
        { applicantName: searchRegex },
        { businessName: searchRegex },
        { 'instrumentDetails.type': searchRegex },
        { 'instrumentDetails.serialNumber': searchRegex },
      ];
    }

    const applications = await Application.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        applications,
        total: applications.length,
      },
    });
  } catch (err) {
    console.error('List applications error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applications.' },
    });
  }
});

// GET /api/applications/:id
applicationsRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id;

    const application = await Application.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id }],
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' },
      });
      return;
    }

    // Role ownership check: OWNER can only view own application
    if (user.role === UserRole.OWNER && application.owner.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this application.' },
      });
      return;
    }

    res.json({
      success: true,
      data: { application },
    });
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve application details.' },
    });
  }
});

// POST /api/applications - Create new application
applicationsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      applicantName,
      businessName,
      mobile,
      email,
      instrumentType,
      manufacturer,
      model,
      serialNumber,
      capacity,
      accuracyClass,
      verificationType,
      state,
      district,
      inspectionLocation,
      preferredDate,
      priority,
      instrumentId,
      documents,
    } = req.body;

    if (!applicantName || !businessName || !instrumentType || !serialNumber || !inspectionLocation) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Please provide all required application fields.' },
      });
      return;
    }

    // Generate unique application ID: APP-HYD-YEAR-XXXXXX
    const year = new Date().getFullYear();
    const shortDistrict = (district || user.district || 'HYD').slice(0, 3).toUpperCase();
    const count = await Application.countDocuments();
    const applicationId = `APP-${shortDistrict}-${year}-${String(count + 1).padStart(6, '0')}`;

    // Look for existing instrument or link
    let linkedInstrumentId = undefined;
    if (instrumentId) {
      const inst = await Instrument.findOne({
        $or: [{ _id: instrumentId.match(/^[0-9a-fA-F]{24}$/) ? instrumentId : null }, { instrumentId }],
      });
      if (inst) linkedInstrumentId = inst._id;
    }

    const newApplication = await Application.create({
      applicationId,
      owner: user._id,
      applicantName: applicantName.trim(),
      businessName: businessName.trim(),
      mobile: mobile || user.phone || 'N/A',
      email: email || user.email,
      instrument: linkedInstrumentId,
      instrumentDetails: {
        type: instrumentType.trim(),
        manufacturer: (manufacturer || 'Unknown').trim(),
        model: (model || 'Standard').trim(),
        serialNumber: serialNumber.trim(),
        capacity: (capacity || 'N/A').trim(),
        accuracyClass: accuracyClass || 'Class III',
      },
      verificationType: verificationType || 'Initial Verification',
      state: state || user.state || 'Telangana',
      district: district || user.district || 'Hyderabad',
      inspectionLocation: inspectionLocation.trim(),
      preferredDate: preferredDate || undefined,
      priority: priority || 'Normal',
      status: ApplicationStatus.SUBMITTED,
      documents: documents || [],
    });

    await logAudit({
      action: 'APPLICATION_SUBMITTED',
      actor: user,
      entityType: 'APPLICATION',
      entityId: newApplication.applicationId,
      detail: `Application ${newApplication.applicationId} submitted by ${user.name} (${businessName}).`,
    });

    res.status(201).json({
      success: true,
      data: { application: newApplication },
    });
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create application.' },
    });
  }
});

// POST /api/applications/:id/scrutinize - Begin scrutiny
applicationsRouter.post(
  '/:id/scrutinize',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      application.status = ApplicationStatus.UNDER_SCRUTINY;
      application.scrutiny = {
        officer: user._id,
        officerName: user.name,
        date: new Date(),
        remarks: req.body.remarks || 'Document scrutiny in progress',
        action: 'SCRUTINIZE',
      };

      await application.save();

      await logAudit({
        action: 'APPLICATION_SCRUTINIZED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Application ${application.applicationId} marked under scrutiny by ${user.name}.`,
      });

      res.json({ success: true, data: { application } });
    } catch (err) {
      console.error('Scrutinize error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update scrutiny status.' } });
    }
  }
);

// POST /api/applications/:id/approve - Approve application
applicationsRouter.post(
  '/:id/approve',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      application.status = ApplicationStatus.APPROVED;
      application.scrutiny = {
        officer: user._id,
        officerName: user.name,
        date: new Date(),
        remarks: req.body.remarks || 'All submitted documents verified and approved for officer assignment.',
        action: 'APPROVE',
      };

      await application.save();

      await logAudit({
        action: 'APPLICATION_APPROVED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Application ${application.applicationId} approved by ${user.name}.`,
      });

      res.json({ success: true, data: { application } });
    } catch (err) {
      console.error('Approve error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to approve application.' } });
    }
  }
);

// POST /api/applications/:id/return - Return application for corrections
applicationsRouter.post(
  '/:id/return',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const remarks = req.body.remarks;

      if (!remarks) {
        res.status(400).json({
          success: false,
          error: { code: 'REMARKS_REQUIRED', message: 'Remarks explaining reasons for returning are required.' },
        });
        return;
      }

      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      application.status = ApplicationStatus.RETURNED;
      application.scrutiny = {
        officer: user._id,
        officerName: user.name,
        date: new Date(),
        remarks,
        action: 'RETURN',
      };

      await application.save();

      await logAudit({
        action: 'APPLICATION_RETURNED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Application ${application.applicationId} returned for corrections: ${remarks}`,
      });

      res.json({ success: true, data: { application } });
    } catch (err) {
      console.error('Return error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to return application.' } });
    }
  }
);

// POST /api/applications/:id/reject - Reject application
applicationsRouter.post(
  '/:id/reject',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const remarks = req.body.remarks;

      if (!remarks) {
        res.status(400).json({
          success: false,
          error: { code: 'REMARKS_REQUIRED', message: 'Rejection reason is required.' },
        });
        return;
      }

      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      application.status = ApplicationStatus.REJECTED;
      application.scrutiny = {
        officer: user._id,
        officerName: user.name,
        date: new Date(),
        remarks,
        action: 'REJECT',
      };

      await application.save();

      await logAudit({
        action: 'APPLICATION_REJECTED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Application ${application.applicationId} rejected by ${user.name}: ${remarks}`,
      });

      res.json({ success: true, data: { application } });
    } catch (err) {
      console.error('Reject error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to reject application.' } });
    }
  }
);

// POST /api/applications/:id/assign - Assign officer
applicationsRouter.post(
  '/:id/assign',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { officerId, assignmentType = 'LMO', priority = 'Normal', notes } = req.body;

      if (!officerId) {
        res.status(400).json({
          success: false,
          error: { code: 'OFFICER_REQUIRED', message: 'Verification officer must be specified.' },
        });
        return;
      }

      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      // Find officer
      const officer = await User.findOne({
        $or: [{ _id: officerId.match(/^[0-9a-fA-F]{24}$/) ? officerId : null }, { name: officerId }, { email: officerId }],
      });

      if (!officer || (officer.role !== UserRole.LMO && officer.role !== UserRole.VERIFICATION_OFFICER)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_OFFICER', message: 'The selected user is not an authorized verification officer.' },
        });
        return;
      }

      application.assignedOfficer = officer._id;
      application.assignedOfficerName = officer.name;
      application.assignmentType = assignmentType;
      application.status = ApplicationStatus.ASSIGNED;
      await application.save();

      await Assignment.create({
        application: application._id,
        applicationId: application.applicationId,
        officer: officer._id,
        officerName: officer.name,
        assignmentType: assignmentType as AssignmentType,
        priority: priority as 'Normal' | 'High' | 'Urgent',
        assignedBy: user._id,
        assignedByName: user.name,
        assignedAt: new Date(),
        status: 'PENDING',
        notes,
      });

      await logAudit({
        action: 'OFFICER_ASSIGNED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Officer ${officer.name} assigned to application ${application.applicationId}.`,
      });

      res.json({ success: true, data: { application, assignedOfficer: officer.name } });
    } catch (err) {
      console.error('Assign error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to assign officer.' } });
    }
  }
);

// POST /api/applications/:id/schedule - Schedule inspection & check conflicts
applicationsRouter.post(
  '/:id/schedule',
  authenticate,
  authorize(UserRole.BACK_OFFICE, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { officerName, officerId, date, time, location } = req.body;

      if (!date || !time) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_DATE_TIME', message: 'Inspection date and time slot are required.' },
        });
        return;
      }

      const application = await Application.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }],
      });

      if (!application) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
        return;
      }

      // Check conflict for officer on same date/time
      const targetOfficerName = officerName || application.assignedOfficerName || 'Officer R. Kumar';
      const existingConflict = await Application.findOne({
        assignedOfficerName: targetOfficerName,
        scheduledDate: date,
        scheduledSlot: time,
        applicationId: { $ne: application.applicationId },
        status: { $in: [ApplicationStatus.SCHEDULED, ApplicationStatus.FIELD_VERIFICATION] },
      });

      let hasConflict = false;
      let conflictMessage = '';
      if (existingConflict) {
        hasConflict = true;
        conflictMessage = `${targetOfficerName} already has an inspection scheduled on ${date} at ${time} (${existingConflict.applicationId}).`;
      }

      // If officer was passed, update officer
      if (officerId) {
        const officer = await User.findById(officerId);
        if (officer) {
          application.assignedOfficer = officer._id;
          application.assignedOfficerName = officer.name;
        }
      } else if (officerName) {
        application.assignedOfficerName = officerName;
      }

      application.scheduledDate = date;
      application.scheduledSlot = time;
      if (location) application.inspectionLocation = location;
      application.status = ApplicationStatus.SCHEDULED;

      await application.save();

      await logAudit({
        action: 'VERIFICATION_SCHEDULED',
        actor: user,
        entityType: 'APPLICATION',
        entityId: application.applicationId,
        detail: `Inspection scheduled for ${date} at ${time} with ${application.assignedOfficerName || 'assigned officer'}.`,
        metadata: { conflictDetected: hasConflict, conflictMessage },
      });

      res.json({
        success: true,
        data: {
          application,
          hasConflict,
          conflictMessage,
        },
      });
    } catch (err) {
      console.error('Schedule error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to schedule inspection.' } });
    }
  }
);
