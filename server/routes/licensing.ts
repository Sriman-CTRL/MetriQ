import express from 'express';
import { License, ModelApproval, StandardWeight, LicenseType, LicenseStatus, ModelApprovalStatus, WorkingStandardStatus } from '../models';

export const licensingRouter = express.Router();

// GET /api/licensing/stats
licensingRouter.get('/stats', async (_req, res) => {
  try {
    const [
      totalLicenses,
      activeLicenses,
      manufacturers,
      repairers,
      dealers,
      totalTacs,
      totalWorkingStandards,
      standardsDueSoon,
    ] = await Promise.all([
      License.countDocuments(),
      License.countDocuments({ status: LicenseStatus.ACTIVE }),
      License.countDocuments({ licenseType: LicenseType.MANUFACTURER }),
      License.countDocuments({ licenseType: LicenseType.REPAIRER }),
      License.countDocuments({ licenseType: LicenseType.DEALER }),
      ModelApproval.countDocuments({ status: ModelApprovalStatus.APPROVED }),
      StandardWeight.countDocuments(),
      StandardWeight.countDocuments({ status: { $in: [WorkingStandardStatus.DUE_SOON, WorkingStandardStatus.CALIBRATION_OVERDUE] } }),
    ]);

    res.json({
      success: true,
      data: {
        totalLicenses,
        activeLicenses,
        manufacturers,
        repairers,
        dealers,
        totalTacs,
        totalWorkingStandards,
        standardsDueSoon,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/licensing/licenses
licensingRouter.get('/licenses', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter: any = {};
    if (type) filter.licenseType = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { licenseNumber: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { proprietorName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    const licenses = await License.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: licenses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/licensing/licenses
licensingRouter.post('/licenses', async (req, res) => {
  try {
    const {
      licenseType,
      businessName,
      proprietorName,
      panNumber,
      gstin,
      address,
      district,
      state,
      workshopAddress,
      competentTechnicians,
      authorizedCategories,
      securityDeposit,
    } = req.body;

    const count = await License.countDocuments();
    const typeCode = licenseType === LicenseType.MANUFACTURER ? 'MFG' : licenseType === LicenseType.REPAIRER ? 'REP' : 'DLR';
    const licenseNumber = `TS-LM-${typeCode}-2026-${String(count + 1).padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // 1-year statutory validity under Legal Metrology Rules

    const newLicense = await License.create({
      licenseNumber,
      licenseType,
      businessName,
      proprietorName,
      panNumber,
      gstin,
      address,
      district: district || 'Hyderabad',
      state: state || 'Telangana',
      workshopAddress: workshopAddress || address,
      competentTechnicians: competentTechnicians || ['Certified Metrology Technician'],
      authorizedCategories: authorizedCategories || ['Electronic Weighing Instruments (Class III)'],
      securityDeposit: securityDeposit || 25000,
      status: LicenseStatus.ACTIVE,
      validUntil,
    });

    res.status(201).json({ success: true, data: newLicense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// PATCH /api/licensing/licenses/:id/status
licensingRouter.patch('/licenses/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const license = await License.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { licenseNumber: req.params.id }] },
      { $set: { status, remarks } },
      { new: true }
    );
    if (!license) return res.status(404).json({ success: false, error: { message: 'License not found' } });
    res.json({ success: true, data: license });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/licensing/tac
licensingRouter.get('/tac', async (req, res) => {
  try {
    const { search, instrumentClass } = req.query;
    const filter: any = {};
    if (instrumentClass) filter.instrumentClass = instrumentClass;
    if (search) {
      filter.$or = [
        { tacNumber: { $regex: search, $options: 'i' } },
        { manufacturerName: { $regex: search, $options: 'i' } },
        { brandModel: { $regex: search, $options: 'i' } },
      ];
    }
    const tacs = await ModelApproval.find(filter).sort({ approvalDate: -1 });
    res.json({ success: true, data: tacs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/licensing/tac
licensingRouter.post('/tac', async (req, res) => {
  try {
    const {
      tacNumber,
      manufacturerName,
      brandModel,
      instrumentClass,
      maxCapacity,
      verificationScaleInterval,
      loadCellSpecs,
      softwareVersionHash,
      sealingPlan,
    } = req.body;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 5); // 5-year Type Approval Validity

    const newTac = await ModelApproval.create({
      tacNumber: tacNumber || `IND/09/2026/${Math.floor(100 + Math.random() * 900)}`,
      manufacturerName,
      brandModel,
      instrumentClass: instrumentClass || 'Class III',
      maxCapacity,
      verificationScaleInterval,
      loadCellSpecs,
      softwareVersionHash: softwareVersionHash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      status: ModelApprovalStatus.APPROVED,
      validUntil,
      sealingPlan: sealingPlan || 'Clamp wire seal through calibration plate cover and display chassis.',
    });

    res.status(201).json({ success: true, data: newTac });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/licensing/standards
licensingRouter.get('/standards', async (_req, res) => {
  try {
    const standards = await StandardWeight.find().sort({ nextCalibrationDueDate: 1 });
    res.json({ success: true, data: standards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/licensing/standards/:id/calibrate
licensingRouter.post('/standards/:id/calibrate', async (req, res) => {
  try {
    const { calibratingLaboratory, certificateNumber, measuredDeviationMg, maxPermissibleErrorMg, remarks } = req.body;
    const standard = await StandardWeight.findOne({
      $or: [{ _id: req.params.id }, { kitId: req.params.id }],
    });
    if (!standard) return res.status(404).json({ success: false, error: { message: 'Kit not found' } });

    const now = new Date();
    const nextDue = new Date();
    nextDue.setFullYear(nextDue.getFullYear() + 1); // 1-year calibration interval for LMO working standards

    const record = {
      calibratedAt: now,
      validUntil: nextDue,
      calibratedBy: calibratingLaboratory || 'RRSL Bangalore',
      certificateNumber: certificateNumber || `RRSL/CAL/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      maxPermissibleErrorMg: Number(maxPermissibleErrorMg) || 5,
      measuredDeviationMg: Number(measuredDeviationMg) || 1.2,
      passed: true,
      remarks: remarks || 'Calibrated against secondary standard stainless steel mass standards.',
    };

    standard.lastCalibrationDate = now;
    standard.nextCalibrationDueDate = nextDue;
    standard.calibrationCertificateNumber = record.certificateNumber;
    standard.status = WorkingStandardStatus.CALIBRATED_ACTIVE;
    standard.calibrationHistory.unshift(record);

    await standard.save();
    res.json({ success: true, data: standard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
