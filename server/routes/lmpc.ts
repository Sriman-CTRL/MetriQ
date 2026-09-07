import express from 'express';
import {
  LmpcRegistration,
  PackagedCommoditySample,
  LmpcApplicantType,
  LmpcStatus,
  SampleTestResult,
} from '../models';

export const lmpcRouter = express.Router();

// GET /api/lmpc/stats
lmpcRouter.get('/stats', async (_req, res) => {
  try {
    const [
      totalRegistrations,
      approvedRegistrations,
      importers,
      manufacturers,
      totalSamplesTested,
      passedSamples,
      deficientSamples,
      seizuresRecommended,
    ] = await Promise.all([
      LmpcRegistration.countDocuments(),
      LmpcRegistration.countDocuments({ status: LmpcStatus.APPROVED }),
      LmpcRegistration.countDocuments({ applicantType: LmpcApplicantType.IMPORTER }),
      LmpcRegistration.countDocuments({ applicantType: LmpcApplicantType.MANUFACTURER }),
      PackagedCommoditySample.countDocuments(),
      PackagedCommoditySample.countDocuments({ result: SampleTestResult.PASS }),
      PackagedCommoditySample.countDocuments({
        result: { $ne: SampleTestResult.PASS },
      }),
      PackagedCommoditySample.countDocuments({ seizureRecommended: true }),
    ]);

    const passRate =
      totalSamplesTested > 0
        ? Math.round((passedSamples / totalSamplesTested) * 100)
        : 100;

    res.json({
      success: true,
      data: {
        totalRegistrations,
        approvedRegistrations,
        importers,
        manufacturers,
        totalSamplesTested,
        passedSamples,
        deficientSamples,
        seizuresRecommended,
        passRate,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/lmpc/registrations
lmpcRouter.get('/registrations', async (req, res) => {
  try {
    const { applicantType, status, search } = req.query;
    const filter: any = {};

    if (applicantType && applicantType !== 'ALL') {
      filter.applicantType = applicantType;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: String(search), $options: 'i' } },
        { companyName: { $regex: String(search), $options: 'i' } },
        { authorizedPerson: { $regex: String(search), $options: 'i' } },
        { commodities: { $in: [new RegExp(String(search), 'i')] } },
      ];
    }

    const registrations = await LmpcRegistration.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: registrations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/lmpc/registrations
lmpcRouter.post('/registrations', async (req, res) => {
  try {
    const count = await LmpcRegistration.countDocuments();
    const typePrefix =
      req.body.applicantType === LmpcApplicantType.IMPORTER
        ? 'IMP'
        : req.body.applicantType === LmpcApplicantType.PACKER
        ? 'PCK'
        : 'MFG';
    const regNum = `TS-LMPC-${typePrefix}-2026-${String(count + 1).padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 3); // 3-year statutory validity under Rule 27

    const registration = await LmpcRegistration.create({
      registrationNumber: regNum,
      applicantType: req.body.applicantType || LmpcApplicantType.MANUFACTURER,
      companyName: req.body.companyName,
      brandNames: req.body.brandNames || [],
      authorizedPerson: req.body.authorizedPerson,
      panNumber: req.body.panNumber,
      gstin: req.body.gstin,
      email: req.body.email,
      phone: req.body.phone,
      registeredAddress: req.body.registeredAddress,
      warehouseAddress: req.body.warehouseAddress,
      district: req.body.district || 'Hyderabad',
      state: req.body.state || 'Telangana',
      commodities: req.body.commodities || ['Packaged Goods'],
      status: req.body.status || LmpcStatus.APPROVED,
      mandatoryDeclarationsCompliant: req.body.mandatoryDeclarationsCompliant !== false,
      issueDate: new Date(),
      validUntil,
      feeAmount: req.body.feeAmount || 5000,
      challanNumber: req.body.challanNumber || `CHL-TS-0435-${Date.now().toString().slice(-6)}`,
      remarks: req.body.remarks,
    });

    res.status(201).json({
      success: true,
      message: 'LMPC Registration successfully created under Rule 27',
      data: registration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/lmpc/samples
lmpcRouter.get('/samples', async (req, res) => {
  try {
    const { commodityType, result, district, search } = req.query;
    const filter: any = {};

    if (commodityType && commodityType !== 'ALL') {
      filter.commodityType = commodityType;
    }
    if (result && result !== 'ALL') {
      filter.result = result;
    }
    if (district && district !== 'ALL') {
      filter.district = district;
    }
    if (search) {
      filter.$or = [
        { sampleId: { $regex: String(search), $options: 'i' } },
        { brandName: { $regex: String(search), $options: 'i' } },
        { manufacturerOrPacker: { $regex: String(search), $options: 'i' } },
        { batchNumber: { $regex: String(search), $options: 'i' } },
      ];
    }

    const samples = await PackagedCommoditySample.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: samples });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/lmpc/samples
lmpcRouter.post('/samples', async (req, res) => {
  try {
    const count = await PackagedCommoditySample.countDocuments();
    const sampleId = `LMPC-SMP-2026-${String(count + 1).padStart(4, '0')}`;

    const declaredQty = Number(req.body.declaredQuantity);
    const observedWeights: number[] = req.body.observedWeights || [declaredQty];
    const n = observedWeights.length;

    // Mathematical schedule calculation
    const sum = observedWeights.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / n).toFixed(2));
    const variance =
      n > 1
        ? observedWeights.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
        : 0;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    // Schedule II MAD rule computation
    let mad = Number(req.body.madLimit);
    if (!mad) {
      // Standard Legal Metrology MAD (Maximum Allowable Deficiency) formula:
      if (declaredQty <= 50) mad = declaredQty * 0.09;
      else if (declaredQty <= 100) mad = 4.5;
      else if (declaredQty <= 200) mad = declaredQty * 0.045;
      else if (declaredQty <= 300) mad = 9;
      else if (declaredQty <= 500) mad = declaredQty * 0.03;
      else if (declaredQty <= 1000) mad = 15;
      else if (declaredQty <= 10000) mad = declaredQty * 0.015;
      else if (declaredQty <= 15000) mad = 150;
      else mad = declaredQty * 0.01;
      mad = Number(mad.toFixed(2));
    }

    const t1Limit = declaredQty - mad;
    const t2Limit = declaredQty - 2 * mad;

    const t1Violations = observedWeights.filter((w) => w < t1Limit && w >= t2Limit).length;
    const t2Violations = observedWeights.filter((w) => w < t2Limit).length;

    let result = SampleTestResult.PASS;
    let seizureRecommended = false;

    if (t2Violations > 0) {
      result = SampleTestResult.CRITICAL_T2;
      seizureRecommended = true;
    } else if (t1Violations > Math.max(1, Math.floor(n * 0.05))) {
      result = SampleTestResult.EXCESSIVE_T1;
      seizureRecommended = true;
    } else if (mean < declaredQty) {
      result = SampleTestResult.DEFICIENT_AVERAGE;
    }

    const sample = await PackagedCommoditySample.create({
      sampleId,
      brandName: req.body.brandName,
      commodityType: req.body.commodityType,
      manufacturerOrPacker: req.body.manufacturerOrPacker,
      batchNumber: req.body.batchNumber,
      mfgDate: req.body.mfgDate || new Date(),
      declaredQuantity: declaredQty,
      unit: req.body.unit || 'g',
      declaredMrp: Number(req.body.declaredMrp),
      lotSize: Number(req.body.lotSize) || 1000,
      sampleSize: n,
      madLimit: mad,
      observedWeights,
      meanQuantity: mean,
      standardDeviation: stdDev,
      t1Limit,
      t2Limit,
      t1Violations,
      t2Violations,
      result,
      inspectorName: req.body.inspectorName || 'Inspector R. Kumar, Legal Metrology',
      inspectorId: req.body.inspectorId,
      inspectionLocation: req.body.inspectionLocation || 'Metro Wholesale Mandi, Kukatpally',
      district: req.body.district || 'Hyderabad',
      mandatoryLabelsPresent: req.body.mandatoryLabelsPresent || {
        mrp: true,
        netQty: true,
        mfgDate: true,
        consumerCare: true,
        countryOfOrigin: true,
      },
      seizureRecommended: req.body.seizureRecommended ?? seizureRecommended,
      remarks: req.body.remarks,
    });

    res.status(201).json({
      success: true,
      message: `Statutory sampling completed. Result: ${result}`,
      data: sample,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/lmpc/samples/:id/action
lmpcRouter.post('/samples/:id/action', async (req, res) => {
  try {
    const { action, panchnamaNumber, remarks } = req.body;
    const updateData: any = {};

    if (action === 'RECOMMEND_SEIZURE') {
      updateData.seizureRecommended = true;
    }
    if (panchnamaNumber) {
      updateData.panchnamaNumber = panchnamaNumber;
    }
    if (remarks) {
      updateData.remarks = remarks;
    }

    const updated = await PackagedCommoditySample.findOneAndUpdate(
      { sampleId: req.params.id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Sample record not found' } });
    }

    res.json({
      success: true,
      message: `Enforcement action executed for sample ${req.params.id}`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
