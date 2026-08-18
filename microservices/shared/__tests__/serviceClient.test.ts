/**
 * Tests for the inter-service HTTP client.
 *
 * The behaviour that matters is which failures get retried: the old bare
 * fetch retried nothing, so one blip lost a notification permanently, while
 * blindly retrying a 400 just wastes time and can duplicate work.
 */
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { ServiceCallError, callService, callServiceBestEffort } from '../serviceClient';

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

function stubFetch(responses: (Response | Error)[]): { calls: () => number } {
    let index = 0;
    globalThis.fetch = (async () => {
        const next = responses[Math.min(index, responses.length - 1)];
        index += 1;
        if (next instanceof Error) throw next;
        return next;
    }) as typeof fetch;
    return { calls: () => index };
}

const ok = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('callService', () => {
    it('returns the parsed body on success', async () => {
        stubFetch([ok({ request_id: 12 })]);
        const result = await callService<{ request_id: number }>('http://svc/api/x', { attempts: 1 });
        assert.deepEqual(result, { request_id: 12 });
    });

    it('returns null for 204 rather than failing to parse an empty body', async () => {
        stubFetch([new Response(null, { status: 204 })]);
        assert.equal(await callService('http://svc/api/x', { attempts: 1 }), null);
    });

    it('retries a 500 and succeeds on a later attempt', async () => {
        const stub = stubFetch([new Response('boom', { status: 500 }), ok({ fine: true })]);
        const result = await callService<{ fine: boolean }>('http://svc/api/x', { attempts: 3 });
        assert.deepEqual(result, { fine: true });
        assert.equal(stub.calls(), 2);
    });

    it('does not retry a 400, because sending it again will not help', async () => {
        const stub = stubFetch([new Response('bad', { status: 400 })]);
        await assert.rejects(() => callService('http://svc/api/x', { attempts: 3 }), ServiceCallError);
        assert.equal(stub.calls(), 1);
    });

    it('retries a network failure', async () => {
        const stub = stubFetch([new Error('ECONNREFUSED'), ok({ recovered: true })]);
        const result = await callService<{ recovered: boolean }>('http://svc/api/x', { attempts: 3 });
        assert.deepEqual(result, { recovered: true });
        assert.equal(stub.calls(), 2);
    });

    it('gives up after the configured number of attempts', async () => {
        const stub = stubFetch([new Response('boom', { status: 503 })]);
        await assert.rejects(() => callService('http://svc/api/x', { attempts: 2 }), ServiceCallError);
        assert.equal(stub.calls(), 2);
    });

    it('sends the internal token so the receiving service accepts the call', async () => {
        let seen: Record<string, string> | undefined;
        globalThis.fetch = (async (_url: string, init: RequestInit) => {
            seen = init.headers as Record<string, string>;
            return ok({});
        }) as unknown as typeof fetch;

        await callService('http://svc/api/x', { attempts: 1, callerName: 'estimate-service' });
        assert.ok(seen?.['x-internal-token']);
        assert.equal(seen?.['x-calling-service'], 'estimate-service');
    });
});

describe('callServiceBestEffort', () => {
    it('reports failure without throwing, so a notification outage cannot fail the operation', async () => {
        stubFetch([new Response('boom', { status: 500 })]);
        assert.equal(await callServiceBestEffort('http://svc/api/x', { attempts: 1 }), false);
    });

    it('reports success', async () => {
        stubFetch([ok({})]);
        assert.equal(await callServiceBestEffort('http://svc/api/x', { attempts: 1 }), true);
    });
});
