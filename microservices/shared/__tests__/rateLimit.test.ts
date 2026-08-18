/**
 * Tests for the in-process rate limiter. Only the chatbot was limited before,
 * which left the auth and submission endpoints open to being hammered.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors';
import { rateLimit } from '../rateLimit';

function fakeRequest(ip = '1.2.3.4'): Request {
    return {
        header: () => undefined,
        socket: { remoteAddress: ip },
    } as unknown as Request;
}

function fakeResponse(): Response {
    return { setHeader: () => undefined } as unknown as Response;
}

/** Runs the middleware once and reports what it passed to next(). */
function run(middleware: ReturnType<typeof rateLimit>, request: Request): unknown {
    let passed: unknown;
    const next: NextFunction = ((error?: unknown) => {
        passed = error;
    }) as NextFunction;
    middleware(request, fakeResponse(), next);
    return passed;
}

describe('rateLimit', () => {
    it('allows requests up to the limit', () => {
        const middleware = rateLimit({ max: 3, windowMs: 60_000 });
        const request = fakeRequest();
        assert.equal(run(middleware, request), undefined);
        assert.equal(run(middleware, request), undefined);
        assert.equal(run(middleware, request), undefined);
    });

    it('rejects the request after the limit with a 429', () => {
        const middleware = rateLimit({ max: 2, windowMs: 60_000 });
        const request = fakeRequest();
        run(middleware, request);
        run(middleware, request);

        const error = run(middleware, request);
        assert.ok(error instanceof AppError);
        assert.equal(error.status, 429);
    });

    it('counts each caller separately', () => {
        const middleware = rateLimit({ max: 1, windowMs: 60_000 });
        assert.equal(run(middleware, fakeRequest('1.1.1.1')), undefined);
        // A different IP starts with its own budget.
        assert.equal(run(middleware, fakeRequest('2.2.2.2')), undefined);
        // The first one is now over.
        assert.ok(run(middleware, fakeRequest('1.1.1.1')) instanceof AppError);
    });

    it('starts a fresh window once the old one expires', async () => {
        const middleware = rateLimit({ max: 1, windowMs: 20 });
        const request = fakeRequest();
        assert.equal(run(middleware, request), undefined);
        assert.ok(run(middleware, request) instanceof AppError);

        await new Promise((resolve) => setTimeout(resolve, 30));
        assert.equal(run(middleware, request), undefined);
    });
});
