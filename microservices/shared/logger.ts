/**
 * Structured logging with a request id that survives across service hops.
 *
 * Every log line is a single JSON object, so `docker compose logs | jq` works
 * and so does any log shipper. The request id is stored in AsyncLocalStorage
 * rather than passed around, and is forwarded on outbound calls by
 * serviceClient.ts — that is what makes it possible to follow one user action
 * from the browser through submission-service into notification-service.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface RequestContext {
    requestId: string;
    service: string;
    method?: string;
    path?: string;
    actor?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

let serviceName = 'service';

export function setServiceName(name: string): void {
    serviceName = name;
}

export function currentContext(): RequestContext | undefined {
    return storage.getStore();
}

export function currentRequestId(): string | undefined {
    return storage.getStore()?.requestId;
}

function minLevel(): number {
    const configured = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}

function write(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
    if (LEVEL_ORDER[level] < minLevel()) return;

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
    const payload = JSON.stringify(line, (_key, value) =>
        value instanceof Error
            ? { name: value.name, message: value.message, stack: value.stack }
            : value,
    );

    if (level === 'error') process.stderr.write(payload + '\n');
    else process.stdout.write(payload + '\n');
}

export const logger = {
    debug: (message: string, fields?: Record<string, unknown>) => write('debug', message, fields),
    info: (message: string, fields?: Record<string, unknown>) => write('info', message, fields),
    warn: (message: string, fields?: Record<string, unknown>) => write('warn', message, fields),
    error: (message: string, fields?: Record<string, unknown>) => write('error', message, fields),
};

/**
 * Opens a logging context for the request and logs one completion line with
 * the status and duration. Reuses an inbound `x-request-id` so a chain of
 * service calls shares one id, and echoes it back so the browser can quote it
 * in a bug report.
 */
export function requestContext(service: string) {
    return function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
        const inbound = req.header('x-request-id');
        const requestId = inbound && /^[\w-]{1,64}$/.test(inbound) ? inbound : randomUUID();

        const ctx: RequestContext = {
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
                const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
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
export function tagActor(actor: string): void {
    const ctx = storage.getStore();
    if (ctx) ctx.actor = actor;
}
