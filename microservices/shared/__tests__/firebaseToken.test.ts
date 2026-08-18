/**
 * Tests for Firebase ID token verification.
 *
 * This is the boundary that replaced "no authentication anywhere", so the
 * forgery cases matter more than the happy path. Google's JWKS endpoint is
 * stubbed with a locally generated key pair, so the tests need no network.
 */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto';

import { AppError } from '../errors';
import { resetSigningKeyCache, verifyFirebaseIdToken } from '../firebaseToken';

const PROJECT_ID = 'bytecraft-9a520';
const KID = 'test-key-1';

const originalFetch = globalThis.fetch;
let privateKey: KeyObject;
let publicKey: KeyObject;

function base64url(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

interface TokenOptions {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    alg?: string;
    kid?: string;
    signingKey?: KeyObject;
}

function makeToken(options: TokenOptions = {}): string {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url({ alg: options.alg ?? 'RS256', kid: options.kid ?? KID, typ: 'JWT' });
    const payload = base64url({
        iss: options.iss ?? `https://securetoken.google.com/${PROJECT_ID}`,
        aud: options.aud ?? PROJECT_ID,
        sub: options.sub ?? 'firebase-uid-123',
        iat: options.iat ?? now - 30,
        exp: options.exp ?? now + 3600,
        email: 'CUSTOMER@Example.com',
        email_verified: true,
    });

    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    signer.end();
    const signature = signer.sign(options.signingKey ?? privateKey).toString('base64url');

    return `${header}.${payload}.${signature}`;
}

beforeEach(() => {
    const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;

    const jwk = publicKey.export({ format: 'jwk' });
    resetSigningKeyCache();

    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }), {
            status: 200,
            headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' },
        })) as typeof fetch;

    process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    resetSigningKeyCache();
});

async function expectUnauthorized(token: string): Promise<void> {
    try {
        await verifyFirebaseIdToken(token);
    } catch (error) {
        assert.ok(error instanceof AppError, 'expected an AppError');
        assert.equal(error.status, 401);
        return;
    }
    assert.fail('expected the token to be rejected');
}

describe('verifyFirebaseIdToken', () => {
    it('accepts a properly signed token', async () => {
        const verified = await verifyFirebaseIdToken(makeToken());
        assert.equal(verified.uid, 'firebase-uid-123');
        assert.equal(verified.emailVerified, true);
    });

    it('lowercases the email so lookups are consistent', async () => {
        const verified = await verifyFirebaseIdToken(makeToken());
        assert.equal(verified.email, 'customer@example.com');
    });

    it('rejects a token whose payload was tampered with', async () => {
        const token = makeToken();
        const [header, , signature] = token.split('.');
        const forged = base64url({
            iss: `https://securetoken.google.com/${PROJECT_ID}`,
            aud: PROJECT_ID,
            sub: 'somebody-elses-uid',
            iat: Math.floor(Date.now() / 1000) - 30,
            exp: Math.floor(Date.now() / 1000) + 3600,
        });
        await expectUnauthorized(`${header}.${forged}.${signature}`);
    });

    it('rejects a token signed by a different key', async () => {
        const attacker = generateKeyPairSync('rsa', { modulusLength: 2048 });
        await expectUnauthorized(makeToken({ signingKey: attacker.privateKey }));
    });

    it('rejects alg: none, the classic JWT forgery', async () => {
        await expectUnauthorized(makeToken({ alg: 'none' }));
    });

    it('rejects HS256, which would allow signing with the public key', async () => {
        await expectUnauthorized(makeToken({ alg: 'HS256' }));
    });

    it('rejects an expired token', async () => {
        const past = Math.floor(Date.now() / 1000) - 7200;
        await expectUnauthorized(makeToken({ exp: past, iat: past - 3600 }));
    });

    it('rejects a token issued for a different Firebase project', async () => {
        await expectUnauthorized(makeToken({ aud: 'some-other-project' }));
    });

    it('rejects a token with the wrong issuer', async () => {
        await expectUnauthorized(makeToken({ iss: 'https://evil.example.com/' }));
    });

    it('rejects a token with no subject', async () => {
        await expectUnauthorized(makeToken({ sub: '' }));
    });

    it('rejects a malformed token', async () => {
        await expectUnauthorized('not.a.token');
        await expectUnauthorized('onlyonesegment');
    });

    it('rejects a token signed with a key id Google does not publish', async () => {
        await expectUnauthorized(makeToken({ kid: 'unknown-kid' }));
    });
});
