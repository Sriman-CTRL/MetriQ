import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum DispatchTrigger {
  STATUTORY_EXPIRY_REMINDER = 'STATUTORY_EXPIRY_REMINDER',
  VERIFICATION_SCHEDULED = 'VERIFICATION_SCHEDULED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  SEIZURE_ALERT = 'SEIZURE_ALERT',
  VIOLATION_COMPOUNDED = 'VIOLATION_COMPOUNDED',
  REVERIFICATION_OVERDUE = 'REVERIFICATION_OVERDUE',
}

export enum DispatchStatus {
  DELIVERED = 'DELIVERED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface IDispatchNotification extends Document {
  dispatchId: string; // E.g., DSP-2026-0081
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  channel: NotificationChannel;
  trigger: DispatchTrigger;
  dltTemplateId: string; // TRAI DLT Template ID e.g. 110716829102938
  senderHeader: string; // 'TL-LMGOVT' or 'TS-METRIQ'
  subject?: string;
  messageBody: string;
  instrumentId?: string;
  certificateNumber?: string;
  status: DispatchStatus;
  deliveryLatencyMs: number;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchNotificationSchema = new Schema<IDispatchNotification>(
  {
    dispatchId: { type: String, required: true, unique: true, index: true },
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    recipientEmail: { type: String },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    trigger: { type: String, enum: Object.values(DispatchTrigger), required: true },
    dltTemplateId: { type: String, default: '110716829102938' },
    senderHeader: { type: String, default: 'TS-LEGMET' },
    subject: { type: String },
    messageBody: { type: String, required: true },
    instrumentId: { type: String },
    certificateNumber: { type: String },
    status: { type: String, enum: Object.values(DispatchStatus), default: DispatchStatus.DELIVERED },
    deliveryLatencyMs: { type: Number, default: 420 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DispatchNotification = mongoose.model<IDispatchNotification>(
  'DispatchNotification',
  DispatchNotificationSchema
);
