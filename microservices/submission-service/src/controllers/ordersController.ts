import { Request, Response } from 'express';
import * as ordersService from '../services/orders';
import { OrderConflictError } from '../services/orders';

// ─── GET ALL ────────────────────────────────────────────────
// GET /api/orders?status=active&needsEstimate=true
export async function getAll(req: Request, res: Response) {
    try {
        const status = req.query.status as string | undefined;
        const needsEstimate = req.query.needsEstimate === 'true';
        const orders = await ordersService.getAllOrders(status, needsEstimate);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

// ─── GET BY ID ──────────────────────────────────────────────
export async function getById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const order = await ordersService.getOrderById(id);

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}

// ─── GET BY CLIENT ──────────────────────────────────────────
export async function getByClient(req: Request, res: Response) {
    try {
        const clientId = parseInt(req.params.clientId as string);
        const orders = await ordersService.getOrdersByClient(clientId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders by client:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

// ─── CONVERT REQUEST TO ORDER ────────────────────────────────
// POST /api/orders/from-request/:requestId
export async function convertToOrder(req: Request, res: Response) {
    try {
        const requestId = parseInt(req.params.requestId as string);
        const order = await ordersService.convertRequestToOrder(requestId);

        if (!order) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }

        res.status(201).json(order);
    } catch (error) {
        if (error instanceof OrderConflictError) {
            res.status(409).json({ error: error.message, existingOrder: error.existingOrder });
            return;
        }
        console.error('Error converting request to order:', error);
        res.status(500).json({ error: 'Failed to convert request to order' });
    }
}
