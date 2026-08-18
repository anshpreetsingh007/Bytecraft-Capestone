"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.setServiceName = setServiceName;
exports.currentContext = currentContext;
exports.currentRequestId = currentRequestId;
exports.requestContext = requestContext;
exports.tagActor = tagActor;
/**
 * Structured logging with a request id that survives across service hops.
 *
 * Every log line is a single JSON object, so `docker compose logs | jq` works
 * and so does any log shipper. The request id is stored in AsyncLocalStorage
 * rather than passed around, and is forwarded on outbound calls by
 * serviceClient.ts — that is what makes it possible to follow one user action
 * from the browser through submission-service into notification-service.
 */
const node_async_hooks_1 = require("node:async_hooks");
const node_crypto_1 = require("node:crypto");
const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
const storage = new node_async_hooks_1.AsyncLocalStorage();
let serviceName = 'service';
function setServiceName(name) {
    serviceName = name;
}
function currentContext() {
    return storage.getStore();
}
function currentRequestId() {
    return storage.getStore()?.requestId;
}
function minLevel() {
    const configured = (process.env.LOG_LEVEL || 'info').toLowerCase();
    return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}
function write(level, message, fields = {}) {
    if (LEVEL_ORDER[level] < minLevel())
        return;
    const ctx = storage.getStore();
    const line = {
        time: new Date().toISOString(),
        level,
        service: ctx?.service ?? serviceName,
        message,
        ...(ctx ? { requestId: ctx.requestId, actor: ctx.actor } : {}),
        ...fields,
    };
    // Errors are not JSON-serialisable by default; unwrap them so the stack
    // actually reaches the log instead of becoming `{}`.
    const payload = JSON.stringify(line, (_key, value) => value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value);
    if (level === 'error')
        process.stderr.write(payload + '\n');
    else
        process.stdout.write(payload + '\n');
}
exports.logger = {
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
};
/**
 * Opens a logging context for the request and logs one completion line with
 * the status and duration. Reuses an inbound `x-request-id` so a chain of
 * service calls shares one id, and echoes it back so the browser can quote it
 * in a bug report.
 */
function requestContext(service) {
    return function requestContextMiddleware(req, res, next) {
        const inbound = req.header('x-request-id');
        const requestId = inbound && /^[\w-]{1,64}$/.test(inbound) ? inbound : (0, node_crypto_1.randomUUID)();
        const ctx = {
            requestId,
            service,
            method: req.method,
            path: req.path,
        };
        res.setHeader('x-request-id', requestId);
        storage.run(ctx, () => {
            const startedAt = process.hrtime.bigint();
            res.on('finish', () => {
                const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
                const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
                write(level, 'request completed', {
                    method: req.method,
                    path: req.originalUrl.split('?')[0],
                    status: res.statusCode,
                    durationMs: Math.round(durationMs * 100) / 100,
                });
            });
            next();
        });
    };
}
/** Lets auth middleware label the context once it knows who is calling. */
function tagActor(actor) {
    const ctx = storage.getStore();
    if (ctx)
        ctx.actor = actor;
}
