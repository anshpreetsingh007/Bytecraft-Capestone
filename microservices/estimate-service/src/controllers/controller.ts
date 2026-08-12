
import { Request, Response } from 'express';
import * as estimateService from '../services/estimate';

// GET ALL
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

//GET BY ID 
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



//GET BY CLIENT
export async function getByClient(req: Request, res: Response) {
    try {
        const clientId = parseInt(req.params.clientId as string);
        const estimates = await estimateService.getEstimatesByClient(clientId);
        res.json(estimates);
    } catch (error) {
        console.error('Error fetching estimates by client:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

// GET /api/estimates/inspector/3?limit=5
export async function getByInspector(req: Request, res: Response) {
    try {
        const inspectorId = parseInt(req.params.inspectorId as string);

        if (Number.isNaN(inspectorId)) {
            res.status(400).json({ error: 'Invalid inspector id' });
            return;
        }

        // Clamp the limit so a bad query string can't ask for the whole table
        // or a negative page size.
        const rawLimit = req.query.limit;
        let limit: number | undefined;
        if (rawLimit !== undefined) {
            const parsed = parseInt(rawLimit as string);
            if (Number.isNaN(parsed) || parsed < 1) {
                res.status(400).json({ error: 'Invalid limit' });
                return;
            }
            limit = Math.min(parsed, 100);
        }

        const estimates = await estimateService.getEstimatesByInspector(inspectorId, limit);
        res.json(estimates);
    } catch (error) {
        console.error('Error fetching estimates by inspector:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

/**
 * Coerce an incoming dimension to a positive number, or null.
 *
 * The DB has a CHECK constraint rejecting non-positive dimensions, so
 * normalise here and return a 400 rather than letting Postgres throw a 500.
 * Returns `undefined` to signal "invalid — reject the request".
 */
function parseDimension(value: unknown, allowZero = false): number | null | undefined {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return undefined;
    if (allowZero ? num < 0 : num <= 0) return undefined;
    return num;
}

export async function create(req: Request, res: Response) {
    try {
        // req.body is the JSON the frontend sends in the POST request
        const {
            order_id, inspector_id, admin_id, details, estimate_date, status,
            materials, material_id, material_quantity,
            length_ft, width_ft, pitch_ft,
        } = req.body;

        // Basic validation — make sure required fields are present
        if (!order_id || !inspector_id || !details || !estimate_date || !status) {
            res.status(400).json({ error: 'Missing required fields: order_id, inspector_id, details, estimate_date, status' });
            return;
        }

        if (materials !== undefined && !Array.isArray(materials)) {
            res.status(400).json({ error: 'materials must be an array' });
            return;
        }

        // pitch may legitimately be 0 (flat roof); length and width may not.
        const length = parseDimension(length_ft);
        const width = parseDimension(width_ft);
        const pitch = parseDimension(pitch_ft, true);

        if (length === undefined || width === undefined || pitch === undefined) {
            res.status(400).json({
                error: 'length_ft and width_ft must be positive numbers; pitch_ft must be zero or greater',
            });
            return;
        }

        const newEstimate = await estimateService.createEstimate({
            order_id,
            inspector_id,
            admin_id: admin_id || null,
            details,
            estimate_date,
            status,
            // Previously dropped on the floor here, so every created estimate
            // persisted an empty materials list regardless of what was sent.
            materials,
            material_id: material_id ?? null,
            material_quantity: material_quantity ?? null,
            length_ft: length,
            width_ft: width,
            pitch_ft: pitch,
        });

        // 201 = "Created" — the standard status code for successful resource creation
        res.status(201).json(newEstimate);
    } catch (error) {
        console.error('Error creating estimate:', error);
        res.status(500).json({ error: 'Failed to create estimate' });
    }
}


export async function update(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);

        if (Number.isNaN(id)) {
            res.status(400).json({ error: 'Invalid estimate id' });
            return;
        }

        const { materials, length_ft, width_ft, pitch_ft } = req.body;

        if (materials !== undefined && !Array.isArray(materials)) {
            res.status(400).json({ error: 'materials must be an array' });
            return;
        }

        // Only validate dimensions the caller actually sent — an update is a
        // partial patch, and omitting a field must leave it untouched.
        const payload = { ...req.body };
        for (const [key, raw, allowZero] of [
            ['length_ft', length_ft, false],
            ['width_ft', width_ft, false],
            ['pitch_ft', pitch_ft, true],
        ] as const) {
            if (raw === undefined) {
                delete payload[key];
                continue;
            }
            const parsed = parseDimension(raw, allowZero);
            if (parsed === undefined) {
                res.status(400).json({
                    error: 'length_ft and width_ft must be positive numbers; pitch_ft must be zero or greater',
                });
                return;
            }
            payload[key] = parsed;
        }

        const updated = await estimateService.updateEstimate(id, payload);

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

// DELETE 
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
