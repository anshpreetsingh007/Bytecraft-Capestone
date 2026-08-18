import type { Request, Response } from 'express';
import { pool } from '../config/db';
import * as inventoryService from '../services/inventoryService';
import { MOVEMENT_REASONS, type MovementReason } from '../models/model';
import {
    badRequest,
    getActor,
    idParam,
    notFound,
    optionalInt,
    optionalString,
    pagination,
    recordAudit,
    requireEnum,
    requireInt,
    requireNumber,
    requireString,
    sanitizeText,
    toPage,
} from '../shared';

const MAX_CONSUME_LINES = 100;

export async function getAllItems(req: Request, res: Response): Promise<void> {
    const page = pagination(req, 50);
    const { rows, total } = await inventoryService.listItems(
        {
            search: optionalString(req.query.search, 'search', { max: 100 }),
            category: optionalString(req.query.category, 'category', { max: 100 }),
            lowStockOnly: req.query.lowStockOnly === 'true',
        },
        page,
    );
    res.json(toPage(rows, total, page));
}

export async function getItem(req: Request, res: Response): Promise<void> {
    const item = await inventoryService.getItem(idParam(req));
    if (!item) throw notFound('Item not found');
    res.json(item);
}

export async function createItem(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    const created = await inventoryService.createItem(
        {
            name: sanitizeText(requireString(req.body.name, 'name', { max: 100 })),
            description: optionalString(req.body.description, 'description', { max: 250 }),
            category: sanitizeText(requireString(req.body.category, 'category', { max: 100 })),
            quantity: requireInt(req.body.quantity ?? 0, 'quantity', { min: 0, max: 10000000 }),
            unitCost: requireNumber(req.body.unitCost ?? 0, 'unitCost', { min: 0, max: 1000000 }),
            unit: sanitizeText(requireString(req.body.unit, 'unit', { max: 30 })),
            reorderThreshold: requireInt(req.body.reorderThreshold ?? 0, 'reorderThreshold', {
                min: 0,
                max: 1000000,
            }),
            coverageSqft: requireNumber(req.body.coverageSqft ?? 1, 'coverageSqft', {
                min: 0.01,
                max: 100000,
            }),
        },
        { role: actor.role, id: actor.id },
    );

    await recordAudit(
        pool,
        {
            action: 'inventory.item_created',
            entityType: 'item',
            entityId: created.id,
            summary: `${created.name} added with ${created.quantity} ${created.unit}`,
        },
        { req },
    );

    res.status(201).json(created);
}

export async function updateItem(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);
    const body = req.body ?? {};

    const updated = await inventoryService.updateItem(
        id,
        {
            name: body.name === undefined ? undefined : sanitizeText(requireString(body.name, 'name', { max: 100 })),
            description:
                body.description === undefined
                    ? undefined
                    : optionalString(body.description, 'description', { max: 250 }),
            category:
                body.category === undefined
                    ? undefined
                    : sanitizeText(requireString(body.category, 'category', { max: 100 })),
            quantity:
                body.quantity === undefined
                    ? undefined
                    : requireInt(body.quantity, 'quantity', { min: 0, max: 10000000 }),
            unitCost:
                body.unitCost === undefined
                    ? undefined
                    : requireNumber(body.unitCost, 'unitCost', { min: 0, max: 1000000 }),
            unit: body.unit === undefined ? undefined : sanitizeText(requireString(body.unit, 'unit', { max: 30 })),
            reorderThreshold:
                body.reorderThreshold === undefined
                    ? undefined
                    : requireInt(body.reorderThreshold, 'reorderThreshold', { min: 0, max: 1000000 }),
            coverageSqft:
                body.coverageSqft === undefined
                    ? undefined
                    : requireNumber(body.coverageSqft, 'coverageSqft', { min: 0.01, max: 100000 }),
        },
        { role: actor.role, id: actor.id },
    );

    await recordAudit(
        pool,
        {
            action: 'inventory.item_updated',
            entityType: 'item',
            entityId: id,
            metadata: { quantity: updated.quantity },
        },
        { req },
    );

    res.json(updated);
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const deleted = await inventoryService.softDeleteItem(id);
    if (!deleted) throw notFound('Item not found');

    await recordAudit(pool, { action: 'inventory.item_deleted', entityType: 'item', entityId: id }, { req });

    res.status(204).send();
}

/** POST /api/inventory/:id/movements — receive stock, write it off, correct it. */
export async function recordMovement(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    const reason = requireEnum<MovementReason>(req.body.reason, 'reason', MOVEMENT_REASONS);
    const quantity = requireNumber(req.body.quantity, 'quantity', { min: -1000000, max: 1000000 });
    if (quantity === 0) throw badRequest('quantity must not be zero');

    const updated = await inventoryService.receiveStock(
        id,
        quantity,
        reason,
        optionalString(req.body.note, 'note', { max: 250 }),
        { role: actor.role, id: actor.id },
    );

    await recordAudit(
        pool,
        {
            action: 'inventory.movement_recorded',
            entityType: 'item',
            entityId: id,
            summary: `${quantity > 0 ? '+' : ''}${quantity} (${reason})`,
        },
        { req },
    );

    res.json(updated);
}

export async function getMovements(req: Request, res: Response): Promise<void> {
    const page = pagination(req, 50);
    const itemId = req.params.id ? idParam(req) : optionalInt(req.query.itemId, 'itemId');
    const { rows, total } = await inventoryService.listMovements(itemId, page);
    res.json(toPage(rows, total, page));
}

/**
 * POST /api/inventory/consume — internal only.
 * Called by estimate-service when an estimate is approved.
 */
export async function consume(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    if (!Array.isArray(req.body.lines)) throw badRequest('lines must be an array');
    if (req.body.lines.length > MAX_CONSUME_LINES) {
        throw badRequest(`At most ${MAX_CONSUME_LINES} lines can be consumed at once`);
    }

    const lines = req.body.lines.map((raw: unknown, index: number) => {
        const line = (raw ?? {}) as Record<string, unknown>;
        return {
            item_id: requireInt(line.item_id, `lines[${index}].item_id`, { min: 1 }),
            quantity: requireNumber(line.quantity, `lines[${index}].quantity`, { min: 0.01, max: 1000000 }),
        };
    });

    const result = await inventoryService.consumeForReference(
        requireString(req.body.reference_type, 'reference_type', { max: 30 }),
        requireInt(req.body.reference_id, 'reference_id', { min: 1 }),
        lines,
        { role: actor.serviceName ?? 'service', id: null },
    );

    res.json(result);
}
