/**
 * Tests for the shared validation helpers.
 *
 * Uses node:test, which ships with Node 22 -- no test framework to install,
 * and no extra dependency in seven services.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';

import { AppError } from '../errors';
import {
    idParam,
    optionalString,
    pagination,
    requireEnum,
    requireInt,
    requireString,
    requireTimestamp,
    sanitizeText,
    toPage,
} from '../validate';

/** Minimal stand-in for the parts of a Request the helpers touch. */
function fakeRequest(query: Record<string, unknown> = {}, params: Record<string, string> = {}): Request {
    return { query, params } as unknown as Request;
}

function expectStatus(status: number, run: () => unknown): AppError {
    try {
        run();
    } catch (error) {
        assert.ok(error instanceof AppError, 'expected an AppError');
        assert.equal(error.status, status);
        return error;
    }
    assert.fail('expected the call to throw');
}

describe('requireString', () => {
    it('trims and returns valid text', () => {
        assert.equal(requireString('  hello  ', 'name'), 'hello');
    });

    it('rejects a non-string', () => {
        expectStatus(400, () => requireString(42, 'name'));
    });

    it('rejects whitespace-only input', () => {
        expectStatus(400, () => requireString('   ', 'name'));
    });

    it('enforces the maximum length', () => {
        expectStatus(400, () => requireString('x'.repeat(60), 'name', { max: 50 }));
    });
});

describe('requireInt', () => {
    it('accepts a numeric string, which is what query params always are', () => {
        assert.equal(requireInt('7', 'page'), 7);
    });

    it('rejects a decimal', () => {
        expectStatus(400, () => requireInt('7.5', 'page'));
    });

    it('rejects NaN rather than passing it into SQL', () => {
        // parseInt(undefined) used to reach a WHERE clause as NaN.
        expectStatus(400, () => requireInt(undefined, 'page'));
        expectStatus(400, () => requireInt('abc', 'page'));
    });

    it('enforces the range', () => {
        expectStatus(400, () => requireInt('0', 'page', { min: 1 }));
        expectStatus(400, () => requireInt('999', 'page', { max: 100 }));
    });
});

describe('requireEnum', () => {
    const STATUSES = ['pending', 'assigned', 'completed'] as const;

    it('accepts a known value regardless of case', () => {
        assert.equal(requireEnum('PENDING', 'status', STATUSES), 'pending');
    });

    it('rejects anything outside the set', () => {
        const error = expectStatus(400, () => requireEnum('deleted', 'status', STATUSES));
        assert.match(error.message, /pending/);
    });
});

describe('idParam', () => {
    it('reads a positive integer path parameter', () => {
        assert.equal(idParam(fakeRequest({}, { id: '12' })), 12);
    });

    it('rejects a non-numeric id instead of querying with NaN', () => {
        expectStatus(400, () => idParam(fakeRequest({}, { id: 'abc' })));
    });

    it('rejects a negative id', () => {
        expectStatus(400, () => idParam(fakeRequest({}, { id: '-1' })));
    });
});

describe('pagination', () => {
    it('defaults to page one', () => {
        assert.deepEqual(pagination(fakeRequest()), { limit: 25, offset: 0, page: 1 });
    });

    it('converts a page number into an offset', () => {
        assert.deepEqual(pagination(fakeRequest({ page: '3', limit: '10' })), {
            limit: 10,
            offset: 20,
            page: 3,
        });
    });

    it('refuses a page size above the cap', () => {
        // This is what stops a caller asking for the whole table.
        expectStatus(400, () => pagination(fakeRequest({ limit: '5000' })));
    });

    it('accepts an explicit offset', () => {
        assert.deepEqual(pagination(fakeRequest({ offset: '40', limit: '20' })), {
            limit: 20,
            offset: 40,
            page: 3,
        });
    });
});

describe('toPage', () => {
    it('reports there is more to fetch', () => {
        const page = toPage([1, 2, 3], 30, { limit: 3, offset: 0, page: 1 });
        assert.equal(page.pagination.totalPages, 10);
        assert.equal(page.pagination.hasMore, true);
    });

    it('reports the last page correctly', () => {
        const page = toPage([1], 10, { limit: 3, offset: 9, page: 4 });
        assert.equal(page.pagination.hasMore, false);
    });

    it('never reports zero total pages', () => {
        const page = toPage([], 0, { limit: 25, offset: 0, page: 1 });
        assert.equal(page.pagination.totalPages, 1);
    });
});

describe('requireTimestamp', () => {
    it('parses an ISO instant', () => {
        const parsed = requireTimestamp('2026-09-01T14:30:00.000Z', 'scheduled_date');
        assert.equal(parsed.toISOString(), '2026-09-01T14:30:00.000Z');
    });

    it('rejects nonsense', () => {
        expectStatus(400, () => requireTimestamp('not a date', 'scheduled_date'));
    });
});

describe('sanitizeText', () => {
    it('keeps newlines, because inspection notes are multi-line', () => {
        assert.equal(sanitizeText('line one\nline two'), 'line one\nline two');
    });

    it('strips control characters', () => {
        const withControls = `clean${String.fromCharCode(7)}text${String.fromCharCode(0)}`;
        assert.equal(sanitizeText(withControls), 'cleantext');
    });

    it('trims surrounding whitespace', () => {
        assert.equal(sanitizeText('  padded  '), 'padded');
    });
});

describe('optionalString', () => {
    it('maps empty input to null rather than an empty string', () => {
        assert.equal(optionalString('', 'note'), null);
        assert.equal(optionalString(undefined, 'note'), null);
        assert.equal(optionalString(null, 'note'), null);
    });

    it('still validates anything that is present', () => {
        expectStatus(400, () => optionalString('x'.repeat(300), 'note', { max: 250 }));
    });
});
