import { Request, Response } from 'express';
import * as submissionService from '../services/submission';

// ─── GET ALL ────────────────────────────────────────────────
export async function getAll(req: Request, res: Response) {
    try {
        const status = req.query.status as string | undefined;
        const requests = await submissionService.getAllRequests(status);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching inspection requests:', error);
        res.status(500).json({ error: 'Failed to fetch inspection requests' });
    }
}

// ─── GET BY ID ──────────────────────────────────────────────
export async function getById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const request = await submissionService.getRequestById(id);

        if (!request) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }

        res.json(request);
    } catch (error) {
        console.error('Error fetching inspection request:', error);
        res.status(500).json({ error: 'Failed to fetch inspection request' });
    }
}

// ─── GET BY CLIENT ──────────────────────────────────────────
export async function getByClient(req: Request, res: Response) {
    try {
        const clientId = parseInt(req.params.clientId as string);
        const requests = await submissionService.getRequestsByClient(clientId);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching inspection requests by client:', error);
        res.status(500).json({ error: 'Failed to fetch inspection requests' });
    }
}

// ─── GET BY INSPECTOR ───────────────────────────────────────
export async function getByInspector(req: Request, res: Response) {
    try {
        const inspectorId = parseInt(req.params.inspectorId as string);
        const requests = await submissionService.getRequestsByInspector(inspectorId);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching inspection requests by inspector:', error);
        res.status(500).json({ error: 'Failed to fetch inspection requests' });
    }
}

// ─── CREATE (client submits a request) ──────────────────────
export async function create(req: Request, res: Response) {
    try {
        const { client_id, details, status } = req.body;

        if (!client_id || !details) {
            res.status(400).json({ error: 'Missing required fields: client_id, details' });
            return;
        }

        const newRequest = await submissionService.createRequest({ client_id, details, status });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating inspection request:', error);
        res.status(500).json({ error: 'Failed to create inspection request' });
    }
}

// ─── UPDATE ───────────────────────────────────────────────────
export async function update(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const updated = await submissionService.updateRequest(id, req.body);

        if (!updated) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating inspection request:', error);
        res.status(500).json({ error: 'Failed to update inspection request' });
    }
}

// ─── UPDATE STATUS ────────────────────────────────────────────
export async function updateStatus(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ error: 'Missing required field: status' });
            return;
        }

        const updated = await submissionService.updateRequestStatus(id, status);

        if (!updated) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating inspection request status:', error);
        res.status(500).json({ error: 'Failed to update inspection request status' });
    }
}

// ─── DELETE ─────────────────────────────────────────────────
export async function remove(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const deleted = await submissionService.deleteRequest(id);

        if (!deleted) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting inspection request:', error);
        res.status(500).json({ error: 'Failed to delete inspection request' });
    }
}