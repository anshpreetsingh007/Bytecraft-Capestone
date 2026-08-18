// GENERATED FILE -- do not edit.
// Source: microservices/shared/errors.ts
// Regenerate with: npm run sync:shared
/**
 * One error vocabulary for every service.
 *
 * Handlers throw; the error middleware at the bottom of the stack decides the
 * status code and the response body. Previously each controller wrapped
 * itself in try/catch and hand-rolled a 500, which meant Postgres messages
 * (table names, constraint names, sometimes row contents) leaked to the
 * browser on any unexpected failure.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { currentRequestId, logger } from './logger';

export class AppError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    readonly expose: boolean;

    constructor(status: number, message: string, code = 'error', details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.expose = status < 500;
        Error.captureStackTrace?.(this, AppError);
    }
}

export const badRequest = (message: string, details?: unknown) =>
    new AppError(400, message, 'bad_request', details);
export const unauthorized = (message = 'Authentication required') =>
    new AppError(401, message, 'unauthorized');
export const forbidden = (message = 'You do not have access to this resource') =>
    new AppError(403, message, 'forbidden');
export const notFound = (message = 'Resource not found') =>
    new AppError(404, message, 'not_found');
export const conflict = (message: string, details?: unknown) =>
    new AppError(409, message, 'conflict', details);
export const tooManyRequests = (message = 'Too many requests, please slow down') =>
    new AppError(429, message, 'rate_limited');

/**
 * Express 4 does not await async handlers, so a rejected promise inside one
 * becomes an unhandled rejection and the request hangs until it times out.
 * Every route is wrapped in this.
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>,
): RequestHandler {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

interface PostgresError {
    code?: string;
    constraint?: string;
    detail?: string;
    table?: string;
}

/**
 * express.json() throws a SyntaxError with `body` and `status` attached when a
 * request body is not valid JSON. Left untranslated it reads as an unexpected
 * failure and becomes a 500, when it is squarely the caller's mistake.
 */
function isBodyParseError(error: unknown): boolean {
    return (
        error instanceof SyntaxError &&
        'body' in (error as object) &&
        (error as { status?: number }).status === 400
    );
}

/** Turns the Postgres error codes we can actually anticipate into 4xx. */
function translatePostgresError(error: PostgresError): AppError | null {
    switch (error.code) {
        case '23505':
            return conflict('That record already exists', { constraint: error.constraint });
        case '23503':
            return badRequest('A referenced record does not exist', { constraint: error.constraint });
        case '23514':
            return badRequest('That value is not allowed for this field', { constraint: error.constraint });
        case '23502':
            return badRequest('A required field was missing');
        case '22P02':
        case '22003':
            return badRequest('A value was not in the expected format');
        case '40001':
            return conflict('The record was modified by someone else, please retry');
        case '57014':
            return new AppError(504, 'The database query took too long', 'timeout');
        default:
            return null;
    }
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: `No route matches ${req.method} ${req.path}`,
        code: 'not_found',
        requestId: currentRequestId(),
    });
}

/** Must keep all four parameters — that is how Express recognises it. */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        next(err);
        return;
    }

    let appError: AppError;
    if (err instanceof AppError) {
        appError = err;
    } else if (isBodyParseError(err)) {
        appError = badRequest('The request body was not valid JSON');
    } else if ((err as { type?: string })?.type === 'entity.too.large') {
        appError = new AppError(413, 'That request was too large', 'payload_too_large');
    } else {
        const translated = translatePostgresError((err ?? {}) as PostgresError);
        appError = translated ?? new AppError(500, 'Something went wrong on our end', 'internal_error');
    }

    if (appError.status >= 500) {
        logger.error('request failed', { err, code: appError.code });
    } else {
        logger.warn('request rejected', {
            code: appError.code,
            status: appError.status,
            reason: appError.message,
        });
    }

    res.status(appError.status).json({
        // Never echo an unexpected internal message back to the caller.
        error: appError.expose ? appError.message : 'Something went wrong on our end',
        code: appError.code,
        ...(appError.expose && appError.details !== undefined ? { details: appError.details } : {}),
        requestId: currentRequestId(),
    });
}
