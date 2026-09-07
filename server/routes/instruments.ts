import { Router, Response } from 'express';
import { Instrument, InstrumentStatus } from '../models/Instrument';
import { UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const instrumentsRouter = Router();

// GET /api/instruments - List instruments (scoped by role)
instrumentsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, type, district, search } = req.query;

    const query: Record<string, unknown> = {};

    // OWNER can only view their own instruments
    if (user.role === UserRole.OWNER) {
      query.owner = user._id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (district) {
      query.district = district;
    }
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { instrumentId: searchRegex },
        { serialNumber: searchRegex },
        { manufacturer: searchRegex },
        { model: searchRegex },
        { location: searchRegex },
      ];
    }

    const instruments = await Instrument.find(query).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        instruments,
        total: instruments.length,
      },
    });
  } catch (err) {
    console.error('List instruments error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve instrument records.' },
    });
  }
});

// GET /api/instruments/:id
instrumentsRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id;

    const instrument = await Instrument.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { instrumentId: id }],
    });

    if (!instrument) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument record not found.' },
      });
      return;
    }

    // Ownership check: OWNER can only view their own instrument
    if (user.role === UserRole.OWNER && instrument.owner.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this instrument.' },
      });
      return;
    }

    res.json({
      success: true,
      data: { instrument },
    });
  } catch (err) {
    console.error('Get instrument error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve instrument details.' },
    });
  }
});

// POST /api/instruments - Register new instrument
instrumentsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      type,
      manufacturer,
      model,
      serialNumber,
      capacity,
      accuracyClass,
      location,
      state,
      district,
      ownerId,
    } = req.body;

    if (!type || !manufacturer || !model || !serialNumber || !capacity || !location) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'All instrument identification fields are required.' },
      });
      return;
    }

    // Determine owner: OWNER can only register for themselves
    let targetOwnerId = user._id;
    let targetOwnerName = user.businessName || user.name;

    if (ownerId && (user.role === UserRole.ADMIN || user.role === UserRole.BACK_OFFICE)) {
      targetOwnerId = ownerId;
    }

    // Check duplicate serial number for manufacturer
    const existing = await Instrument.findOne({
      manufacturer: manufacturer.trim(),
      serialNumber: serialNumber.trim(),
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SERIAL_EXISTS',
          message: `An instrument with manufacturer '${manufacturer}' and serial number '${serialNumber}' is already registered.`,
        },
      });
      return;
    }

    // Generate unique instrument ID: e.g. INS-HYD-XXXX
    const count = await Instrument.countDocuments();
    const shortDistrict = (district || user.district || 'HYD').slice(0, 3).toUpperCase();
    const instrumentId = `INS-${shortDistrict}-${String(count + 1).padStart(4, '0')}`;

    const newInstrument = await Instrument.create({
      instrumentId,
      type: type.trim(),
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      capacity: capacity.trim(),
      accuracyClass: accuracyClass || 'Class III',
      owner: targetOwnerId,
      ownerName: targetOwnerName,
      state: state || user.state || 'Telangana',
      district: district || user.district || 'Hyderabad',
      location: location.trim(),
      status: InstrumentStatus.PENDING,
    });

    await logAudit({
      action: 'INSTRUMENT_REGISTERED',
      actor: user,
      entityType: 'INSTRUMENT',
      entityId: newInstrument.instrumentId,
      detail: `Instrument ${newInstrument.instrumentId} (${newInstrument.type}, S/N: ${newInstrument.serialNumber}) registered.`,
    });

    res.status(201).json({
      success: true,
      data: { instrument: newInstrument },
    });
  } catch (err) {
    console.error('Create instrument error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to register instrument.' },
    });
  }
});

// PUT /api/instruments/:id
instrumentsRouter.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const id = req.params.id;

    const instrument = await Instrument.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { instrumentId: id }],
    });

    if (!instrument) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument not found.' },
      });
      return;
    }

    // Ownership check
    if (user.role === UserRole.OWNER && instrument.owner.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update your own instruments.' },
      });
      return;
    }

    const { type, location, capacity, status, model } = req.body;

    if (type) instrument.type = type;
    if (location) instrument.location = location;
    if (capacity) instrument.capacity = capacity;
    if (model) instrument.model = model;

    // Only Admin / Back Office / LMO can change status directly
    if (status && user.role !== UserRole.OWNER && Object.values(InstrumentStatus).includes(status)) {
      instrument.status = status;
    }

    await instrument.save();

    await logAudit({
      action: 'INSTRUMENT_UPDATED',
      actor: user,
      entityType: 'INSTRUMENT',
      entityId: instrument.instrumentId,
      detail: `Instrument ${instrument.instrumentId} record updated.`,
    });

    res.json({
      success: true,
      data: { instrument },
    });
  } catch (err) {
    console.error('Update instrument error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update instrument.' },
    });
  }
});
