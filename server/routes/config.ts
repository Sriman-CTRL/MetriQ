import { Router, Response } from 'express';
import { StateConfiguration } from '../models/StateConfiguration';
import { UserRole } from '../models/User';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const configRouter = Router();

// GET /api/config - Get all state configurations or single by ?state=...
configRouter.get('/', async (req, res: Response): Promise<void> => {
  try {
    const { state } = req.query;

    if (state) {
      const config = await StateConfiguration.findOne({ state: String(state).trim() });
      if (config) {
        res.json({ success: true, data: { config } });
        return;
      }
    }

    const configs = await StateConfiguration.find().sort({ state: 1 });
    res.json({ success: true, data: { configs } });
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve state configurations.' } });
  }
});

// PUT /api/config/:state - Update state configuration (Admin only)
configRouter.put(
  '/:state',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const stateName = req.params.state;
      const { fees, verificationRules, workflowSettings, requiredDocuments, verificationFrequencyMonths } = req.body;

      let config = await StateConfiguration.findOne({ state: stateName });

      if (!config) {
        config = new StateConfiguration({
          state: stateName,
          fees: fees || {},
          verificationRules: verificationRules || {},
          workflowSettings: workflowSettings || {},
          requiredDocuments: requiredDocuments || [],
          verificationFrequencyMonths: verificationFrequencyMonths || 12,
          isDemo: true,
        });
      } else {
        if (fees) config.fees = { ...config.fees, ...fees };
        if (verificationRules) config.verificationRules = { ...config.verificationRules, ...verificationRules };
        if (workflowSettings) config.workflowSettings = { ...config.workflowSettings, ...workflowSettings };
        if (requiredDocuments) config.requiredDocuments = requiredDocuments;
        if (verificationFrequencyMonths) config.verificationFrequencyMonths = verificationFrequencyMonths;
      }

      await config.save();

      await logAudit({
        action: 'CONFIG_UPDATED',
        actor: user,
        entityType: 'STATE_CONFIG',
        entityId: stateName,
        detail: `State configuration for ${stateName} updated by Admin ${user.name}.`,
      });

      res.json({ success: true, data: { config } });
    } catch (err) {
      console.error('Update config error:', err);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update state configuration.' } });
    }
  }
);
