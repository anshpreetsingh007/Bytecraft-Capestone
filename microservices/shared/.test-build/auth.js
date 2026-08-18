"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInternal = exports.requireAuth = exports.attachActor = exports.ADMIN_ROLES = exports.STAFF_ROLES = exports.ALL_ROLES = void 0;
exports.configureAuth = configureAuth;
exports.configureIdentityResolver = configureIdentityResolver;
exports.internalServiceToken = internalServiceToken;
exports.invalidateIdentity = invalidateIdentity;
exports.getActor = getActor;
exports.requireRole = requireRole;
exports.isStaff = isStaff;
exports.isAdmin = isAdmin;
exports.assertClientAccess = assertClientAccess;
exports.assertInspectorAccess = assertInspectorAccess;
exports.assertNotificationRecipient = assertNotificationRecipient;
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const firebaseToken_1 = require("./firebaseToken");
exports.ALL_ROLES = ['client', 'inspector', 'admin', 'super_admin'];
exports.STAFF_ROLES = ['inspector', 'admin', 'super_admin'];
exports.ADMIN_ROLES = ['admin', 'super_admin'];
let identityPool = null;
function configureAuth(pool) {
    identityPool = pool;
}
let customResolver = null;
function configureIdentityResolver(resolver) {
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
function internalServiceToken() {
    const configured = process.env.INTERNAL_SERVICE_TOKEN;
    if (configured && configured.length >= 16)
        return configured;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('INTERNAL_SERVICE_TOKEN must be set to at least 16 characters in production');
    }
    return DEV_INTERNAL_TOKEN;
}
const IDENTITY_CACHE_MS = 30_000;
const identityCache = new Map();
/** Called by auth-service when a role changes, so the change is not masked by the cache. */
function invalidateIdentity(uid) {
    if (uid)
        identityCache.delete(uid);
    else
        identityCache.clear();
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
async function resolveIdentity(uid, email) {
    const cached = identityCache.get(uid);
    if (cached && cached.expiresAt > Date.now())
        return cached.actor;
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
    const active = result.rows.find((row) => row.is_active !== false);
    if (!active && result.rows.length > 0) {
        throw (0, errors_1.forbidden)('This account has been deactivated. Contact an administrator.');
    }
    // Signed into Firebase but with no Postgres profile yet. This is the
    // normal state between createUserWithEmailAndPassword and
    // /api/auth/register, so it is not an error -- the caller has no role.
    const actor = active
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
function bearerToken(req) {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header)
        return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
}
function presentedInternalToken(req) {
    return req.header('x-internal-token') ?? null;
}
function timingSafeEquals(a, b) {
    // Same length check first, then a constant-time-ish comparison. Not
    // security-critical against a remote attacker over HTTP, but cheap.
    if (a.length !== b.length)
        return false;
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
const attachActor = function attachActor(req, _res, next) {
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
                (0, logger_1.tagActor)(`service:${req.actor.serviceName}`);
                next();
                return;
            }
            const token = bearerToken(req);
            if (!token) {
                next();
                return;
            }
            const verified = await (0, firebaseToken_1.verifyFirebaseIdToken)(token);
            req.actor = await resolveIdentity(verified.uid, verified.email);
            (0, logger_1.tagActor)(`${req.actor.role ?? 'unregistered'}:${req.actor.id ?? verified.uid}`);
            next();
        }
        catch (error) {
            next(error);
        }
    })();
};
exports.attachActor = attachActor;
/** Requires a signed-in Firebase user (or an internal service call). */
const requireAuth = function requireAuth(req, res, next) {
    (0, exports.attachActor)(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        if (!req.actor) {
            next((0, errors_1.unauthorized)('You need to be signed in to do that'));
            return;
        }
        next();
    });
};
exports.requireAuth = requireAuth;
function getActor(req) {
    if (!req.actor)
        throw (0, errors_1.unauthorized)('You need to be signed in to do that');
    return req.actor;
}
/** Requires the caller to hold one of the listed roles. Internal calls always pass. */
function requireRole(...roles) {
    return function requireRoleMiddleware(req, res, next) {
        (0, exports.requireAuth)(req, res, (error) => {
            if (error) {
                next(error);
                return;
            }
            const actor = req.actor;
            if (actor.kind === 'service') {
                next();
                return;
            }
            if (!actor.role) {
                next((0, errors_1.forbidden)('Your account has not finished registration yet'));
                return;
            }
            if (!roles.includes(actor.role)) {
                logger_1.logger.warn('role check failed', {
                    required: roles,
                    actual: actor.role,
                    path: req.originalUrl.split('?')[0],
                });
                next((0, errors_1.forbidden)('You do not have permission to do that'));
                return;
            }
            next();
        });
    };
}
/** Only callable by another service holding the shared secret. */
const requireInternal = function requireInternal(req, _res, next) {
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
        (0, logger_1.tagActor)(`service:${req.actor.serviceName}`);
        next();
        return;
    }
    next((0, errors_1.forbidden)('This endpoint is only callable by other Markit services'));
};
exports.requireInternal = requireInternal;
function isStaff(actor) {
    return actor.kind === 'service' || (actor.role !== null && exports.STAFF_ROLES.includes(actor.role));
}
function isAdmin(actor) {
    return actor.kind === 'service' || (actor.role !== null && exports.ADMIN_ROLES.includes(actor.role));
}
/**
 * A customer may only read their own records. Staff may read anyone's.
 * This is the check that closes the IDOR on every `/client/:clientId` route --
 * those used to accept whatever id was typed into the URL.
 */
function assertClientAccess(actor, clientId) {
    if (isStaff(actor))
        return;
    if (actor.role === 'client' && actor.id === clientId)
        return;
    throw (0, errors_1.forbidden)('You can only view your own records');
}
/** An inspector may only read their own queue. Admins may read anyone's. */
function assertInspectorAccess(actor, inspectorId) {
    if (isAdmin(actor))
        return;
    if (actor.role === 'inspector' && actor.id === inspectorId)
        return;
    throw (0, errors_1.forbidden)('You can only view your own assignments');
}
/** Notifications belong to one recipient and nobody else, staff included. */
function assertNotificationRecipient(actor, recipientType, recipientId) {
    if (actor.kind === 'service')
        return;
    if (actor.role === recipientType && actor.id === recipientId)
        return;
    throw (0, errors_1.forbidden)('You can only view your own notifications');
}
