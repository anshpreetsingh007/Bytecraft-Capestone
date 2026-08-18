"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCallError = void 0;
exports.callService = callService;
exports.callServiceBestEffort = callServiceBestEffort;
/**
 * Outbound calls between services.
 *
 * The old notifyClient helpers were a bare fetch in a try/catch: one blip in
 * notification-service and the alert was gone for good, with a console.error
 * as the only trace. This adds a timeout, bounded retries with backoff on the
 * failures that are actually worth retrying, the internal shared secret, and
 * request-id propagation so the retry shows up in the same trace as the
 * request that triggered it.
 */
const auth_1 = require("./auth");
const logger_1 = require("./logger");
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_ATTEMPTS = 3;
class ServiceCallError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = 'ServiceCallError';
        this.status = status;
    }
}
exports.ServiceCallError = ServiceCallError;
function isRetryable(status) {
    // A 4xx means we sent something wrong; sending it again will not help.
    if (status === null)
        return true;
    return status === 408 || status === 429 || status >= 500;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function callService(url, options = {}) {
    const { method = 'POST', body, timeoutMs = DEFAULT_TIMEOUT_MS, attempts = DEFAULT_ATTEMPTS, callerName = process.env.SERVICE_NAME ?? 'unknown', } = options;
    const headers = {
        'content-type': 'application/json',
        'x-internal-token': (0, auth_1.internalServiceToken)(),
        'x-calling-service': callerName,
    };
    const requestId = (0, logger_1.currentRequestId)();
    if (requestId)
        headers['x-request-id'] = requestId;
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (response.ok) {
                if (response.status === 204)
                    return null;
                const text = await response.text();
                return text ? JSON.parse(text) : null;
            }
            lastError = new ServiceCallError(`${method} ${url} returned ${response.status}`, response.status);
            if (!isRetryable(response.status))
                break;
        }
        catch (error) {
            lastError = new ServiceCallError(error instanceof Error ? error.message : 'network failure', null);
        }
        if (attempt < attempts) {
            // 100ms, 200ms, 400ms ... plus jitter so concurrent retries from
            // several services do not land on the same millisecond.
            const backoff = 100 * 2 ** (attempt - 1) + Math.floor(Math.random() * 50);
            await sleep(backoff);
        }
    }
    throw lastError ?? new ServiceCallError(`${method} ${url} failed`, null);
}
/**
 * For side effects that must never fail the primary operation -- raising a
 * notification, mostly. Retries, then gives up loudly rather than silently.
 */
async function callServiceBestEffort(url, options = {}) {
    try {
        await callService(url, options);
        return true;
    }
    catch (error) {
        logger_1.logger.error('inter-service call failed after retries', {
            url,
            method: options.method ?? 'POST',
            err: error,
        });
        return false;
    }
}
