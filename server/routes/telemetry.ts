import express from 'express';
import {
  Weighbridge,
  WeighbridgeTransaction,
  WeighbridgeStatus,
} from '../models';

export const telemetryRouter = express.Router();

// GET /api/telemetry/stats
telemetryRouter.get('/stats', async (_req, res) => {
  try {
    const [
      totalWeighbridges,
      onlineNormal,
      tamperAlerts,
      zeroDriftAlerts,
      totalTransactions,
      todayWeightAgg,
    ] = await Promise.all([
      Weighbridge.countDocuments(),
      Weighbridge.countDocuments({ status: WeighbridgeStatus.ONLINE_NORMAL }),
      Weighbridge.countDocuments({ status: WeighbridgeStatus.TAMPER_ALERT }),
      Weighbridge.countDocuments({ status: WeighbridgeStatus.ZERO_DRIFT_EXCEEDED }),
      WeighbridgeTransaction.countDocuments(),
      WeighbridgeTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalGrossKg: { $sum: '$grossWeightKg' },
            totalNetKg: { $sum: '$netWeightKg' },
            anomaliesCount: {
              $sum: {
                $cond: [{ $eq: ['$isAnomaly', true] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const tonnage =
      todayWeightAgg.length > 0 ? Math.round(todayWeightAgg[0].totalNetKg / 1000) : 0;
    const anomalies = todayWeightAgg.length > 0 ? todayWeightAgg[0].anomaliesCount : 0;

    res.json({
      success: true,
      data: {
        totalWeighbridges,
        onlineNormal,
        tamperAlerts,
        zeroDriftAlerts,
        totalTransactions,
        totalTonnageNet: tonnage,
        anomaliesDetected: anomalies,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/telemetry/weighbridges
telemetryRouter.get('/weighbridges', async (req, res) => {
  try {
    const { category, status, district, search } = req.query;
    const filter: any = {};

    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (district && district !== 'ALL') {
      filter.district = district;
    }
    if (search) {
      filter.$or = [
        { weighbridgeId: { $regex: String(search), $options: 'i' } },
        { name: { $regex: String(search), $options: 'i' } },
        { operatorName: { $regex: String(search), $options: 'i' } },
        { indicatorModel: { $regex: String(search), $options: 'i' } },
      ];
    }

    const weighbridges = await Weighbridge.find(filter).sort({ weighbridgeId: 1 });
    res.json({ success: true, data: weighbridges });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/telemetry/weighbridges/:id
telemetryRouter.get('/weighbridges/:id', async (req, res) => {
  try {
    const wb = await Weighbridge.findOne({ weighbridgeId: req.params.id });
    if (!wb) {
      return res.status(404).json({ success: false, error: { message: 'Weighbridge not found' } });
    }
    res.json({ success: true, data: wb });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/telemetry/weighbridges/:id/transactions
telemetryRouter.get('/weighbridges/:id/transactions', async (req, res) => {
  try {
    const txs = await WeighbridgeTransaction.find({ weighbridgeId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ success: true, data: txs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/telemetry/weighbridges/:id/transactions
telemetryRouter.post('/weighbridges/:id/transactions', async (req, res) => {
  try {
    const wb = await Weighbridge.findOne({ weighbridgeId: req.params.id });
    if (!wb) {
      return res.status(404).json({ success: false, error: { message: 'Weighbridge not found' } });
    }

    if (wb.remoteLockActive) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Weighbridge is under statutory enforcement LOCKDOWN. Weighing operations forbidden.',
        },
      });
    }

    const count = await WeighbridgeTransaction.countDocuments();
    const transactionId = `TX-WB-2026-${String(count + 1).padStart(5, '0')}`;
    const slipNumber = `SLIP-${req.params.id.slice(-4)}-${String(count + 1).padStart(4, '0')}`;

    const gross = Number(req.body.grossWeightKg);
    const tare = Number(req.body.tareWeightKg);
    const net = gross - tare;

    // Load cell sensor voltages (standard 4-load cell wheatstone bridge readings in mV/V)
    const loadCells = req.body.loadCellVoltagesMv || [2.01, 2.02, 1.99, 2.03];

    // Detect sensor balance anomalies (if max loadcell - min loadcell > 0.35 mV/V => corner load failure / jammer)
    const minLc = Math.min(...loadCells);
    const maxLc = Math.max(...loadCells);
    const lcSpread = maxLc - minLc;

    const tamperFlags: string[] = req.body.tamperFlags || [];
    let isAnomaly = false;
    let anomalyReason = '';

    if (lcSpread > 0.4) {
      isAnomaly = true;
      anomalyReason = `Load-cell voltage imbalance detected (${lcSpread.toFixed(2)} mV/V spread). Possible magnetic jamming or corner bind.`;
      tamperFlags.push('LOADCELL_IMBALANCE_ALERT');
    }

    if (Math.abs(wb.currentZeroOffsetKg) > wb.maxPermissibleErrorKg) {
      isAnomaly = true;
      anomalyReason = `Zero-point drift of ${wb.currentZeroOffsetKg} kg exceeds Maximum Permissible Error (${wb.maxPermissibleErrorKg} kg).`;
      tamperFlags.push('ZERO_DRIFT_EXCEEDED');
    }

    if (tare > gross) {
      isAnomaly = true;
      anomalyReason = 'Invalid tare: Tare weight recorded exceeds gross weight.';
      tamperFlags.push('INVALID_TARE');
    }

    const tx = await WeighbridgeTransaction.create({
      transactionId,
      weighbridgeId: req.params.id,
      timestamp: new Date(),
      vehicleNumber: req.body.vehicleNumber || 'TS-09-UB-4491',
      commodity: req.body.commodity || 'Agricultural Produce (Paddy Grain)',
      ewayBillNumber: req.body.ewayBillNumber || `EWAY-TS-2026-${Date.now().toString().slice(-8)}`,
      grossWeightKg: gross,
      tareWeightKg: tare,
      netWeightKg: net,
      loadCellVoltagesMv: loadCells,
      weightStabilityAchieved: req.body.weightStabilityAchieved !== false,
      tamperFlags,
      isAnomaly,
      anomalyReason: anomalyReason || undefined,
      slipNumber,
      operatorName: req.body.operatorName || wb.operatorName,
    });

    // Update weighbridge status if tamper anomaly is critical
    if (tamperFlags.includes('LOADCELL_IMBALANCE_ALERT')) {
      wb.status = WeighbridgeStatus.TAMPER_ALERT;
      wb.lastHeartbeat = new Date();
      await wb.save();
    } else {
      wb.lastHeartbeat = new Date();
      await wb.save();
    }

    res.status(201).json({
      success: true,
      message: `Transaction ${transactionId} recorded successfully. Net: ${net} kg.`,
      data: tx,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/telemetry/weighbridges/:id/lock
telemetryRouter.post('/weighbridges/:id/lock', async (req, res) => {
  try {
    const { lock, reason } = req.body;
    const wb = await Weighbridge.findOne({ weighbridgeId: req.params.id });
    if (!wb) {
      return res.status(404).json({ success: false, error: { message: 'Weighbridge not found' } });
    }

    wb.remoteLockActive = Boolean(lock);
    if (lock) {
      wb.status = WeighbridgeStatus.TAMPER_ALERT;
    } else {
      wb.status = WeighbridgeStatus.ONLINE_NORMAL;
    }
    await wb.save();

    res.json({
      success: true,
      message: lock
        ? `Weighbridge ${req.params.id} has been REMOTELY LOCKED under Section 24. Reason: ${reason || 'Statutory inspection discrepancy'}`
        : `Weighbridge ${req.params.id} lock released by Authorized Legal Metrology Inspector.`,
      data: wb,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/telemetry/weighbridges/:id/zero-adjust
telemetryRouter.post('/weighbridges/:id/zero-adjust', async (req, res) => {
  try {
    const { offsetKg } = req.body;
    const wb = await Weighbridge.findOne({ weighbridgeId: req.params.id });
    if (!wb) {
      return res.status(404).json({ success: false, error: { message: 'Weighbridge not found' } });
    }

    wb.currentZeroOffsetKg = Number(offsetKg) || 0;
    if (Math.abs(wb.currentZeroOffsetKg) <= wb.maxPermissibleErrorKg) {
      wb.status = WeighbridgeStatus.ONLINE_NORMAL;
    } else {
      wb.status = WeighbridgeStatus.ZERO_DRIFT_EXCEEDED;
    }
    await wb.save();

    res.json({
      success: true,
      message: `Zero offset recalibrated to ${wb.currentZeroOffsetKg} kg. Current Status: ${wb.status}`,
      data: wb,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
