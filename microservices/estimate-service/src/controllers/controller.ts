import { Request, Response } from 'express';
import * as estimateService from '../services/estimate';

// ─── GET ALL ────────────────────────────────────────────────
export async function getAll(req: Request, res: Response) {
    try {
        // req.query.status comes from the URL: /api/estimates?status=approved
        const status = req.query.status as string | undefined;
        const estimates = await estimateService.getAllEstimates(status);
        res.json(estimates);
    } catch (error) {
        console.error('Error fetching estimates:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

// ─── GET BY ID ──────────────────────────────────────────────
export async function getById(req: Request, res: Response) {
    try {
        // req.params.id comes from the URL: /api/estimates/5
        const id = parseInt(req.params.id as string);
        const estimate = await estimateService.getEstimateById(id);

        if (!estimate) {
            res.status(404).json({ error: 'Estimate not found' });
            return;
        }

        res.json(estimate);
    } catch (error) {
        console.error('Error fetching estimate:', error);
        res.status(500).json({ error: 'Failed to fetch estimate' });
    }
}

// ─── GET BY ORDER ───────────────────────────────────────────
export async function getByOrder(req: Request, res: Response) {
    try {
        const orderId = parseInt(req.params.orderId as string);
        const estimates = await estimateService.getEstimatesByOrder(orderId);
        res.json(estimates);
    } catch (error) {
        console.error('Error fetching estimates by order:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

// ─── GET BY INSPECTOR ───────────────────────────────────────
export async function getByInspector(req: Request, res: Response) {
    try {
        const inspectorId = parseInt(req.params.inspectorId as string);
        const estimates = await estimateService.getEstimatesByInspector(inspectorId);
        res.json(estimates);
    } catch (error) {
        console.error('Error fetching estimates by inspector:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

// ─── CREATE ─────────────────────────────────────────────────
export async function create(req: Request, res: Response) {
    try {
        // req.body is the JSON the frontend sends in the POST request
        const { order_id, inspector_id, admin_id, details, estimate_date, status } = req.body;

        // Basic validation — make sure required fields are present
        if (!order_id || !inspector_id || !details || !estimate_date || !status) {
            res.status(400).json({ error: 'Missing required fields: order_id, inspector_id, details, estimate_date, status' });
            return;
        }

        const newEstimate = await estimateService.createEstimate({
            order_id,
            inspector_id,
            admin_id: admin_id || null,
            details,
            estimate_date,
            status,
        });

        // 201 = "Created" — the standard status code for successful resource creation
        res.status(201).json(newEstimate);
    } catch (error) {
        console.error('Error creating estimate:', error);
        res.status(500).json({ error: 'Failed to create estimate' });
    }
}

// ─── UPDATE ─────────────────────────────────────────────────
export async function update(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const updated = await estimateService.updateEstimate(id, req.body);

        if (!updated) {
            res.status(404).json({ error: 'Estimate not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating estimate:', error);
        res.status(500).json({ error: 'Failed to update estimate' });
    }
}

// ─── UPDATE STATUS ──────────────────────────────────────────
export async function updateStatus(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ error: 'Missing required field: status' });
            return;
        }

        const updated = await estimateService.updateEstimateStatus(id, status);

        if (!updated) {
            res.status(404).json({ error: 'Estimate not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating estimate status:', error);
        res.status(500).json({ error: 'Failed to update estimate status' });
    }
}

// ─── DELETE ─────────────────────────────────────────────────
export async function remove(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const deleted = await estimateService.deleteEstimate(id);

        if (!deleted) {
            res.status(404).json({ error: 'Estimate not found' });
            return;
        }

        // 204 = "No Content" — means success but nothing to return
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting estimate:', error);
        res.status(500).json({ error: 'Failed to delete estimate' });
    }
}
