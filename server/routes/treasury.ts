import express from 'express';
import { TreasuryChallan, ChallanStatus, PaymentMethod } from '../models';

export const treasuryRouter = express.Router();

// GET /api/treasury/stats
treasuryRouter.get('/stats', async (_req, res) => {
  try {
    const challans = await TreasuryChallan.find();
    const totalCollected = challans
      .filter((c) => c.status === ChallanStatus.PAID || c.status === ChallanStatus.SETTLED_TREASURY)
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const baseFeeTotal = challans
      .filter((c) => c.status === ChallanStatus.PAID || c.status === ChallanStatus.SETTLED_TREASURY)
      .reduce((sum, c) => sum + (c.baseFee || 0), 0);

    const gstTotal = challans
      .filter((c) => c.status === ChallanStatus.PAID || c.status === ChallanStatus.SETTLED_TREASURY)
      .reduce((sum, c) => sum + (c.gstAmount || 0), 0);

    const penaltiesTotal = challans
      .filter((c) => c.status === ChallanStatus.PAID || c.status === ChallanStatus.SETTLED_TREASURY)
      .reduce((sum, c) => sum + (c.lateFeePenalty || 0), 0);

    const paidCount = challans.filter((c) => c.status === ChallanStatus.PAID || c.status === ChallanStatus.SETTLED_TREASURY).length;
    const pendingCount = challans.filter((c) => c.status === ChallanStatus.GENERATED).length;

    res.json({
      success: true,
      data: {
        totalCollected,
        baseFeeTotal,
        gstTotal,
        penaltiesTotal,
        paidCount,
        pendingCount,
        majorHead: '0435 - Other Administrative Services (Legal Metrology)',
        subHead: '101 - Fees for Stamping Weights & Measures',
        ddoCode: '25000301001',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/treasury/challans
treasuryRouter.get('/challans', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { challanNumber: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { transactionReference: { $regex: search, $options: 'i' } },
      ];
    }

    const challans = await TreasuryChallan.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: challans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/treasury/generate-challan
treasuryRouter.post('/generate-challan', async (req, res) => {
  try {
    const {
      applicationId,
      instrumentId,
      applicantName,
      businessName,
      baseFee,
      lateFeePenalty,
      district,
    } = req.body;

    const count = await TreasuryChallan.countDocuments();
    const challanNumber = `CHL-IFMIS-2026-${String(count + 1).padStart(5, '0')}`;
    const fee = Number(baseFee) || 450;
    const penalty = Number(lateFeePenalty) || 0;
    const gstAmount = Math.round((fee + penalty) * 0.18);
    const totalAmount = fee + penalty + gstAmount;

    const challan = await TreasuryChallan.create({
      challanNumber,
      applicationId,
      instrumentId,
      applicantName: applicantName || 'Citizen Merchant',
      businessName: businessName || 'Commercial Retailer',
      district: district || 'Hyderabad',
      state: 'Telangana',
      majorHead: '0435 - Other Administrative Services',
      subHead: '101 - Fees for Stamping Weights & Measures',
      ddoCode: '25000301001',
      baseFee: fee,
      gstAmount,
      lateFeePenalty: penalty,
      totalAmount,
      status: ChallanStatus.GENERATED,
    });

    res.status(201).json({ success: true, data: challan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/treasury/pay-challan
treasuryRouter.post('/pay-challan', async (req, res) => {
  try {
    const { challanNumber, paymentMethod } = req.body;
    const challan = await TreasuryChallan.findOne({ challanNumber });
    if (!challan) return res.status(404).json({ success: false, error: { message: 'Challan not found' } });

    const txRef = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const scroll = `SCR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    challan.status = ChallanStatus.PAID;
    challan.paymentMethod = paymentMethod || PaymentMethod.UPI;
    challan.transactionReference = txRef;
    challan.treasuryScrollNumber = scroll;
    challan.paidAt = new Date();
    challan.receiptDownloadUrl = `/api/treasury/receipt/${challan.challanNumber}`;

    await challan.save();

    res.json({
      success: true,
      message: 'Statutory fee remitted successfully to Telangana State Treasury.',
      data: challan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
