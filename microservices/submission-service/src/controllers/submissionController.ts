import type { Request, Response } from 'express';
import pool from '../config/db';
import * as submissionService from '../services/submission';
import { inspectorExists } from '../services/inspectors';
import { REQUEST_STATUSES, type RequestStatus } from '../models/model';
import {
    assertClientAccess,
    assertInspectorAccess,
    badRequest,
    forbidden,
    getActor,
    idParam,
    isAdmin,
    isStaff,
    notFound,
    optionalEnum,
    optionalInt,
    optionalPhone,
    optionalString,
    pagination,
    recordAudit,
    requireEnum,
    requireInt,
    requireString,
    requireTimestamp,
    sanitizeText,
    toPage,
    type Actor,
} from '../shared';

const MIN_DURATION = 15;
const MAX_DURATION = 480;

/** A customer may only ever see their own requests, whatever the URL says. */
function scopeToActor(actor: Actor, requestedClientId: number | null): number | null {
    if (isStaff(actor)) return requestedClientId;
    if (actor.role !== 'client' || actor.id === null) {
        throw forbidden('Your account cannot view inspection requests');
    }
    if (requestedClientId !== null && requestedClientId !== actor.id) {
        throw forbidden('You can only view your own inspection requests');
    }
    return actor.id;
}

function assertCanSeeRequest(actor: Actor, request: { client_id: number; inspector_id: number | null }): void {
    if (isAdmin(actor)) return;
    if (actor.role === 'client' && actor.id === request.client_id) return;
    if (actor.role === 'inspector' && actor.id === request.inspector_id) return;
    throw forbidden('You do not have access to this inspection request');
}

export async function getAll(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const page = pagination(req, 25);

    const { rows, total } = await submissionService.listRequests(
        {
            status: optionalEnum<RequestStatus>(req.query.status, 'status', REQUEST_STATUSES),
            clientId: scopeToActor(actor, optionalInt(req.query.clientId, 'clientId')),
            inspectorId: optionalInt(req.query.inspectorId, 'inspectorId'),
            search: optionalString(req.query.search, 'search', { max: 100 }),
            unscheduledOnly: req.query.unscheduledOnly === 'true',
        },
        page,
    );

    res.json(toPage(rows, total, page));
}

export async function getById(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const request = await submissionService.getRequestById(idParam(req));
    if (!request) throw notFound('Inspection request not found');

    assertCanSeeRequest(actor, request);
    res.json(request);
}

export async function getByClient(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const clientId = requireInt(req.params.clientId, 'clientId', { min: 1 });
    assertClientAccess(actor, clientId);

    const page = pagination(req, 25);
    const { rows, total } = await submissionService.listRequests({ clientId }, page);
    res.json(toPage(rows, total, page));
}

export async function getByInspector(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const inspectorId = requireInt(req.params.inspectorId, 'inspectorId', { min: 1 });
    assertInspectorAccess(actor, inspectorId);

    const page = pagination(req, 25);
    const { rows, total } = await submissionService.listRequests(
        { inspectorId, status: optionalEnum<RequestStatus>(req.query.status, 'status', REQUEST_STATUSES) },
        page,
    );
    res.json(toPage(rows, total, page));
}

/**
 * A customer files a request for themselves; staff may file one on a
 * customer's behalf. The client_id is taken from the token unless the caller
 * is staff -- it used to come straight from the request body, so anybody
 * could file requests under someone else's account.
 */
export async function create(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    let clientId: number;
    if (isStaff(actor)) {
        clientId = requireInt(req.body.client_id, 'client_id', { min: 1 });
    } else if (actor.role === 'client' && actor.id !== null) {
        clientId = actor.id;
    } else {
        throw forbidden('Only customers can submit inspection requests');
    }

    const created = await submissionService.createRequest({
        client_id: clientId,
        details: sanitizeText(requireString(req.body.details, 'details', { min: 10, max: 2000 })),
        site_address: optionalString(req.body.site_address, 'site_address', { max: 200 }),
        contact_phone: optionalPhone(req.body.contact_phone, 'contact_phone'),
    });

    await recordAudit(
        pool,
        {
            action: 'inspection_request.created',
            entityType: 'inspection_request',
            entityId: created.request_id,
            summary: `Inspection request raised for client #${clientId}`,
        },
        { req },
    );

    res.status(201).json(created);
}

/** PUT /api/inspection-requests/:id — admin edit, including assignment. */
export async function update(req: Request, res: Response): Promise<void> {
    const id = idParam(req);

    const inspectorId = optionalInt(req.body.inspector_id, 'inspector_id');
    if (inspectorId !== null && !(await inspectorExists(inspectorId))) {
        throw badRequest('That inspector does not exist or is no longer active');
    }

    const updated = await submissionService.updateRequest(id, {
        inspector_id: req.body.inspector_id === undefined ? undefined : inspectorId,
        details:
            req.body.details === undefined
                ? undefined
                : sanitizeText(requireString(req.body.details, 'details', { min: 10, max: 2000 })),
        site_address:
            req.body.site_address === undefined
                ? undefined
                : optionalString(req.body.site_address, 'site_address', { max: 200 }),
        contact_phone:
            req.body.contact_phone === undefined
                ? undefined
                : optionalPhone(req.body.contact_phone, 'contact_phone'),
        scheduled_date:
            req.body.scheduled_date === undefined
                ? undefined
                : req.body.scheduled_date === null || req.body.scheduled_date === ''
                  ? null
                  : requireTimestamp(req.body.scheduled_date, 'scheduled_date').toISOString(),
        duration_minutes:
            req.body.duration_minutes === undefined
                ? undefined
                : requireInt(req.body.duration_minutes, 'duration_minutes', {
                      min: MIN_DURATION,
                      max: MAX_DURATION,
                  }),
    });

    await recordAudit(
        pool,
        {
            action: 'inspection_request.updated',
            entityType: 'inspection_request',
            entityId: id,
            metadata: { inspectorId: updated.inspector_id, scheduledDate: updated.scheduled_date },
        },
        { req },
    );

    res.json(updated);
}

/**
 * PATCH /api/inspection-requests/:id/schedule
 * Books an inspector at a real date and time. Returns 409 with the clashing
 * appointment when the inspector is already committed.
 */
export async function schedule(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const inspectorId = requireInt(req.body.inspector_id, 'inspector_id', { min: 1 });

    if (!(await inspectorExists(inspectorId))) {
        throw badRequest('That inspector does not exist or is no longer active');
    }

    const scheduledDate = requireTimestamp(req.body.scheduled_date, 'scheduled_date');
    if (scheduledDate.getTime() < Date.now() - 60 * 60 * 1000) {
        throw badRequest('Inspections cannot be booked in the past');
    }

    const updated = await submissionService.scheduleRequest(id, {
        inspector_id: inspectorId,
        scheduled_date: scheduledDate,
        duration_minutes: req.body.duration_minutes
            ? requireInt(req.body.duration_minutes, 'duration_minutes', {
                  min: MIN_DURATION,
                  max: MAX_DURATION,
              })
            : 60,
    });

    await recordAudit(
        pool,
        {
            action: 'inspection_request.scheduled',
            entityType: 'inspection_request',
            entityId: id,
            summary: `Booked with inspector #${inspectorId} for ${scheduledDate.toISOString()}`,
        },
        { req },
    );

    res.json(updated);
}

/**
 * PATCH /api/inspection-requests/:id/status
 * An inspector may move their own jobs forward; an admin may move any.
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    const current = await submissionService.getRequestById(id);
    if (!current) throw notFound('Inspection request not found');

    if (!isAdmin(actor)) {
        if (actor.role !== 'inspector' || actor.id !== current.inspector_id) {
            throw forbidden('You can only update inspections assigned to you');
        }
    }

    const status = requireEnum<RequestStatus>(req.body.status, 'status', REQUEST_STATUSES);
    const reason = optionalString(req.body.reason, 'reason', { max: 250 });

    const updated = await submissionService.updateRequestStatus(id, status, reason);

    await recordAudit(
        pool,
        {
            action: 'inspection_request.status_changed',
            entityType: 'inspection_request',
            entityId: id,
            summary: `${current.status} to ${status}`,
            metadata: { reason },
        },
        { req },
    );

    res.json(updated);
}

/** DELETE /api/inspection-requests/:id — soft delete, admin only. */
export async function remove(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const deleted = await submissionService.softDeleteRequest(id);
    if (!deleted) throw notFound('Inspection request not found');

    await recordAudit(
        pool,
        { action: 'inspection_request.deleted', entityType: 'inspection_request', entityId: id },
        { req },
    );

    res.status(204).send();
}
