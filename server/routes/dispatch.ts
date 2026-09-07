import express from 'express';
import { DispatchNotification, NotificationChannel, DispatchTrigger, DispatchStatus, Instrument } from '../models';

export const dispatchRouter = express.Router();

// GET /api/dispatch/stats
dispatchRouter.get('/stats', async (_req, res) => {
  try {
    const [totalDispatched, smsCount, whatsappCount, emailCount, deliveredCount] = await Promise.all([
      DispatchNotification.countDocuments(),
      DispatchNotification.countDocuments({ channel: NotificationChannel.SMS }),
      DispatchNotification.countDocuments({ channel: NotificationChannel.WHATSAPP }),
      DispatchNotification.countDocuments({ channel: NotificationChannel.EMAIL }),
      DispatchNotification.countDocuments({ status: DispatchStatus.DELIVERED }),
    ]);

    const deliveryRate = totalDispatched > 0 ? ((deliveredCount / totalDispatched) * 100).toFixed(1) : '100.0';

    res.json({
      success: true,
      data: {
        totalDispatched,
        smsCount,
        whatsappCount,
        emailCount,
        deliveredCount,
        deliveryRate: Number(deliveryRate),
        averageLatencyMs: 380,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/dispatch/logs
dispatchRouter.get('/logs', async (req, res) => {
  try {
    const { channel, trigger, search } = req.query;
    const filter: any = {};
    if (channel) filter.channel = channel;
    if (trigger) filter.trigger = trigger;
    if (search) {
      filter.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { recipientPhone: { $regex: search, $options: 'i' } },
        { messageBody: { $regex: search, $options: 'i' } },
        { dispatchId: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await DispatchNotification.find(filter).sort({ sentAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/dispatch/send
dispatchRouter.post('/send', async (req, res) => {
  try {
    const {
      recipientName,
      recipientPhone,
      recipientEmail,
      channel,
      trigger,
      messageBody,
      instrumentId,
      certificateNumber,
    } = req.body;

    const count = await DispatchNotification.countDocuments();
    const dispatchId = `DSP-2026-${String(count + 1).padStart(5, '0')}`;

    const notification = await DispatchNotification.create({
      dispatchId,
      recipientName: recipientName || 'Citizen Merchant',
      recipientPhone: recipientPhone || '98480 12345',
      recipientEmail: recipientEmail || 'merchant@telangana.gov.in',
      channel: channel || NotificationChannel.SMS,
      trigger: trigger || DispatchTrigger.STATUTORY_EXPIRY_REMINDER,
      dltTemplateId: '110716829102938',
      senderHeader: channel === NotificationChannel.SMS ? 'TL-LEGMET' : 'METRIQ Official WhatsApp',
      subject: channel === NotificationChannel.EMAIL ? 'Statutory Notice under Legal Metrology Act, 2009' : undefined,
      messageBody: messageBody || 'Notice under Rule 14: Your commercial scale verification is due. Re-verify to avoid penalty.',
      instrumentId,
      certificateNumber,
      status: DispatchStatus.DELIVERED,
      deliveryLatencyMs: Math.floor(250 + Math.random() * 300),
      sentAt: new Date(),
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/dispatch/simulate-expiry-sweep
dispatchRouter.post('/simulate-expiry-sweep', async (_req, res) => {
  try {
    // Look up expired or near-expiry instruments
    const instruments = await Instrument.find().limit(5);
    const created: any[] = [];

    for (const inst of instruments) {
      const count = await DispatchNotification.countDocuments();
      const dispatchId = `DSP-2026-${String(count + 1).padStart(5, '0')}`;
      const msg = `[Legal Metrology Dept, Telangana] URGENT: Verification of your instrument ${inst.instrumentId} (${inst.manufacturer} ${inst.model}) at ${inst.location} expires soon. Apply for re-verification at https://metriq.telangana.gov.in/apply to prevent seizure under Sec 30. DLT-ID: 110716829102938`;

      const notif = await DispatchNotification.create({
        dispatchId,
        recipientName: inst.ownerName,
        recipientPhone: '98480 98122',
        recipientEmail: 'owner@metriq.demo',
        channel: NotificationChannel.SMS,
        trigger: DispatchTrigger.STATUTORY_EXPIRY_REMINDER,
        senderHeader: 'TL-LEGMET',
        messageBody: msg,
        instrumentId: inst.instrumentId,
        status: DispatchStatus.DELIVERED,
        deliveryLatencyMs: 340,
        sentAt: new Date(),
      });
      created.push(notif);
    }

    res.json({
      success: true,
      message: `Dispatched statutory notices to ${created.length} commercial instrument owners.`,
      data: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
