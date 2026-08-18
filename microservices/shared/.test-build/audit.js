"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAudit = recordAudit;
const logger_1 = require("./logger");
function clientIp(req) {
    if (!req)
        return null;
    const forwarded = req.header('x-forwarded-for');
    if (forwarded)
        return forwarded.split(',')[0].trim().slice(0, 64);
    return (req.socket?.remoteAddress ?? null)?.slice(0, 64) ?? null;
}
async function recordAudit(pool, entry, context = {}) {
    const actor = context.actor ?? context.req?.actor ?? null;
    try {
        await pool.query(`INSERT INTO audit_log
                (actor_uid, actor_role, actor_id, action, entity_type, entity_id,
                 summary, metadata, request_id, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
            actor?.uid ?? null,
            actor?.kind === 'service' ? `service:${actor.serviceName ?? 'unknown'}` : actor?.role ?? null,
            actor?.id ?? null,
            entry.action,
            entry.entityType,
            entry.entityId ?? null,
            entry.summary ?? null,
            JSON.stringify(entry.metadata ?? {}),
            (0, logger_1.currentRequestId)() ?? null,
            clientIp(context.req),
        ]);
    }
    catch (error) {
        logger_1.logger.error('failed to write audit entry', { err: error, action: entry.action });
    }
}
