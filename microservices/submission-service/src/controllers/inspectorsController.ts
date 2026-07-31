import { Request, Response } from 'express';
import * as inspectorsService from '../services/inspectors';

// GET /api/inspectors
export async function getAll(req: Request, res: Response) {
    try {
        const inspectors = await inspectorsService.getAllInspectors();
        res.json(inspectors);
    } catch (error) {
        console.error('Error fetching inspectors:', error);
        res.status(500).json({ error: 'Failed to fetch inspectors' });
    }
}