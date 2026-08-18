import type { Request, Response } from 'express';
import pool from '../config/db';
import * as estimateService from '../services/estimate';
import {
    CLIENT_RESPONSES,
    ESTIMATE_STATUSES,
    type ClientResponse,
    type EstimateMaterial,
    type EstimateStatus,
} from '../models/model';
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
    optionalDate,
    optionalEnum,
    optionalInt,
    optionalNumber,
    optionalString,
    pagination,
    recordAudit,
    requireDate,
    requireEnum,
    requireInt,
    requireString,
    sanitizeText,
    toPage,
    type Actor,
} from '../shared';

const MAX_MATERIAL_LINES = 100;

/**
 * Roof dimensions.
 *
 * The database has a CHECK rejecting non-positive dimensions, so these are
 * normalised here and rejected with a 400 rather than letting Postgres raise
 * a constraint violation. Pitch may legitimately be zero on a flat roof.
 */
function parseDimension(value: unknown, field: string, allowZero = false): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number`);
    if (allowZero ? parsed < 0 : parsed <= 0) {
        throw badRequest(allowZero ? `${field} cannot be negative` : `${field} must be greater than zero`);
    }
    if (parsed > 100_000) throw badRequest(`${field} is unrealistically large`);
    return parsed;
}

function parseMaterials(value: unknown): EstimateMaterial[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) throw badRequest('materials must be an array');
    if (value.length > MAX_MATERIAL_LINES) {
        throw badRequest(`An estimate can hold at most ${MAX_MATERIAL_LINES} material lines`);
    }

    return value.map((raw, index) => {
        const line = (raw ?? {}) as Record<string, unknown>;
        return {
            material_id: requireInt(line.material_id, `materials[${index}].material_id`, { min: 1 }),
            quantity: Number(
                requireInt(Math.round(Number(line.quantity ?? 0)), `materials[${index}].quantity`, {
                    min: 1,
                    max: 1_000_000,
                }),
            ),
            cost: Number(Number(line.cost ?? 0).toFixed(2)),
        };
    });
}

function assertCanSeeEstimate(actor: Actor, estimate: { client_id: number | null; inspector_id: number }): void {
    if (isAdmin(actor)) return;
    if (actor.role === 'inspector' && actor.id === estimate.inspector_id) return;
    if (actor.role === 'client' && actor.id === estimate.client_id) return;
    throw forbidden('You do not have access to this estimate');
}

export async function getAll(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const page = pagination(req, 25);

    // A customer hitting the unfiltered list gets their own approved
    // estimates, not everybody's. This endpoint used to return the whole
    // table to anyone who asked.
    const scoped = isStaff(actor)
        ? { clientId: optionalInt(req.query.clientId, 'clientId') }
        : { clientId: actor.id, approvedOnly: true };

    const { rows, total } = await estimateService.listEstimates(
        {
            ...scoped,
            status: optionalEnum<EstimateStatus>(req.query.status, 'status', ESTIMATE_STATUSES),
            inspectorId: optionalInt(req.query.inspectorId, 'inspectorId'),
            clientResponse: optionalEnum<ClientResponse>(
                req.query.clientResponse,
                'clientResponse',
                CLIENT_RESPONSES,
            ),
        },
        page,
    );

    res.json(toPage(rows, total, page));
}

export async function getById(req: Request, res: Response): Promise<void> {
    const estimate = await estimateService.getEstimateById(idParam(req));
    if (!estimate) throw notFound('Estimate not found');

    assertCanSeeEstimate(getActor(req), estimate);
    res.json(estimate);
}

export async function getByClient(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const clientId = requireInt(req.params.clientId, 'clientId', { min: 1 });
    assertClientAccess(actor, clientId);

    const page = pagination(req, 25);
    const { rows, total } = await estimateService.listEstimates(
        { clientId, approvedOnly: !isStaff(actor) },
        page,
    );
    res.json(toPage(rows, total, page));
}

export async function getByInspector(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const inspectorId = requireInt(req.params.inspectorId, 'inspectorId', { min: 1 });
    assertInspectorAccess(actor, inspectorId);

    const page = pagination(req, 25);
    const { rows, total } = await estimateService.listEstimates({ inspectorId }, page);
    res.json(toPage(rows, total, page));
}

export async function create(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    // An inspector authors under their own id; an admin may author on behalf
    // of one. Taking inspector_id straight from the body let anybody put
    // somebody else's name on an estimate.
    const inspectorId =
        actor.role === 'inspector' && actor.id !== null
            ? actor.id
            : requireInt(req.body.inspector_id, 'inspector_id', { min: 1 });

    const status = requireEnum<EstimateStatus>(req.body.status ?? 'draft', 'status', ['draft', 'submitted']);

    const created = await estimateService.createEstimate({
        order_id: requireInt(req.body.order_id, 'order_id', { min: 1 }),
        inspector_id: inspectorId,
        admin_id: actor.role === 'admin' || actor.role === 'super_admin' ? actor.id : null,
        details: sanitizeText(requireString(req.body.details, 'details', { max: 5000 })),
        estimate_date: req.body.estimate_date
            ? requireDate(req.body.estimate_date, 'estimate_date')
            : new Date().toISOString().slice(0, 10),
        status,
        materials: parseMaterials(req.body.materials),
        total_amount: optionalNumber(req.body.total_amount, 'total_amount', { min: 0, max: 10_000_000 }),
        length_ft: parseDimension(req.body.length_ft, 'length_ft'),
        width_ft: parseDimension(req.body.width_ft, 'width_ft'),
        pitch_ft: parseDimension(req.body.pitch_ft, 'pitch_ft', true),
    });

    await recordAudit(
        pool,
        {
            action: 'estimate.created',
            entityType: 'cost_estimate',
            entityId: created.estimate_id,
            summary: `Estimate raised for order #${created.order_id} as ${status}`,
        },
        { req },
    );

    res.status(201).json(created);
}

export async function update(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    const existing = await estimateService.getEstimateById(id);
    if (!existing) throw notFound('Estimate not found');

    // Inspectors may only edit their own work.
    if (!isAdmin(actor) && !(actor.role === 'inspector' && actor.id === existing.inspector_id)) {
        throw forbidden('You can only edit estimates you created');
    }

    const updated = await estimateService.updateEstimate(id, {
        details:
            req.body.details === undefined
                ? undefined
                : sanitizeText(requireString(req.body.details, 'details', { max: 5000 })),
        estimate_date: optionalDate(req.body.estimate_date, 'estimate_date') ?? undefined,
        status:
            req.body.status === undefined
                ? undefined
                : requireEnum<EstimateStatus>(req.body.status, 'status', ['draft', 'submitted']),
        materials: req.body.materials === undefined ? undefined : parseMaterials(req.body.materials),
        total_amount:
            req.body.total_amount === undefined
                ? undefined
                : optionalNumber(req.body.total_amount, 'total_amount', { min: 0, max: 10_000_000 }),
        length_ft: req.body.length_ft === undefined ? undefined : parseDimension(req.body.length_ft, 'length_ft'),
        width_ft: req.body.width_ft === undefined ? undefined : parseDimension(req.body.width_ft, 'width_ft'),
        pitch_ft:
            req.body.pitch_ft === undefined ? undefined : parseDimension(req.body.pitch_ft, 'pitch_ft', true),
    });

    await recordAudit(
        pool,
        {
            action: 'estimate.updated',
            entityType: 'cost_estimate',
            entityId: id,
            metadata: { status: updated.status },
        },
        { req },
    );

    res.json(updated);
}

/** PATCH /api/estimates/:id/status — admin approve or reject. */
export async function updateStatus(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);
    const status = requireEnum<EstimateStatus>(req.body.status, 'status', ESTIMATE_STATUSES);

    const updated = await estimateService.updateEstimateStatus(id, status, actor.id);

    await recordAudit(
        pool,
        {
            action: `estimate.${status}`,
            entityType: 'cost_estimate',
            entityId: id,
            summary: `Estimate #${id} marked ${status}`,
            metadata: { by: actor.email },
        },
        { req },
    );

    res.json(updated);
}

/**
 * PATCH /api/estimates/:id/response
 * The customer accepting or declining their own estimate. This is the piece
 * that was missing entirely -- an admin could approve an estimate but the
 * customer had no way to agree to it.
 */
export async function respond(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    const existing = await estimateService.getEstimateById(id);
    if (!existing) throw notFound('Estimate not found');

    if (actor.role !== 'client' || actor.id !== existing.client_id) {
        throw forbidden('Only the customer this estimate belongs to can respond to it');
    }

    const response = requireEnum<'accepted' | 'declined'>(req.body.response, 'response', [
        'accepted',
        'declined',
    ]);
    const note = optionalString(req.body.note, 'note', { max: 500 });

    const updated = await estimateService.recordClientResponse(id, response, note);

    await recordAudit(
        pool,
        {
            action: `estimate.client_${response}`,
            entityType: 'cost_estimate',
            entityId: id,
            summary: `Customer ${response} estimate #${id}`,
        },
        { req },
    );

    res.json(updated);
}

/** DELETE /api/estimates/:id — soft delete, admin only. */
export async function remove(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const deleted = await estimateService.softDeleteEstimate(id);
    if (!deleted) throw notFound('Estimate not found');

    await recordAudit(pool, { action: 'estimate.deleted', entityType: 'cost_estimate', entityId: id }, { req });

    res.status(204).send();
}
