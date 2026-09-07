import { AuditLog } from '../models/AuditLog';
import { IUser } from '../models/User';

export interface AuditParams {
  action: string;
  actor?: IUser | null;
  actorName?: string;
  actorRole?: string;
  entityType: 'APPLICATION' | 'INSTRUMENT' | 'VERIFICATION' | 'CERTIFICATE' | 'STATE_CONFIG' | 'USER' | 'SYSTEM';
  entityId: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const actorName = params.actor ? params.actor.name : (params.actorName || 'SYSTEM');
    const actorRole = params.actor ? params.actor.role : (params.actorRole || 'SYSTEM');
    const actorId = params.actor ? params.actor._id : undefined;

    await AuditLog.create({
      action: params.action,
      actor: actorId,
      actorName,
      actorRole,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail,
      timestamp: new Date(),
      metadata: params.metadata,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
