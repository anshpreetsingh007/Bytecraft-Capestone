"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests for Firebase ID token verification.
 *
 * This is the boundary that replaced "no authentication anywhere", so the
 * forgery cases matter more than the happy path. Google's JWKS endpoint is
 * stubbed with a locally generated key pair, so the tests need no network.
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../errors");
const firebaseToken_1 = require("../firebaseToken");
const PROJECT_ID = 'bytecraft-9a520';
const KID = 'test-key-1';
const originalFetch = globalThis.fetch;
let privateKey;
let publicKey;
function base64url(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}
function makeToken(options = {}) {
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
    const signer = (0, node_crypto_1.createSign)('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    signer.end();
    const signature = signer.sign(options.signingKey ?? privateKey).toString('base64url');
    return `${header}.${payload}.${signature}`;
}
(0, node_test_1.beforeEach)(() => {
    const pair = (0, node_crypto_1.generateKeyPairSync)('rsa', { modulusLength: 2048 });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
    const jwk = publicKey.export({ format: 'jwk' });
    (0, firebaseToken_1.resetSigningKeyCache)();
    globalThis.fetch = (async () => new Response(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' },
    }));
    process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
});
(0, node_test_1.afterEach)(() => {
    globalThis.fetch = originalFetch;
    (0, firebaseToken_1.resetSigningKeyCache)();
});
async function expectUnauthorized(token) {
    try {
        await (0, firebaseToken_1.verifyFirebaseIdToken)(token);
    }
    catch (error) {
        strict_1.default.ok(error instanceof errors_1.AppError, 'expected an AppError');
        strict_1.default.equal(error.status, 401);
        return;
    }
    strict_1.default.fail('expected the token to be rejected');
}
(0, node_test_1.describe)('verifyFirebaseIdToken', () => {
    (0, node_test_1.it)('accepts a properly signed token', async () => {
        const verified = await (0, firebaseToken_1.verifyFirebaseIdToken)(makeToken());
        strict_1.default.equal(verified.uid, 'firebase-uid-123');
        strict_1.default.equal(verified.emailVerified, true);
    });
    (0, node_test_1.it)('lowercases the email so lookups are consistent', async () => {
        const verified = await (0, firebaseToken_1.verifyFirebaseIdToken)(makeToken());
        strict_1.default.equal(verified.email, 'customer@example.com');
    });
    (0, node_test_1.it)('rejects a token whose payload was tampered with', async () => {
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
    (0, node_test_1.it)('rejects a token signed by a different key', async () => {
        const attacker = (0, node_crypto_1.generateKeyPairSync)('rsa', { modulusLength: 2048 });
        await expectUnauthorized(makeToken({ signingKey: attacker.privateKey }));
    });
    (0, node_test_1.it)('rejects alg: none, the classic JWT forgery', async () => {
        await expectUnauthorized(makeToken({ alg: 'none' }));
    });
    (0, node_test_1.it)('rejects HS256, which would allow signing with the public key', async () => {
        await expectUnauthorized(makeToken({ alg: 'HS256' }));
    });
    (0, node_test_1.it)('rejects an expired token', async () => {
        const past = Math.floor(Date.now() / 1000) - 7200;
        await expectUnauthorized(makeToken({ exp: past, iat: past - 3600 }));
    });
    (0, node_test_1.it)('rejects a token issued for a different Firebase project', async () => {
        await expectUnauthorized(makeToken({ aud: 'some-other-project' }));
    });
    (0, node_test_1.it)('rejects a token with the wrong issuer', async () => {
        await expectUnauthorized(makeToken({ iss: 'https://evil.example.com/' }));
    });
    (0, node_test_1.it)('rejects a token with no subject', async () => {
        await expectUnauthorized(makeToken({ sub: '' }));
    });
    (0, node_test_1.it)('rejects a malformed token', async () => {
        await expectUnauthorized('not.a.token');
        await expectUnauthorized('onlyonesegment');
    });
    (0, node_test_1.it)('rejects a token signed with a key id Google does not publish', async () => {
        await expectUnauthorized(makeToken({ kid: 'unknown-kid' }));
    });
});
