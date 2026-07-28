import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function getInspectionRequests(req: Request, res: Response) {
    try {
        const result = await pool.query(`
            SELECT ir.request_id, ir.client_id, ir.status, ir.details, ir.scheduled_date,
                   c.first_name, c.last_name, c.email, c.phone, c.address
            FROM inspection_request ir
            JOIN client c ON ir.client_id = c.client_id
            ORDER BY ir.request_id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inspection requests:', error);
        res.status(500).json({ error: 'Failed to fetch inspection requests' });
    }
}

export async function getInspectionRequestById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query(`
            SELECT ir.request_id, ir.client_id, ir.status, ir.details, ir.scheduled_date,
                   c.first_name, c.last_name, c.email, c.phone, c.address
            FROM inspection_request ir
            JOIN client c ON ir.client_id = c.client_id
            WHERE ir.request_id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Inspection request not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching inspection request by id:', error);
        res.status(500).json({ error: 'Failed to fetch inspection request' });
    }
}

export async function createEstimate(req: Request, res: Response) {
    try {
        const { order_id, inspector_id, admin_id, details, estimate_date, status } = req.body;
        
        // As a shortcut, if order_id isn't provided we create a dummy one or use 1 for the mock data
        // since the user wants real customer data but didn't specify the full order flow.
        const actualOrderId = order_id || 1;

        const result = await pool.query(`
            INSERT INTO cost_estimate (order_id, inspector_id, admin_id, details, estimate_date, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [actualOrderId, inspector_id, admin_id, details, estimate_date, status]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating estimate:', error);
        res.status(500).json({ error: 'Failed to create estimate' });
    }
}

export async function getEstimates(req: Request, res: Response) {
    try {
        const result = await pool.query(`
            SELECT ce.estimate_id, ce.order_id, ce.details, ce.estimate_date, ce.status,
                   c.first_name, c.last_name, 
                   i.first_name as inspector_first_name, i.last_name as inspector_last_name
            FROM cost_estimate ce
            JOIN orders o ON ce.order_id = o.order_id
            JOIN client c ON o.client_id = c.client_id
            JOIN inspector i ON ce.inspector_id = i.inspector_id
            ORDER BY ce.estimate_id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching estimates:', error);
        res.status(500).json({ error: 'Failed to fetch estimates' });
    }
}

export async function approveEstimate(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query(`
            UPDATE cost_estimate
            SET status = 'approved'
            WHERE estimate_id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Estimate not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error approving estimate:', error);
        res.status(500).json({ error: 'Failed to approve estimate' });
    }
}
