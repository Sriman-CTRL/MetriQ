import { Router, Request, Response } from 'express';
import { SealInventory, SealStatus, SealType } from '../models/SealInventory';
import { User } from '../models/User';
import { logAudit } from '../utils/audit';

export const sealsRouter = Router();

// GET /api/seals - List seals with filtering & pagination
sealsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, allocatedTo, search, batchNumber } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (allocatedTo) filter.allocatedTo = allocatedTo;
    if (batchNumber) filter.batchNumber = batchNumber;
    if (search) {
      filter.$or = [
        { sealNumber: { $regex: String(search), $options: 'i' } },
        { batchNumber: { $regex: String(search), $options: 'i' } },
        { affixedInstrumentId: { $regex: String(search), $options: 'i' } },
        { affixedCertificateNumber: { $regex: String(search), $options: 'i' } },
        { allocatedOfficerName: { $regex: String(search), $options: 'i' } },
      ];
    }

    const seals = await SealInventory.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: seals });
  } catch (err) {
    console.error('Error fetching seals:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve seal inventory.' } });
  }
});

// GET /api/seals/stats - Seal custody metrics
sealsRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, available, affixed, damaged, tampered] = await Promise.all([
      SealInventory.countDocuments(),
      SealInventory.countDocuments({ status: SealStatus.AVAILABLE }),
      SealInventory.countDocuments({ status: SealStatus.AFFIXED }),
      SealInventory.countDocuments({ status: SealStatus.DAMAGED_VOID }),
      SealInventory.countDocuments({ status: SealStatus.FLAGGED_TAMPERED }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        available,
        affixed,
        damaged,
        tampered,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve seal statistics.' } });
  }
});

// POST /api/seals/batch-generate - Generate a series of official statutory seals
sealsRouter.post('/batch-generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prefix = 'TS-LM-2026', startNumber, count = 20, sealType = SealType.LEAD_WIRE, allocatedToId } = req.body;

    if (!startNumber || count <= 0) {
      res.status(400).json({ success: false, error: { message: 'Valid startNumber and positive count required.' } });
      return;
    }

    let allocatedOfficerName = 'Unassigned Central Custody';
    let officerUser = null;
    if (allocatedToId) {
      officerUser = await User.findById(allocatedToId);
      if (officerUser) allocatedOfficerName = officerUser.name;
    }

    const batchNumber = `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSeals = [];

    const start = parseInt(startNumber, 10);
    const numCount = Math.min(parseInt(count, 10), 100); // safety cap per request

    for (let i = 0; i < numCount; i++) {
      const currentNum = start + i;
      const formattedNum = String(currentNum).padStart(5, '0');
      const sealNum = `${prefix}-${formattedNum}`;

      newSeals.push({
        sealNumber: sealNum,
        sealType,
        batchNumber,
        allocatedTo: officerUser?._id,
        allocatedOfficerName,
        status: SealStatus.AVAILABLE,
        auditHistory: [
          {
            action: 'BATCH_GENERATED',
            actorName: 'State Controller Admin',
            timestamp: new Date(),
            notes: `Batch ${batchNumber} issued under Statutory Metrology Rules`,
          },
        ],
      });
    }

    const created = await SealInventory.insertMany(newSeals, { ordered: false });

    await logAudit({
      action: 'SEAL_BATCH_ISSUED',
      actorName: 'State Controller Admin',
      actorRole: 'ADMIN',
      entityType: 'SEAL_INVENTORY',
      entityId: batchNumber,
      detail: `Allocated ${created.length} statutory ${sealType} seals (${prefix}-${String(start).padStart(5, '0')} to ${prefix}-${String(start + numCount - 1).padStart(5, '0')}) to ${allocatedOfficerName}.`,
    });

    res.status(201).json({
      success: true,
      data: {
        batchNumber,
        count: created.length,
        allocatedTo: allocatedOfficerName,
      },
    });
  } catch (err: any) {
    console.error('Batch generation error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Failed to generate seal batch.' } });
  }
});

// POST /api/seals/affix - Bind seal to instrument & certificate during verification
sealsRouter.post('/affix', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sealNumber, instrumentId, certificateNumber, merchantName, location, officerName = 'R. Kumar (LMO)' } = req.body;

    if (!sealNumber || !instrumentId) {
      res.status(400).json({ success: false, error: { message: 'sealNumber and instrumentId are required.' } });
      return;
    }

    const seal = await SealInventory.findOne({ sealNumber });
    if (!seal) {
      res.status(404).json({ success: false, error: { message: `Seal ${sealNumber} not found in central registry.` } });
      return;
    }

    if (seal.status === SealStatus.AFFIXED) {
      res.status(400).json({
        success: false,
        error: {
          message: `Security violation: Seal ${sealNumber} is already affixed to instrument ${seal.affixedInstrumentId}. Re-use is strictly prohibited under Section 30.`,
        },
      });
      return;
    }

    seal.status = SealStatus.AFFIXED;
    seal.affixedInstrumentId = instrumentId;
    seal.affixedCertificateNumber = certificateNumber;
    seal.affixedMerchantName = merchantName;
    seal.affixedLocation = location;
    seal.affixedDate = new Date();

    seal.auditHistory.push({
      action: 'AFFIXED_TO_INSTRUMENT',
      actorName: officerName,
      timestamp: new Date(),
      notes: `Affixed to ${instrumentId} under Certificate ${certificateNumber || 'Pending'} at ${location || 'Site'}.`,
    });

    await seal.save();

    await logAudit({
      action: 'SEAL_AFFIXED',
      actorName: officerName,
      actorRole: 'LMO',
      entityType: 'INSTRUMENT',
      entityId: instrumentId,
      detail: `Statutory seal ${sealNumber} affixed to instrument ${instrumentId} (Certificate: ${certificateNumber || 'N/A'}).`,
    });

    res.json({ success: true, data: seal });
  } catch (err: any) {
    console.error('Error affixing seal:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Failed to affix seal.' } });
  }
});

// POST /api/seals/report-tamper - Flag seal as broken or physically tampered
sealsRouter.post('/report-tamper', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sealNumber, reason, inspectorName = 'Enforcement Squad' } = req.body;

    if (!sealNumber) {
      res.status(400).json({ success: false, error: { message: 'sealNumber is required.' } });
      return;
    }

    const seal = await SealInventory.findOne({ sealNumber });
    if (!seal) {
      res.status(404).json({ success: false, error: { message: `Seal ${sealNumber} not found.` } });
      return;
    }

    seal.status = SealStatus.FLAGGED_TAMPERED;
    seal.auditHistory.push({
      action: 'TAMPER_REPORTED',
      actorName: inspectorName,
      timestamp: new Date(),
      notes: reason || 'Physical seal cut/altered during routine market inspection.',
    });

    await seal.save();

    await logAudit({
      action: 'TAMPER_FLAGGED',
      actorName: inspectorName,
      actorRole: 'INSPECTOR',
      entityType: 'SEAL',
      entityId: sealNumber,
      detail: `Seal ${sealNumber} on instrument ${seal.affixedInstrumentId || 'Unknown'} flagged as TAMPERED: ${reason}`,
    });

    res.json({ success: true, data: seal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Failed to record tamper status.' } });
  }
});
