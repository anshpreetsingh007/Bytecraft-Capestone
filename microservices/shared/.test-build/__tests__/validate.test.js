"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for the shared validation helpers.
 *
 * Uses node:test, which ships with Node 22 -- no test framework to install,
 * and no extra dependency in seven services.
 *
 * Run with: npm test
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const errors_1 = require("../errors");
const validate_1 = require("../validate");
/** Minimal stand-in for the parts of a Request the helpers touch. */
function fakeRequest(query = {}, params = {}) {
    return { query, params };
}
function expectStatus(status, run) {
    try {
        run();
    }
    catch (error) {
        strict_1.default.ok(error instanceof errors_1.AppError, 'expected an AppError');
        strict_1.default.equal(error.status, status);
        return error;
    }
    strict_1.default.fail('expected the call to throw');
}
(0, node_test_1.describe)('requireString', () => {
    (0, node_test_1.it)('trims and returns valid text', () => {
        strict_1.default.equal((0, validate_1.requireString)('  hello  ', 'name'), 'hello');
    });
    (0, node_test_1.it)('rejects a non-string', () => {
        expectStatus(400, () => (0, validate_1.requireString)(42, 'name'));
    });
    (0, node_test_1.it)('rejects whitespace-only input', () => {
        expectStatus(400, () => (0, validate_1.requireString)('   ', 'name'));
    });
    (0, node_test_1.it)('enforces the maximum length', () => {
        expectStatus(400, () => (0, validate_1.requireString)('x'.repeat(60), 'name', { max: 50 }));
    });
});
(0, node_test_1.describe)('requireInt', () => {
    (0, node_test_1.it)('accepts a numeric string, which is what query params always are', () => {
        strict_1.default.equal((0, validate_1.requireInt)('7', 'page'), 7);
    });
    (0, node_test_1.it)('rejects a decimal', () => {
        expectStatus(400, () => (0, validate_1.requireInt)('7.5', 'page'));
    });
    (0, node_test_1.it)('rejects NaN rather than passing it into SQL', () => {
        // parseInt(undefined) used to reach a WHERE clause as NaN.
        expectStatus(400, () => (0, validate_1.requireInt)(undefined, 'page'));
        expectStatus(400, () => (0, validate_1.requireInt)('abc', 'page'));
    });
    (0, node_test_1.it)('enforces the range', () => {
        expectStatus(400, () => (0, validate_1.requireInt)('0', 'page', { min: 1 }));
        expectStatus(400, () => (0, validate_1.requireInt)('999', 'page', { max: 100 }));
    });
});
(0, node_test_1.describe)('requireEnum', () => {
    const STATUSES = ['pending', 'assigned', 'completed'];
    (0, node_test_1.it)('accepts a known value regardless of case', () => {
        strict_1.default.equal((0, validate_1.requireEnum)('PENDING', 'status', STATUSES), 'pending');
    });
    (0, node_test_1.it)('rejects anything outside the set', () => {
        const error = expectStatus(400, () => (0, validate_1.requireEnum)('deleted', 'status', STATUSES));
        strict_1.default.match(error.message, /pending/);
    });
});
(0, node_test_1.describe)('idParam', () => {
    (0, node_test_1.it)('reads a positive integer path parameter', () => {
        strict_1.default.equal((0, validate_1.idParam)(fakeRequest({}, { id: '12' })), 12);
    });
    (0, node_test_1.it)('rejects a non-numeric id instead of querying with NaN', () => {
        expectStatus(400, () => (0, validate_1.idParam)(fakeRequest({}, { id: 'abc' })));
    });
    (0, node_test_1.it)('rejects a negative id', () => {
        expectStatus(400, () => (0, validate_1.idParam)(fakeRequest({}, { id: '-1' })));
    });
});
(0, node_test_1.describe)('pagination', () => {
    (0, node_test_1.it)('defaults to page one', () => {
        strict_1.default.deepEqual((0, validate_1.pagination)(fakeRequest()), { limit: 25, offset: 0, page: 1 });
    });
    (0, node_test_1.it)('converts a page number into an offset', () => {
        strict_1.default.deepEqual((0, validate_1.pagination)(fakeRequest({ page: '3', limit: '10' })), {
            limit: 10,
            offset: 20,
            page: 3,
        });
    });
    (0, node_test_1.it)('refuses a page size above the cap', () => {
        // This is what stops a caller asking for the whole table.
        expectStatus(400, () => (0, validate_1.pagination)(fakeRequest({ limit: '5000' })));
    });
    (0, node_test_1.it)('accepts an explicit offset', () => {
        strict_1.default.deepEqual((0, validate_1.pagination)(fakeRequest({ offset: '40', limit: '20' })), {
            limit: 20,
            offset: 40,
            page: 3,
        });
    });
});
(0, node_test_1.describe)('toPage', () => {
    (0, node_test_1.it)('reports there is more to fetch', () => {
        const page = (0, validate_1.toPage)([1, 2, 3], 30, { limit: 3, offset: 0, page: 1 });
        strict_1.default.equal(page.pagination.totalPages, 10);
        strict_1.default.equal(page.pagination.hasMore, true);
    });
    (0, node_test_1.it)('reports the last page correctly', () => {
        const page = (0, validate_1.toPage)([1], 10, { limit: 3, offset: 9, page: 4 });
        strict_1.default.equal(page.pagination.hasMore, false);
    });
    (0, node_test_1.it)('never reports zero total pages', () => {
        const page = (0, validate_1.toPage)([], 0, { limit: 25, offset: 0, page: 1 });
        strict_1.default.equal(page.pagination.totalPages, 1);
    });
});
(0, node_test_1.describe)('requireTimestamp', () => {
    (0, node_test_1.it)('parses an ISO instant', () => {
        const parsed = (0, validate_1.requireTimestamp)('2026-09-01T14:30:00.000Z', 'scheduled_date');
        strict_1.default.equal(parsed.toISOString(), '2026-09-01T14:30:00.000Z');
    });
    (0, node_test_1.it)('rejects nonsense', () => {
        expectStatus(400, () => (0, validate_1.requireTimestamp)('not a date', 'scheduled_date'));
    });
});
(0, node_test_1.describe)('sanitizeText', () => {
    (0, node_test_1.it)('keeps newlines, because inspection notes are multi-line', () => {
        strict_1.default.equal((0, validate_1.sanitizeText)('line one\nline two'), 'line one\nline two');
    });
    (0, node_test_1.it)('strips control characters', () => {
        const withControls = `clean${String.fromCharCode(7)}text${String.fromCharCode(0)}`;
        strict_1.default.equal((0, validate_1.sanitizeText)(withControls), 'cleantext');
    });
    (0, node_test_1.it)('trims surrounding whitespace', () => {
        strict_1.default.equal((0, validate_1.sanitizeText)('  padded  '), 'padded');
    });
});
(0, node_test_1.describe)('optionalString', () => {
    (0, node_test_1.it)('maps empty input to null rather than an empty string', () => {
        strict_1.default.equal((0, validate_1.optionalString)('', 'note'), null);
        strict_1.default.equal((0, validate_1.optionalString)(undefined, 'note'), null);
        strict_1.default.equal((0, validate_1.optionalString)(null, 'note'), null);
    });
    (0, node_test_1.it)('still validates anything that is present', () => {
        expectStatus(400, () => (0, validate_1.optionalString)('x'.repeat(300), 'note', { max: 250 }));
    });
});
