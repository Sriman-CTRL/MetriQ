import { Router, Response } from 'express';
import { Certificate } from '../models/Certificate';
import { UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const certificatesRouter = Router();

// GET /api/certificates - List certificates
certificatesRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query: Record<string, unknown> = {};

    if (user.role === UserRole.OWNER) {
      query.owner = user._id;
    }

    const certificates = await Certificate.find(query).sort({ issuedAt: -1 });

    res.json({
      success: true,
      data: {
        certificates,
        total: certificates.length,
      },
    });
  } catch (err) {
    console.error('List certificates error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve certificates.' },
    });
  }
});

// GET /api/certificates/:certificateNumber - Get certificate
certificatesRouter.get('/:certificateNumber', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const number = req.params.certificateNumber;

    const certificate = await Certificate.findOne({
      $or: [
        { certificateNumber: { $regex: new RegExp(`^${number}$`, 'i') } },
        { _id: number.match(/^[0-9a-fA-F]{24}$/) ? number : null },
      ],
    });

    if (!certificate) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Certificate not found.' },
      });
      return;
    }

    // Role check
    if (user.role === UserRole.OWNER && certificate.owner.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this certificate.' },
      });
      return;
    }

    res.json({
      success: true,
      data: { certificate },
    });
  } catch (err) {
    console.error('Get certificate error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve certificate details.' },
    });
  }
});
