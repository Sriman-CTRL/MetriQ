import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const notificationsRouter = Router();

// GET /api/notifications - Get current user notifications
notificationsRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    // Check if user has any notifications, if not seed some contextual ones
    let notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30);

    if (notifications.length === 0) {
      // Seed contextual notifications based on role
      const role = req.user!.role;
      const initialAlerts = [];

      if (role === 'CITIZEN') {
        initialAlerts.push(
          {
            user: userId,
            title: 'Certificate Valid & Active',
            message: 'Digital Verification Certificate LM-HYD-2026-000184 is valid until 14 Aug 2027.',
            link: '/verify/LM-HYD-2026-000184',
            read: false,
          },
          {
            user: userId,
            title: 'Inspection Scheduled',
            message: 'Physical verification for application APP-HYD-2026-001245 scheduled for tomorrow at 10:30 AM.',
            link: '/track',
            read: false,
          },
          {
            user: userId,
            title: 'Application Received',
            message: 'Application APP-HYD-2026-001245 successfully submitted and queued for back-office scrutiny.',
            link: '/track',
            read: true,
          }
        );
      } else if (role === 'LMO') {
        initialAlerts.push(
          {
            user: userId,
            title: 'New Verification Task Assigned',
            message: 'You have been assigned to verify Electronic Weighing Instrument at Demo Retail Enterprises.',
            link: '/dashboard/field/verify/APP-HYD-2026-001245',
            read: false,
          },
          {
            user: userId,
            title: 'Sync Status Clean',
            message: 'Offline queue is synchronized with the central state metrology registry.',
            link: '/dashboard/field',
            read: true,
          }
        );
      } else if (role === 'BACK_OFFICE') {
        initialAlerts.push(
          {
            user: userId,
            title: 'New Scrutiny Request',
            message: 'Application APP-HYD-2026-001245 submitted by Demo Retail Enterprises is pending scrutiny.',
            link: '/dashboard/office',
            read: false,
          },
          {
            user: userId,
            title: 'Schedule Conflict Cleared',
            message: 'Slot allocation for Officer R. Kumar (Circle 1) has been updated.',
            link: '/dashboard/office/schedule',
            read: true,
          }
        );
      } else if (role === 'INSPECTOR') {
        initialAlerts.push(
          {
            user: userId,
            title: 'Discrepancy Investigation Flag',
            message: 'Instrument INS-HYD-0003 flagged for suspected seal mismatch in Charminar Circle.',
            link: '/dashboard/inspection',
            read: false,
          },
          {
            user: userId,
            title: 'Audit Log Recorded',
            message: 'High-precision baseline photographic comparison logged to immutable audit ledger.',
            link: '/dashboard/admin/audit',
            read: true,
          }
        );
      } else {
        // ADMIN
        initialAlerts.push(
          {
            user: userId,
            title: 'Annual Re-Verification Radar Alert',
            message: '14 weighing instruments in Hyderabad District are due for re-verification within 30 days.',
            link: '/dashboard/admin',
            read: false,
          },
          {
            user: userId,
            title: 'System Security Check OK',
            message: 'SHA-256 certificate chain integrity validated across all active state registries.',
            link: '/dashboard/admin/instruments',
            read: true,
          }
        );
      }

      notifications = await Notification.insertMany(initialAlerts);
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_NOTIFICATIONS_FAILED', message: err.message },
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
notificationsRouter.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
      return;
    }

    res.json({ success: true, data: { notification } });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_NOTIFICATION_FAILED', message: err.message },
    });
  }
});

// POST /api/notifications/mark-all-read - Mark all as read
notificationsRouter.post('/mark-all-read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!._id }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'MARK_ALL_READ_FAILED', message: err.message },
    });
  }
});

// POST /api/notifications - Create a notification
notificationsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId, title, message, link } = req.body;
    const recipient = targetUserId || req.user!._id;

    const notification = await Notification.create({
      user: recipient,
      title,
      message,
      link,
      read: false,
    });

    res.status(201).json({ success: true, data: { notification } });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_NOTIFICATION_FAILED', message: err.message },
    });
  }
});
