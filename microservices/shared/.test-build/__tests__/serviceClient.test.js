"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for the inter-service HTTP client.
 *
 * The behaviour that matters is which failures get retried: the old bare
 * fetch retried nothing, so one blip lost a notification permanently, while
 * blindly retrying a 400 just wastes time and can duplicate work.
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const serviceClient_1 = require("../serviceClient");
const originalFetch = globalThis.fetch;
(0, node_test_1.afterEach)(() => {
    globalThis.fetch = originalFetch;
});
function stubFetch(responses) {
    let index = 0;
    globalThis.fetch = (async () => {
        const next = responses[Math.min(index, responses.length - 1)];
        index += 1;
        if (next instanceof Error)
            throw next;
        return next;
    });
    return { calls: () => index };
}
const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
(0, node_test_1.describe)('callService', () => {
    (0, node_test_1.it)('returns the parsed body on success', async () => {
        stubFetch([ok({ request_id: 12 })]);
        const result = await (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 1 });
        strict_1.default.deepEqual(result, { request_id: 12 });
    });
    (0, node_test_1.it)('returns null for 204 rather than failing to parse an empty body', async () => {
        stubFetch([new Response(null, { status: 204 })]);
        strict_1.default.equal(await (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 1 }), null);
    });
    (0, node_test_1.it)('retries a 500 and succeeds on a later attempt', async () => {
        const stub = stubFetch([new Response('boom', { status: 500 }), ok({ fine: true })]);
        const result = await (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 3 });
        strict_1.default.deepEqual(result, { fine: true });
        strict_1.default.equal(stub.calls(), 2);
    });
    (0, node_test_1.it)('does not retry a 400, because sending it again will not help', async () => {
        const stub = stubFetch([new Response('bad', { status: 400 })]);
        await strict_1.default.rejects(() => (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 3 }), serviceClient_1.ServiceCallError);
        strict_1.default.equal(stub.calls(), 1);
    });
    (0, node_test_1.it)('retries a network failure', async () => {
        const stub = stubFetch([new Error('ECONNREFUSED'), ok({ recovered: true })]);
        const result = await (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 3 });
        strict_1.default.deepEqual(result, { recovered: true });
        strict_1.default.equal(stub.calls(), 2);
    });
    (0, node_test_1.it)('gives up after the configured number of attempts', async () => {
        const stub = stubFetch([new Response('boom', { status: 503 })]);
        await strict_1.default.rejects(() => (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 2 }), serviceClient_1.ServiceCallError);
        strict_1.default.equal(stub.calls(), 2);
    });
    (0, node_test_1.it)('sends the internal token so the receiving service accepts the call', async () => {
        let seen;
        globalThis.fetch = (async (_url, init) => {
            seen = init.headers;
            return ok({});
        });
        await (0, serviceClient_1.callService)('http://svc/api/x', { attempts: 1, callerName: 'estimate-service' });
        strict_1.default.ok(seen?.['x-internal-token']);
        strict_1.default.equal(seen?.['x-calling-service'], 'estimate-service');
    });
});
(0, node_test_1.describe)('callServiceBestEffort', () => {
    (0, node_test_1.it)('reports failure without throwing, so a notification outage cannot fail the operation', async () => {
        stubFetch([new Response('boom', { status: 500 })]);
        strict_1.default.equal(await (0, serviceClient_1.callServiceBestEffort)('http://svc/api/x', { attempts: 1 }), false);
    });
    (0, node_test_1.it)('reports success', async () => {
        stubFetch([ok({})]);
        strict_1.default.equal(await (0, serviceClient_1.callServiceBestEffort)('http://svc/api/x', { attempts: 1 }), true);
    });
});
