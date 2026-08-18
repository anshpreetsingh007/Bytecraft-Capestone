/**
 * Firebase ID token verification, with no dependencies.
 *
 * Before this existed, not one service checked who was calling it. Every
 * endpoint on ports 3001-3007 was open: anyone who could reach the host could
 * read every customer's details or PATCH themselves to super_admin.
 *
 * Firebase ID tokens are RS256 JWTs signed by Google. Google publishes the
 * matching public keys as a JWKS document, so a token can be verified with
 * nothing but node:crypto and fetch -- no firebase-admin SDK and, crucially,
 * no service-account private key to distribute to seven containers.
 *
 * What gets checked, per Google's published rules:
 *   - RS256, and the kid matches a currently published Google signing key
 *   - signature is valid
 *   - aud === the Firebase project id
 *   - iss === https://securetoken.google.com/<project id>
 *   - exp is in the future, iat and auth_time are not in the future
 *   - sub is present and non-empty (this is the Firebase UID)
 */
import { createPublicKey, createVerify, type KeyObject } from 'node:crypto';
import { unauthorized } from './errors';
import { logger } from './logger';

const JWKS_URL =
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

/**
 * Matches the projectId already hard-coded in the browser bundle
 * (lib/firebase.ts). A Firebase project id is public configuration, not a
 * secret -- defaulting to it means auth works without anyone having to add a
 * new environment variable, while still allowing an override.
 */
const DEFAULT_PROJECT_ID = 'bytecraft-9a520';

/** Tolerance for clock drift between Google, the container, and the browser. */
const CLOCK_SKEW_SECONDS = 60;

const MIN_CACHE_SECONDS = 60;
const MAX_CACHE_SECONDS = 6 * 60 * 60;

export function firebaseProjectId(): string {
    return (
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        DEFAULT_PROJECT_ID
    );
}

interface GoogleJwk {
    kid?: string;
    kty?: string;
    alg?: string;
    n?: string;
    e?: string;
}

interface KeyCache {
    keys: Map<string, KeyObject>;
    expiresAt: number;
}

let keyCache: KeyCache | null = null;
let inflightFetch: Promise<KeyCache> | null = null;

function parseMaxAge(cacheControl: string | null): number {
    const match = cacheControl?.match(/max-age=(\d+)/);
    const seconds = match ? Number(match[1]) : 0;
    if (!Number.isFinite(seconds) || seconds <= 0) return 60 * 60;
    return Math.min(Math.max(seconds, MIN_CACHE_SECONDS), MAX_CACHE_SECONDS);
}

async function fetchSigningKeys(): Promise<KeyCache> {
    const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
        throw new Error(`Google returned ${response.status} for the token signing keys`);
    }

    const body = (await response.json()) as { keys?: GoogleJwk[] };
    const keys = new Map<string, KeyObject>();

    for (const jwk of body.keys ?? []) {
        if (!jwk.kid || jwk.kty !== 'RSA' || !jwk.n || !jwk.e) continue;
        try {
            keys.set(
                jwk.kid,
                createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' }),
            );
        } catch (error) {
            logger.warn('skipped an unusable Google signing key', { kid: jwk.kid, error });
        }
    }

    if (keys.size === 0) throw new Error('Google returned no usable signing keys');

    return {
        keys,
        expiresAt: Date.now() + parseMaxAge(response.headers.get('cache-control')) * 1000,
    };
}

/**
 * Google rotates these keys roughly daily. Cached until the published
 * max-age, and refreshed on demand when a token arrives with an unknown kid
 * so a rotation never causes a window of failed logins. Concurrent misses
 * share one in-flight request.
 */
async function getSigningKey(kid: string, allowRefresh = true): Promise<KeyObject> {
    if (!keyCache || keyCache.expiresAt <= Date.now()) {
        inflightFetch ??= fetchSigningKeys().finally(() => {
            inflightFetch = null;
        });
        keyCache = await inflightFetch;
    }

    const key = keyCache.keys.get(kid);
    if (key) return key;

    if (allowRefresh) {
        keyCache = null;
        return getSigningKey(kid, false);
    }

    throw unauthorized('Your session could not be verified, please sign in again');
}

function decodeBase64Url(segment: string): Buffer {
    return Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function decodeJsonSegment<T>(segment: string, label: string): T {
    try {
        return JSON.parse(decodeBase64Url(segment).toString('utf8')) as T;
    } catch {
        throw unauthorized(`Your session token has a malformed ${label}`);
    }
}

interface TokenHeader {
    alg?: string;
    kid?: string;
    typ?: string;
}

interface TokenPayload {
    iss?: string;
    aud?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
}

export interface VerifiedToken {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    name: string | null;
    expiresAt: number;
}

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedToken> {
    const segments = token.split('.');
    if (segments.length !== 3) throw unauthorized('Your session token is malformed');

    const [encodedHeader, encodedPayload, encodedSignature] = segments;
    const header = decodeJsonSegment<TokenHeader>(encodedHeader, 'header');

    if (header.alg !== 'RS256') {
        // Refusing anything else is what stops the classic "alg: none" and
        // HMAC-confusion forgeries.
        throw unauthorized('Your session token uses an unsupported signing algorithm');
    }
    if (!header.kid) throw unauthorized('Your session token is missing a key id');

    const key = await getSigningKey(header.kid);
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();

    if (!verifier.verify(key, decodeBase64Url(encodedSignature))) {
        throw unauthorized('Your session token signature is not valid');
    }

    const payload = decodeJsonSegment<TokenPayload>(encodedPayload, 'payload');
    const projectId = firebaseProjectId();
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.aud !== projectId) {
        throw unauthorized('Your session token was issued for a different application');
    }
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
        throw unauthorized('Your session token has an unexpected issuer');
    }
    if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
        throw unauthorized('Your session token has no valid subject');
    }
    if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) {
        throw unauthorized('Your session has expired, please sign in again');
    }
    if (typeof payload.iat !== 'number' || payload.iat - CLOCK_SKEW_SECONDS > nowSeconds) {
        throw unauthorized('Your session token was issued in the future');
    }
    if (typeof payload.auth_time === 'number' && payload.auth_time - CLOCK_SKEW_SECONDS > nowSeconds) {
        throw unauthorized('Your session token reports a future sign-in time');
    }

    return {
        uid: payload.sub,
        email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
        emailVerified: payload.email_verified === true,
        name: typeof payload.name === 'string' ? payload.name : null,
        expiresAt: payload.exp * 1000,
    };
}

/** Exposed so tests can start from a known state. */
export function resetSigningKeyCache(): void {
    keyCache = null;
    inflightFetch = null;
}
