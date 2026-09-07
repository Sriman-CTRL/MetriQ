import express from 'express';
import {
  RaidInspection,
  SeizureMemo,
  RaidStatus,
  PremiseType,
  CompoundingStatus,
} from '../models';
import crypto from 'crypto';

export const raidsRouter = express.Router();

// GET /api/raids/stats
raidsRouter.get('/stats', async (_req, res) => {
  try {
    const [
      totalRaids,
      violationsFound,
      activePanchnamas,
      compoundedCases,
      courtCases,
      totalCompoundingFees,
    ] = await Promise.all([
      RaidInspection.countDocuments(),
      RaidInspection.countDocuments({ status: RaidStatus.VIOLATIONS_FOUND_SEIZED }),
      SeizureMemo.countDocuments(),
      SeizureMemo.countDocuments({ compoundingStatus: CompoundingStatus.COMPOUNDED }),
      SeizureMemo.countDocuments({ compoundingStatus: CompoundingStatus.PROSECUTION_FILED_IN_COURT }),
      SeizureMemo.aggregate([
        { $match: { compoundingStatus: CompoundingStatus.COMPOUNDED } },
        { $group: { _id: null, total: { $sum: '$compoundingFeeAmount' } } },
      ]),
    ]);

    const revenue = totalCompoundingFees.length > 0 ? totalCompoundingFees[0].total : 0;

    res.json({
      success: true,
      data: {
        totalRaids,
        violationsFound,
        activePanchnamas,
        compoundedCases,
        courtCases,
        totalCompoundingFeesCollected: revenue,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/raids
raidsRouter.get('/', async (req, res) => {
  try {
    const { premiseType, status, district, search } = req.query;
    const filter: any = {};

    if (premiseType && premiseType !== 'ALL') {
      filter.premiseType = premiseType;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (district && district !== 'ALL') {
      filter.district = district;
    }
    if (search) {
      filter.$or = [
        { raidCode: { $regex: String(search), $options: 'i' } },
        { targetBusinessName: { $regex: String(search), $options: 'i' } },
        { squadLeader: { $regex: String(search), $options: 'i' } },
        { location: { $regex: String(search), $options: 'i' } },
      ];
    }

    const raids = await RaidInspection.find(filter).sort({ inspectionDate: -1 });
    res.json({ success: true, data: raids });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/raids
raidsRouter.post('/', async (req, res) => {
  try {
    const count = await RaidInspection.countDocuments();
    const raidCode = `RAID-TS-2026-${String(count + 1).padStart(4, '0')}`;

    const raid = await RaidInspection.create({
      raidCode,
      squadName: req.body.squadName || 'State Flying Squad Alpha - Hyderabad Central',
      squadLeader: req.body.squadLeader || 'Assistant Controller D. Sharma',
      targetBusinessName: req.body.targetBusinessName,
      proprietorName: req.body.proprietorName,
      location: req.body.location,
      district: req.body.district || 'Hyderabad',
      gpsCoordinates: req.body.gpsCoordinates || { latitude: 17.385, longitude: 78.4867 },
      premiseType: req.body.premiseType || PremiseType.MANDI_GRAIN_MARKET,
      inspectionDate: req.body.inspectionDate || new Date(),
      status: req.body.status || RaidStatus.PLANNED,
      allegedViolations: req.body.allegedViolations || [],
      seizureMade: req.body.seizureMade || false,
      panchnamaNumber: req.body.panchnamaNumber,
      summary: req.body.summary,
    });

    res.status(201).json({
      success: true,
      message: `Surprise raid operation ${raidCode} successfully scheduled`,
      data: raid,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/raids/panchnamas
raidsRouter.get('/panchnamas', async (req, res) => {
  try {
    const { compoundingStatus, district, search } = req.query;
    const filter: any = {};

    if (compoundingStatus && compoundingStatus !== 'ALL') {
      filter.compoundingStatus = compoundingStatus;
    }
    if (district && district !== 'ALL') {
      filter.district = district;
    }
    if (search) {
      filter.$or = [
        { panchnamaNumber: { $regex: String(search), $options: 'i' } },
        { establishmentName: { $regex: String(search), $options: 'i' } },
        { accusedPersonName: { $regex: String(search), $options: 'i' } },
        { investigatingOfficerName: { $regex: String(search), $options: 'i' } },
      ];
    }

    const panchnamas = await SeizureMemo.find(filter).sort({ inspectionDate: -1 });
    res.json({ success: true, data: panchnamas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/raids/panchnamas
raidsRouter.post('/panchnamas', async (req, res) => {
  try {
    const count = await SeizureMemo.countDocuments();
    const panchnamaNumber = `PANCHNAMA-HYD-2026-${String(count + 1).padStart(4, '0')}`;

    // Compute cryptographic SHA-256 integrity hash of seizure memo
    const digestPayload = `${panchnamaNumber}|${req.body.establishmentName}|${JSON.stringify(
      req.body.seizedItems
    )}|${Date.now()}`;
    const hash = crypto.createHash('sha256').update(digestPayload).digest('hex');

    const panchnama = await SeizureMemo.create({
      panchnamaNumber,
      raidCode: req.body.raidCode,
      inspectionDate: req.body.inspectionDate || new Date(),
      establishmentName: req.body.establishmentName,
      address: req.body.address,
      district: req.body.district || 'Hyderabad',
      accusedPersonName: req.body.accusedPersonName,
      accusedRole: req.body.accusedRole || 'Proprietor / Licensee',
      panchas: req.body.panchas || [
        {
          name: 'K. Venkateshwar Rao',
          age: 42,
          occupation: 'Merchant / Witness',
          address: 'Shop 12, APMC Complex, Bowenpally, Hyderabad',
          phone: '+91 98490 12345',
        },
        {
          name: 'Mohd. Abdul Qadeer',
          age: 38,
          occupation: 'Independent Trader',
          address: 'Plot 4, Market Yard Road, Secunderabad',
          phone: '+91 94401 67890',
        },
      ],
      seizedItems: req.body.seizedItems || [
        {
          serialNumber: 1,
          description: 'Counterfeit Lead Verification Seal with fake TS-LM stamp mark',
          quantity: 2,
          identificationMarks: 'TS-LM-FAKE-998',
          reasonForSeizure: 'Counterfeit lead stamp die lacking official security wire',
          custodyMalkhanaBoxNumber: 'BOX-MALKHANA-014',
        },
      ],
      statutorySections: req.body.statutorySections || [
        'Section 27 (Manufacture or sale of non-standard weights & measures)',
        'Section 30 (Penalty for short measurement)',
        'Section 38 (Tampering with license or statutory seal)',
      ],
      custodyLocation:
        req.body.custodyLocation ||
        'Central Legal Metrology Malkhana Vault, Hyderabad District Headquarters',
      compoundingStatus: req.body.compoundingStatus || CompoundingStatus.ELIGIBLE_FOR_COMPOUNDING,
      compoundingFeeAmount: req.body.compoundingFeeAmount || 25000,
      investigatingOfficerName:
        req.body.investigatingOfficerName || 'Assistant Controller D. Sharma',
      officerDigitalSignatureHash: hash,
      remarks: req.body.remarks,
    });

    // If linked to raidCode, update raid inspection
    if (req.body.raidCode) {
      await RaidInspection.findOneAndUpdate(
        { raidCode: req.body.raidCode },
        {
          $set: {
            seizureMade: true,
            panchnamaNumber,
            status: RaidStatus.VIOLATIONS_FOUND_SEIZED,
          },
        }
      );
    }

    res.status(201).json({
      success: true,
      message: `Statutory Seizure Memo (Panchnama) ${panchnamaNumber} generated and signed`,
      data: panchnama,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/raids/panchnamas/:id/compound
raidsRouter.post('/panchnamas/:id/compound', async (req, res) => {
  try {
    const { action, compoundingFeeAmount, challanNumber, courtCaseDetails, remarks } = req.body;
    const updateData: any = {};

    if (action === 'COMPOUND') {
      updateData.compoundingStatus = CompoundingStatus.COMPOUNDED;
      if (compoundingFeeAmount) updateData.compoundingFeeAmount = compoundingFeeAmount;
      updateData.challanNumber =
        challanNumber || `CHL-TS-COMP-${Date.now().toString().slice(-6)}`;
    } else if (action === 'PROSECUTE_IN_COURT') {
      updateData.compoundingStatus = CompoundingStatus.PROSECUTION_FILED_IN_COURT;
      if (courtCaseDetails) {
        updateData.courtCaseDetails = courtCaseDetails;
      } else {
        updateData.courtCaseDetails = {
          courtName: 'Hon’ble Court of Special Metropolitan Magistrate / JMFC, Nampally, Hyderabad',
          ccOrFirNumber: `CC-LEGMET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          hearingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'CHARGE_SHEET_FRAMED',
        };
      }
    }

    if (remarks) updateData.remarks = remarks;

    const updated = await SeizureMemo.findOneAndUpdate(
      { panchnamaNumber: req.params.id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Panchnama not found' } });
    }

    res.json({
      success: true,
      message:
        action === 'COMPOUND'
          ? `Offence successfully compounded under Section 48. Challan: ${updated.challanNumber}`
          : `Formal prosecution case filed before JMFC Court. CC#: ${updated.courtCaseDetails?.ccOrFirNumber}`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
