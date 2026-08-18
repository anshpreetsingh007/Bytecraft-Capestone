import type { Request, Response } from 'express';
import pool from '../config/db';
import * as ordersService from '../services/orders';
import { ORDER_STATUSES, type OrderStatus } from '../models/model';
import {
    assertClientAccess,
    forbidden,
    getActor,
    idParam,
    isStaff,
    notFound,
    optionalEnum,
    optionalInt,
    pagination,
    recordAudit,
    requireEnum,
    requireInt,
    toPage,
} from '../shared';

export async function getAll(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const page = pagination(req, 25);

    // Customers see only their own orders; the clientId filter is ignored for
    // them rather than trusted.
    const clientId = isStaff(actor) ? optionalInt(req.query.clientId, 'clientId') : actor.id;
    if (!isStaff(actor) && actor.role !== 'client') {
        throw forbidden('Your account cannot view orders');
    }

    const { rows, total } = await ordersService.listOrders(
        {
            status: optionalEnum<OrderStatus>(req.query.status, 'status', ORDER_STATUSES),
            clientId,
            needsEstimate: req.query.needsEstimate === 'true',
        },
        page,
    );

    res.json(toPage(rows, total, page));
}

export async function getById(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const order = await ordersService.getOrderById(idParam(req));
    if (!order) throw notFound('Order not found');

    assertClientAccess(actor, order.client_id);
    res.json(order);
}

export async function getByClient(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const clientId = requireInt(req.params.clientId, 'clientId', { min: 1 });
    assertClientAccess(actor, clientId);

    const page = pagination(req, 25);
    const { rows, total } = await ordersService.listOrders({ clientId }, page);
    res.json(toPage(rows, total, page));
}

/** POST /api/orders/from-request/:requestId — admin only. */
export async function convertToOrder(req: Request, res: Response): Promise<void> {
    const requestId = requireInt(req.params.requestId, 'requestId', { min: 1 });
    const order = await ordersService.convertRequestToOrder(requestId);

    await recordAudit(
        pool,
        {
            action: 'order.created',
            entityType: 'order',
            entityId: order.order_id,
            summary: `Created from inspection request #${requestId}`,
        },
        { req },
    );

    res.status(201).json(order);
}

/** PATCH /api/orders/:id/status — admin only. */
export async function updateStatus(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const status = requireEnum<OrderStatus>(req.body.status, 'status', ORDER_STATUSES);
    const order = await ordersService.updateOrderStatus(id, status);

    await recordAudit(
        pool,
        { action: 'order.status_changed', entityType: 'order', entityId: id, summary: status },
        { req },
    );

    res.json(order);
}
