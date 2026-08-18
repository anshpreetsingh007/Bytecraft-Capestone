import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { ASSIGNABLE_ROLES, type UserRole } from '../models/model';
import { pool } from '../config/db';
import {
    badRequest,
    forbidden,
    getActor,
    notFound,
    optionalString,
    pagination,
    recordAudit,
    requireBoolean,
    requireEmail,
    requireEnum,
    requireString,
    optionalPhone,
    sanitizeText,
    toPage,
} from '../shared';

/** The consent text version a signup is agreeing to. Bump when the policy changes. */
const CURRENT_CONSENT_VERSION = '2026-08-v1';

/**
 * GET /api/auth/me
 * The profile of whoever is holding the token. This is what the frontend
 * should use; /resolve/:uid is kept for compatibility.
 */
export async function me(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    if (!actor.role || actor.id === null) {
        // Signed into Firebase but /register has not run yet.
        res.status(404).json({ error: 'No matching user record found', code: 'not_registered' });
        return;
    }

    res.json({
        role: actor.role,
        id: actor.id,
        firstName: actor.firstName,
        lastName: actor.lastName,
        email: actor.email,
    });
}

/**
 * GET /api/auth/resolve/:firebaseUid
 * You may resolve your own UID; staff may resolve anyone's. Previously this
 * was open, so anybody could map a UID to a name, email and role.
 */
export async function resolve(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const firebaseUid = requireString(req.params.firebaseUid, 'firebaseUid', { max: 128 });

    const isSelf = actor.uid === firebaseUid;
    const isStaffMember = actor.role === 'admin' || actor.role === 'super_admin';
    if (!isSelf && !isStaffMember && actor.kind !== 'service') {
        throw forbidden('You can only look up your own account');
    }

    const user = await authService.resolveByFirebaseUid(firebaseUid);
    if (!user) {
        res.status(404).json({ error: 'No matching user record found', code: 'not_registered' });
        return;
    }

    res.json(user);
}

/**
 * POST /api/auth/register
 * Called straight after Firebase signup. The UID and email come from the
 * verified token, not the request body -- otherwise anyone could create a
 * profile against somebody else's UID.
 */
export async function register(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    if (actor.role) {
        throw badRequest('This account is already registered');
    }

    const bodyUid = optionalString(req.body.firebase_uid, 'firebase_uid', { max: 128 });
    if (bodyUid && bodyUid !== actor.uid) {
        throw forbidden('You can only register your own account');
    }

    const acceptedTerms =
        req.body.accepted_terms === undefined ? true : requireBoolean(req.body.accepted_terms, 'accepted_terms');
    if (!acceptedTerms) {
        throw badRequest('You need to accept the terms and privacy policy to create an account');
    }

    const user = await authService.registerClient({
        firebase_uid: actor.uid,
        first_name: sanitizeText(requireString(req.body.first_name, 'first_name', { max: 60 })),
        last_name: sanitizeText(requireString(req.body.last_name, 'last_name', { max: 60 })),
        email: actor.email ?? requireEmail(req.body.email),
        phone: optionalPhone(req.body.phone),
        address: optionalString(req.body.address, 'address', { max: 200 }),
        consent_version: CURRENT_CONSENT_VERSION,
    });

    await recordAudit(
        pool,
        {
            action: 'client.registered',
            entityType: 'client',
            entityId: user.id,
            summary: `${user.firstName} ${user.lastName} created a customer account`,
            metadata: { consentVersion: CURRENT_CONSENT_VERSION },
        },
        { req },
    );

    res.status(201).json(user);
}

/** PATCH /api/auth/me */
export async function updateMe(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    if (!actor.role || actor.id === null) throw notFound('Your profile could not be found');

    const updated = await authService.updateProfile(actor.role, actor.id, {
        first_name: optionalString(req.body.first_name, 'first_name', { max: 60 }) ?? undefined,
        last_name: optionalString(req.body.last_name, 'last_name', { max: 60 }) ?? undefined,
        phone: optionalPhone(req.body.phone),
        address: optionalString(req.body.address, 'address', { max: 200 }),
    });

    await recordAudit(
        pool,
        { action: 'profile.updated', entityType: actor.role, entityId: actor.id },
        { req },
    );

    res.json(updated);
}

/** GET /api/auth/inspectors — staff only; this is a staff directory. */
export async function getInspectors(req: Request, res: Response): Promise<void> {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await authService.listInspectors(includeInactive));
}

/** GET /api/auth/users?page=1&limit=25&search=jane — super admin only. */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
    const page = pagination(req, 25);
    const search = optionalString(req.query.search, 'search', { max: 100 });
    const { rows, total } = await authService.listUsers(page, search);
    res.json(toPage(rows, total, page));
}

/** PATCH /api/auth/users/role — super admin only. */
export async function assignRole(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const firebaseUid = requireString(req.body.firebase_uid, 'firebase_uid', { max: 128 });
    const role = requireEnum<UserRole>(req.body.role, 'role', ASSIGNABLE_ROLES);

    // Nobody changes their own role. Without this a super admin could demote
    // themselves and lock the last privileged account out of the system.
    if (firebaseUid === actor.uid) {
        throw forbidden('You cannot change your own role');
    }

    const result = await authService.assignRole(firebaseUid, role, {
        firstName: sanitizeText(requireString(req.body.first_name, 'first_name', { max: 60 })),
        lastName: sanitizeText(requireString(req.body.last_name, 'last_name', { max: 60 })),
        email: requireEmail(req.body.email),
    });

    await recordAudit(
        pool,
        {
            action: 'user.role_changed',
            entityType: 'user',
            summary: `Role changed from ${result.previousRole ?? 'none'} to ${result.newRole}`,
            metadata: {
                firebaseUid,
                previousRole: result.previousRole,
                newRole: result.newRole,
                changedBy: actor.email,
            },
        },
        { req },
    );

    res.json({
        success: true,
        message: `Role updated to ${result.newRole}`,
        previousRole: result.previousRole,
        role: result.newRole,
    });
}

/** PATCH /api/auth/users/status — deactivate or reactivate an account. */
export async function setUserActive(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const firebaseUid = requireString(req.body.firebase_uid, 'firebase_uid', { max: 128 });
    const isActive = requireBoolean(req.body.is_active, 'is_active');

    if (firebaseUid === actor.uid) {
        throw forbidden('You cannot deactivate your own account');
    }

    const affected = await authService.setAccountActive(firebaseUid, isActive);

    await recordAudit(
        pool,
        {
            action: isActive ? 'user.reactivated' : 'user.deactivated',
            entityType: 'user',
            summary: `${affected} profile row(s) set to ${isActive ? 'active' : 'inactive'}`,
            metadata: { firebaseUid, changedBy: actor.email },
        },
        { req },
    );

    res.json({ success: true, isActive, affected });
}

/** GET /api/auth/audit — super admin only. */
export async function getAuditLog(req: Request, res: Response): Promise<void> {
    const page = pagination(req, 50);
    const { rows, total } = await authService.listAuditLog(page, {
        entityType: optionalString(req.query.entityType, 'entityType', { max: 40 }),
        action: optionalString(req.query.action, 'action', { max: 60 }),
    });
    res.json(toPage(rows, total, page));
}
