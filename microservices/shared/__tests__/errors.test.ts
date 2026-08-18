/**
 * Tests for the central error handler.
 *
 * The behaviour that matters here is what does *not* reach the browser: before
 * this existed, an unexpected failure went out as whatever Postgres said,
 * table and constraint names included.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';

import { AppError, badRequest, conflict, errorHandler, notFound } from '../errors';

interface Captured {
    status?: number;
    body?: Record<string, unknown>;
}

function handle(error: unknown): Captured {
    const captured: Captured = {};
    const response = {
        headersSent: false,
        status(code: number) {
            captured.status = code;
            return this;
        },
        json(body: Record<string, unknown>) {
            captured.body = body;
            return this;
        },
    } as unknown as Response;

    errorHandler(error, {} as Request, response, (() => undefined) as NextFunction);
    return captured;
}

describe('errorHandler', () => {
    it('passes an AppError through with its status and message', () => {
        const result = handle(notFound('Estimate not found'));
        assert.equal(result.status, 404);
        assert.equal(result.body?.error, 'Estimate not found');
        assert.equal(result.body?.code, 'not_found');
    });

    it('includes details on client errors so a form can point at the field', () => {
        const result = handle(badRequest('status is not allowed', { allowed: ['draft'] }));
        assert.equal(result.status, 400);
        assert.deepEqual(result.body?.details, { allowed: ['draft'] });
    });

    it('never leaks the message of an unexpected error', () => {
        const result = handle(new Error('relation "cost_estimate" does not exist'));
        assert.equal(result.status, 500);
        assert.equal(result.body?.error, 'Something went wrong on our end');
        assert.match(String(result.body?.error), /^(?!.*cost_estimate).*$/);
    });

    it('turns a unique violation into a 409 rather than a 500', () => {
        const result = handle({ code: '23505', constraint: 'client_email_key' });
        assert.equal(result.status, 409);
        assert.equal(result.body?.code, 'conflict');
    });

    it('turns a check violation into a 400', () => {
        // e.g. a status outside the allowed set.
        const result = handle({ code: '23514', constraint: 'orders_status_check' });
        assert.equal(result.status, 400);
    });

    it('turns a foreign key violation into a 400', () => {
        const result = handle({ code: '23503', constraint: 'cost_estimate_order_id_fkey' });
        assert.equal(result.status, 400);
    });

    it('turns a statement timeout into a 504', () => {
        const result = handle({ code: '57014' });
        assert.equal(result.status, 504);
    });

    it('turns malformed JSON into a 400 rather than a 500', () => {
        const parseError = Object.assign(new SyntaxError('Unexpected token }'), {
            body: '{bad json}',
            status: 400,
        });
        const result = handle(parseError);
        assert.equal(result.status, 400);
        assert.match(String(result.body?.error), /valid JSON/);
    });

    it('turns an oversized body into a 413', () => {
        const result = handle({ type: 'entity.too.large' });
        assert.equal(result.status, 413);
    });
});

describe('AppError', () => {
    it('exposes client errors but not server errors', () => {
        assert.equal(badRequest('nope').expose, true);
        assert.equal(new AppError(500, 'internal detail').expose, false);
    });

    it('carries a machine-readable code', () => {
        assert.equal(conflict('already exists').code, 'conflict');
    });
});
