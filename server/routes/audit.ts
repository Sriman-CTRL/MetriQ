import { Router, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';

export const auditRouter = Router();

// GET /api/audit-logs - Query immutable audit log records
auditRouter.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BACK_OFFICE),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { entityType, entityId, action, limit = 50 } = req.query;

      const query: Record<string, unknown> = {};

      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (action) query.action = action;

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(Math.min(Number(limit), 200));

      res.json({
        success: true,
        data: {
          logs,
          total: logs.length,
        },
      });
    } catch (err) {
      console.error('Get audit logs error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve audit trail logs.' },
      });
    }
  }
);
