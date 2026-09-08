import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/db';
import { seedDatabase } from './server/seed';
import { authRouter } from './server/routes/auth';
import { instrumentsRouter } from './server/routes/instruments';
import { applicationsRouter } from './server/routes/applications';
import { verificationsRouter } from './server/routes/verifications';
import { certificatesRouter } from './server/routes/certificates';
import { publicRouter } from './server/routes/public';
import { auditRouter } from './server/routes/audit';
import { configRouter } from './server/routes/config';
import { syncRouter } from './server/routes/sync';
import { evidenceRouter } from './server/routes/evidence';
import { notificationsRouter } from './server/routes/notifications';
import { sealsRouter } from './server/routes/seals';
import { grievancesRouter } from './server/routes/grievances';
import { licensingRouter } from './server/routes/licensing';
import { dispatchRouter } from './server/routes/dispatch';
import { treasuryRouter } from './server/routes/treasury';
import { lmpcRouter } from './server/routes/lmpc';
import { raidsRouter } from './server/routes/raids';
import { telemetryRouter } from './server/routes/telemetry';
import { analyticsRouter } from './server/routes/analytics';
import { authenticate, authorize } from './server/middleware/auth';
import { UserRole } from './server/models/User';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Health check API (must respond immediately without waiting for DB)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'METRIQ Digital Legal Metrology Platform',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Connect to Database and Seed demo data in background
  const dbReadyPromise = (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('[Database] DB initialized & demo records verified.');
    } catch (err) {
      console.error('[Database] Initialization error:', err);
    }
  })();

  // Ensure DB is connected before handling data API requests
  app.use('/api', async (req, _res, next) => {
    if (req.path === '/health') return next();
    await dbReadyPromise;
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/instruments', instrumentsRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/verifications', verificationsRouter);
  app.use('/api/certificates', certificatesRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/config', configRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/evidence', evidenceRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/seals', authenticate, authorize(UserRole.LMO, UserRole.VERIFICATION_OFFICER, UserRole.ADMIN), sealsRouter);
  app.use('/api/grievances', grievancesRouter);
  app.use('/api/licensing', authenticate, authorize(UserRole.ADMIN, UserRole.BACK_OFFICE, UserRole.LMO), licensingRouter);
  app.use('/api/dispatch', authenticate, authorize(UserRole.ADMIN, UserRole.BACK_OFFICE), dispatchRouter);
  app.use('/api/treasury', authenticate, authorize(UserRole.ADMIN, UserRole.BACK_OFFICE, UserRole.OWNER), treasuryRouter);
  app.use('/api/lmpc', authenticate, authorize(UserRole.ADMIN, UserRole.BACK_OFFICE, UserRole.VERIFICATION_OFFICER), lmpcRouter);
  app.use('/api/raids', authenticate, authorize(UserRole.ADMIN, UserRole.VERIFICATION_OFFICER), raidsRouter);
  app.use('/api/telemetry', authenticate, authorize(UserRole.LMO, UserRole.VERIFICATION_OFFICER, UserRole.ADMIN), telemetryRouter);
  app.use('/api/analytics', authenticate, authorize(UserRole.ADMIN), analyticsRouter);

  // Global API error handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]:', err);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred.',
      },
    });
  });

  // Vite middleware for development or Static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[METRIQ] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[METRIQ] Fatal startup error:', err);
});
