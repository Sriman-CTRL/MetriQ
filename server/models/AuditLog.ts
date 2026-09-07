import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actor?: Types.ObjectId;
  actorName: string;
  actorRole: string;
  entityType: 'APPLICATION' | 'INSTRUMENT' | 'VERIFICATION' | 'CERTIFICATE' | 'STATE_CONFIG' | 'USER' | 'SYSTEM';
  entityId: string;
  detail: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, required: true, default: 'SYSTEM' },
    actorRole: { type: String, required: true, default: 'SYSTEM' },
    entityType: {
      type: String,
      enum: ['APPLICATION', 'INSTRUMENT', 'VERIFICATION', 'CERTIFICATE', 'STATE_CONFIG', 'USER', 'SYSTEM'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    detail: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit log
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
