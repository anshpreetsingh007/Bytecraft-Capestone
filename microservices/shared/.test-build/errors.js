"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tooManyRequests = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.AppError = void 0;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const logger_1 = require("./logger");
class AppError extends Error {
    status;
    code;
    details;
    expose;
    constructor(status, message, code = 'error', details) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.expose = status < 500;
        Error.captureStackTrace?.(this, AppError);
    }
}
exports.AppError = AppError;
const badRequest = (message, details) => new AppError(400, message, 'bad_request', details);
exports.badRequest = badRequest;
const unauthorized = (message = 'Authentication required') => new AppError(401, message, 'unauthorized');
exports.unauthorized = unauthorized;
const forbidden = (message = 'You do not have access to this resource') => new AppError(403, message, 'forbidden');
exports.forbidden = forbidden;
const notFound = (message = 'Resource not found') => new AppError(404, message, 'not_found');
exports.notFound = notFound;
const conflict = (message, details) => new AppError(409, message, 'conflict', details);
exports.conflict = conflict;
const tooManyRequests = (message = 'Too many requests, please slow down') => new AppError(429, message, 'rate_limited');
exports.tooManyRequests = tooManyRequests;
/**
 * Express 4 does not await async handlers, so a rejected promise inside one
 * becomes an unhandled rejection and the request hangs until it times out.
 * Every route is wrapped in this.
 */
function asyncHandler(fn) {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/** Turns the Postgres error codes we can actually anticipate into 4xx. */
function translatePostgresError(error) {
    switch (error.code) {
        case '23505':
            return (0, exports.conflict)('That record already exists', { constraint: error.constraint });
        case '23503':
            return (0, exports.badRequest)('A referenced record does not exist', { constraint: error.constraint });
        case '23514':
            return (0, exports.badRequest)('That value is not allowed for this field', { constraint: error.constraint });
        case '23502':
            return (0, exports.badRequest)('A required field was missing');
        case '22P02':
        case '22003':
            return (0, exports.badRequest)('A value was not in the expected format');
        case '40001':
            return (0, exports.conflict)('The record was modified by someone else, please retry');
        case '57014':
            return new AppError(504, 'The database query took too long', 'timeout');
        default:
            return null;
    }
}
function notFoundHandler(req, res) {
    res.status(404).json({
        error: `No route matches ${req.method} ${req.path}`,
        code: 'not_found',
        requestId: (0, logger_1.currentRequestId)(),
    });
}
/** Must keep all four parameters — that is how Express recognises it. */
function errorHandler(err, _req, res, next) {
    if (res.headersSent) {
        next(err);
        return;
    }
    let appError;
    if (err instanceof AppError) {
        appError = err;
    }
    else {
        const translated = translatePostgresError((err ?? {}));
        appError = translated ?? new AppError(500, 'Something went wrong on our end', 'internal_error');
    }
    if (appError.status >= 500) {
        logger_1.logger.error('request failed', { err, code: appError.code });
    }
    else {
        logger_1.logger.warn('request rejected', {
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
        requestId: (0, logger_1.currentRequestId)(),
    });
}
