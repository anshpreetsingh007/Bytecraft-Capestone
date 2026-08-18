"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for the in-process rate limiter. Only the chatbot was limited before,
 * which left the auth and submission endpoints open to being hammered.
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const errors_1 = require("../errors");
const rateLimit_1 = require("../rateLimit");
function fakeRequest(ip = '1.2.3.4') {
    return {
        header: () => undefined,
        socket: { remoteAddress: ip },
    };
}
function fakeResponse() {
    return { setHeader: () => undefined };
}
/** Runs the middleware once and reports what it passed to next(). */
function run(middleware, request) {
    let passed;
    const next = ((error) => {
        passed = error;
    });
    middleware(request, fakeResponse(), next);
    return passed;
}
(0, node_test_1.describe)('rateLimit', () => {
    (0, node_test_1.it)('allows requests up to the limit', () => {
        const middleware = (0, rateLimit_1.rateLimit)({ max: 3, windowMs: 60_000 });
        const request = fakeRequest();
        strict_1.default.equal(run(middleware, request), undefined);
        strict_1.default.equal(run(middleware, request), undefined);
        strict_1.default.equal(run(middleware, request), undefined);
    });
    (0, node_test_1.it)('rejects the request after the limit with a 429', () => {
        const middleware = (0, rateLimit_1.rateLimit)({ max: 2, windowMs: 60_000 });
        const request = fakeRequest();
        run(middleware, request);
        run(middleware, request);
        const error = run(middleware, request);
        strict_1.default.ok(error instanceof errors_1.AppError);
        strict_1.default.equal(error.status, 429);
    });
    (0, node_test_1.it)('counts each caller separately', () => {
        const middleware = (0, rateLimit_1.rateLimit)({ max: 1, windowMs: 60_000 });
        strict_1.default.equal(run(middleware, fakeRequest('1.1.1.1')), undefined);
        // A different IP starts with its own budget.
        strict_1.default.equal(run(middleware, fakeRequest('2.2.2.2')), undefined);
        // The first one is now over.
        strict_1.default.ok(run(middleware, fakeRequest('1.1.1.1')) instanceof errors_1.AppError);
    });
    (0, node_test_1.it)('starts a fresh window once the old one expires', async () => {
        const middleware = (0, rateLimit_1.rateLimit)({ max: 1, windowMs: 20 });
        const request = fakeRequest();
        strict_1.default.equal(run(middleware, request), undefined);
        strict_1.default.ok(run(middleware, request) instanceof errors_1.AppError);
        await new Promise((resolve) => setTimeout(resolve, 30));
        strict_1.default.equal(run(middleware, request), undefined);
    });
});
