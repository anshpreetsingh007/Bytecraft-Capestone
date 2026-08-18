/**
 * Audit trail.
 *
 * "Who approved this estimate?" and "who promoted this account to admin?"
 * were both unanswerable. Every state change that a person could be asked to
 * account for writes a row here.
 *
 * Writing the audit row must never take down the operation it is describing,
 * so failures are logged and swallowed -- but they are logged at error level,
 * because a silently missing audit trail is its own problem.
 */
import type { Request } from 'express';
import type { DatabasePool } from './db';
import { currentRequestId, logger } from './logger';
import type { Actor } from './auth';

export interface AuditEntry {
    action: string;
    entityType: string;
    entityId?: number | null;
    summary?: string;
    metadata?: Record<string, unknown>;
}

function clientIp(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.header('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64);
    return (req.socket?.remoteAddress ?? null)?.slice(0, 64) ?? null;
}

export async function recordAudit(
    pool: DatabasePool,
    entry: AuditEntry,
    context: { actor?: Actor; req?: Request } = {},
): Promise<void> {
    const actor = context.actor ?? context.req?.actor ?? null;

    try {
        await pool.query(
            `INSERT INTO audit_log
                (actor_uid, actor_role, actor_id, action, entity_type, entity_id,
                 summary, metadata, request_id, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                actor?.uid ?? null,
                actor?.kind === 'service' ? `service:${actor.serviceName ?? 'unknown'}` : actor?.role ?? null,
                actor?.id ?? null,
                entry.action,
                entry.entityType,
                entry.entityId ?? null,
                entry.summary ?? null,
                JSON.stringify(entry.metadata ?? {}),
                currentRequestId() ?? null,
                clientIp(context.req),
            ],
        );
    } catch (error) {
        logger.error('failed to write audit entry', { err: error, action: entry.action });
    }
}

export interface AuditRow {
    audit_id: string;
    actor_uid: string | null;
    actor_role: string | null;
    actor_id: number | null;
    action: string;
    entity_type: string;
    entity_id: number | null;
    summary: string | null;
    metadata: Record<string, unknown>;
    request_id: string | null;
    created_at: string;
}
