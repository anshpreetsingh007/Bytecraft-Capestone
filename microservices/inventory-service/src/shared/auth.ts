// GENERATED FILE -- do not edit.
// Source: microservices/shared/auth.ts
// Regenerate with: npm run sync:shared
/**
 * Authentication and authorisation for every service.
 *
 * The Firebase token proves *who* the caller is. It says nothing about what
 * they are allowed to do, because roles live in Postgres, not in the token.
 * So every request resolves the verified UID to a row in one of the four
 * identity tables and attaches the result as `req.actor`.
 *
 * RoleGuard in the frontend is a redirect, not a security control -- it runs
 * in the user's own browser. This file is the actual boundary.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { DatabasePool } from './db';
import { forbidden, unauthorized } from './errors';
import { logger, tagActor } from './logger';
import { verifyFirebaseIdToken } from './firebaseToken';

export type Role = 'client' | 'inspector' | 'admin' | 'super_admin';

export const ALL_ROLES: readonly Role[] = ['client', 'inspector', 'admin', 'super_admin'];
export const STAFF_ROLES: readonly Role[] = ['inspector', 'admin', 'super_admin'];
export const ADMIN_ROLES: readonly Role[] = ['admin', 'super_admin'];

export interface Actor {
    /** 'user' for a signed-in human, 'service' for an internal service call. */
    kind: 'user' | 'service';
    uid: string;
    role: Role | null;
    id: number | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    serviceName?: string;
}

declare module 'express-serve-static-core' {
    interface Request {
        actor?: Actor;
    }
}

let identityPool: DatabasePool | null = null;

export function configureAuth(pool: DatabasePool): void {
    identityPool = pool;
}

/**
 * Alternative to configureAuth for a service with no database of its own.
 * ai-chatbot-service uses this to resolve identities through auth-service.
 */
export type IdentityResolver = (uid: string, email: string | null) => Promise<Actor>;

let customResolver: IdentityResolver | null = null;

export function configureIdentityResolver(resolver: IdentityResolver): void {
    customResolver = resolver;
}

/**
 * Service-to-service calls (estimate-service asking notification-service to
 * raise an alert) have no end user and therefore no Firebase token. They
 * present a shared secret instead.
 *
 * In production the secret must be configured. In development it falls back to
 * a well-known value with a warning, so a fresh clone still runs.
 */
const DEV_INTERNAL_TOKEN = 'markit-dev-internal-token';

export function internalServiceToken(): string {
    const configured = process.env.INTERNAL_SERVICE_TOKEN;
    if (configured && configured.length >= 16) return configured;

    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'INTERNAL_SERVICE_TOKEN must be set to at least 16 characters in production',
        );
    }
    return DEV_INTERNAL_TOKEN;
}

interface CachedIdentity {
    actor: Actor;
    expiresAt: number;
}

const IDENTITY_CACHE_MS = 30_000;
const identityCache = new Map<string, CachedIdentity>();

/** Called by auth-service when a role changes, so the change is not masked by the cache. */
export function invalidateIdentity(uid?: string): void {
    if (uid) identityCache.delete(uid);
    else identityCache.clear();
}

const RESOLVE_SQL = `
    SELECT 'super_admin' AS role, super_admin_id AS id, first_name, last_name, email, is_active, 4 AS rank
        FROM super_admin WHERE firebase_uid = $1
    UNION ALL
    SELECT 'admin' AS role, admin_id AS id, first_name, last_name, email, is_active, 3 AS rank
        FROM admin WHERE firebase_uid = $1
    UNION ALL
    SELECT 'inspector' AS role, inspector_id AS id, first_name, last_name, email, is_active, 2 AS rank
        FROM inspector WHERE firebase_uid = $1
    UNION ALL
    SELECT 'client' AS role, client_id AS id, first_name, last_name, email, is_active, 1 AS rank
        FROM client WHERE firebase_uid = $1
    ORDER BY rank DESC
`;

interface IdentityRow {
    role: Role;
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    is_active: boolean;
}

async function resolveIdentity(uid: string, email: string | null): Promise<Actor> {
    const cached = identityCache.get(uid);
    if (cached && cached.expiresAt > Date.now()) return cached.actor;

    if (customResolver) {
        const resolved = await customResolver(uid, email);
        identityCache.set(uid, { actor: resolved, expiresAt: Date.now() + IDENTITY_CACHE_MS });
        return resolved;
    }

    if (!identityPool) {
        throw new Error('configureAuth(pool) or configureIdentityResolver() was never called for this service');
    }

    const result = await identityPool.query(RESOLVE_SQL, [uid]);

    // A person can hold rows in more than one table -- everyone starts as a
    // client, and being made an inspector adds a second row rather than moving
    // the first. The effective role is the highest-ranked *active* one, which
    // is also how a demotion works: the staff row is deactivated, not deleted,
    // so foreign keys from past jobs stay intact.
    const active = (result.rows as IdentityRow[]).find((row) => row.is_active !== false);

    if (!active && result.rows.length > 0) {
        throw forbidden('This account has been deactivated. Contact an administrator.');
    }

    // Signed into Firebase but with no Postgres profile yet. This is the
    // normal state between createUserWithEmailAndPassword and
    // /api/auth/register, so it is not an error -- the caller has no role.
    const actor: Actor = active
        ? {
              kind: 'user',
              uid,
              role: active.role,
              id: Number(active.id),
              firstName: active.first_name ?? null,
              lastName: active.last_name ?? null,
              email: active.email ?? email,
          }
        : { kind: 'user', uid, role: null, id: null, firstName: null, lastName: null, email };

    identityCache.set(uid, { actor, expiresAt: Date.now() + IDENTITY_CACHE_MS });
    return actor;
}

function bearerToken(req: Request): string | null {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header) return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
}

function presentedInternalToken(req: Request): string | null {
    return req.header('x-internal-token') ?? null;
}

function timingSafeEquals(a: string, b: string): boolean {
    // Same length check first, then a constant-time-ish comparison. Not
    // security-critical against a remote attacker over HTTP, but cheap.
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let index = 0; index < a.length; index += 1) {
        mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
    }
    return mismatch === 0;
}

/**
 * Resolves the caller if credentials are present, but does not reject when
 * they are absent. Only useful for endpoints that are legitimately public.
 */
export const attachActor: RequestHandler = function attachActor(req, _res, next) {
    void (async () => {
        try {
            const internal = presentedInternalToken(req);
            if (internal && timingSafeEquals(internal, internalServiceToken())) {
                req.actor = {
                    kind: 'service',
                    uid: 'internal',
                    role: null,
                    id: null,
                    firstName: null,
                    lastName: null,
                    email: null,
                    serviceName: req.header('x-calling-service') ?? 'unknown',
                };
                tagActor(`service:${req.actor.serviceName}`);
                next();
                return;
            }

            const token = bearerToken(req);
            if (!token) {
                next();
                return;
            }

            const verified = await verifyFirebaseIdToken(token);
            req.actor = await resolveIdentity(verified.uid, verified.email);
            tagActor(`${req.actor.role ?? 'unregistered'}:${req.actor.id ?? verified.uid}`);
            next();
        } catch (error) {
            next(error);
        }
    })();
};

/** Requires a signed-in Firebase user (or an internal service call). */
export const requireAuth: RequestHandler = function requireAuth(req, res, next) {
    attachActor(req, res, (error?: unknown) => {
        if (error) {
            next(error);
            return;
        }
        if (!req.actor) {
            next(unauthorized('You need to be signed in to do that'));
            return;
        }
        next();
    });
};

export function getActor(req: Request): Actor {
    if (!req.actor) throw unauthorized('You need to be signed in to do that');
    return req.actor;
}

/** Requires the caller to hold one of the listed roles. Internal calls always pass. */
export function requireRole(...roles: Role[]): RequestHandler {
    return function requireRoleMiddleware(req: Request, res: Response, next: NextFunction) {
        requireAuth(req, res, (error?: unknown) => {
            if (error) {
                next(error);
                return;
            }

            const actor = req.actor!;
            if (actor.kind === 'service') {
                next();
                return;
            }

            if (!actor.role) {
                next(forbidden('Your account has not finished registration yet'));
                return;
            }

            if (!roles.includes(actor.role)) {
                logger.warn('role check failed', {
                    required: roles,
                    actual: actor.role,
                    path: req.originalUrl.split('?')[0],
                });
                next(forbidden('You do not have permission to do that'));
                return;
            }

            next();
        });
    };
}

/** Only callable by another service holding the shared secret. */
export const requireInternal: RequestHandler = function requireInternal(req, _res, next) {
    const presented = presentedInternalToken(req);
    if (presented && timingSafeEquals(presented, internalServiceToken())) {
        req.actor = {
            kind: 'service',
            uid: 'internal',
            role: null,
            id: null,
            firstName: null,
            lastName: null,
            email: null,
            serviceName: req.header('x-calling-service') ?? 'unknown',
        };
        tagActor(`service:${req.actor.serviceName}`);
        next();
        return;
    }
    next(forbidden('This endpoint is only callable by other Markit services'));
};

export function isStaff(actor: Actor): boolean {
    return actor.kind === 'service' || (actor.role !== null && STAFF_ROLES.includes(actor.role));
}

export function isAdmin(actor: Actor): boolean {
    return actor.kind === 'service' || (actor.role !== null && ADMIN_ROLES.includes(actor.role));
}

/**
 * A customer may only read their own records. Staff may read anyone's.
 * This is the check that closes the IDOR on every `/client/:clientId` route --
 * those used to accept whatever id was typed into the URL.
 */
export function assertClientAccess(actor: Actor, clientId: number): void {
    if (isStaff(actor)) return;
    if (actor.role === 'client' && actor.id === clientId) return;
    throw forbidden('You can only view your own records');
}

/** An inspector may only read their own queue. Admins may read anyone's. */
export function assertInspectorAccess(actor: Actor, inspectorId: number): void {
    if (isAdmin(actor)) return;
    if (actor.role === 'inspector' && actor.id === inspectorId) return;
    throw forbidden('You can only view your own assignments');
}

/** Notifications belong to one recipient and nobody else, staff included. */
export function assertNotificationRecipient(actor: Actor, recipientType: string, recipientId: number): void {
    if (actor.kind === 'service') return;
    if (actor.role === recipientType && actor.id === recipientId) return;
    throw forbidden('You can only view your own notifications');
}
