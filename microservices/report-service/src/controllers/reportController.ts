import { Request, Response } from 'express';
import * as reportService from '../services/reportService';

export async function getOverview(req: Request, res: Response) {
    try {
        const overview = await reportService.getOverview();
        res.json(overview);
    } catch (error) {
        console.error('Error fetching report overview:', error);
        res.status(500).json({ error: 'Failed to fetch report overview' });
    }
}

export async function getFinancialReport(req: Request, res: Response) {
    try {
        const period = (req.query.period as string) || 'month';
        const start = req.query.start as string | undefined;
        const end = req.query.end as string | undefined;

        if (!reportService.isValidPeriod(period)) {
            res.status(400).json({ error: "Invalid period. Must be 'month', 'quarter', or 'year'." });
            return;
        }

        const data = await reportService.getFinancialReport(period, start, end);
        res.json(data);
    } catch (error) {
        console.error('Error fetching financial report:', error);
        res.status(500).json({ error: 'Failed to fetch financial report' });
    }
}

export async function getInspectorReport(req: Request, res: Response) {
    try {
        const data = await reportService.getInspectorPerformance();
        res.json(data);
    } catch (error) {
        console.error('Error fetching inspector report:', error);
        res.status(500).json({ error: 'Failed to fetch inspector report' });
    }
}

export async function getEstimateReport(req: Request, res: Response) {
    try {
        const data = await reportService.getEstimateReport();
        res.json(data);
    } catch (error) {
        console.error('Error fetching estimate report:', error);
        res.status(500).json({ error: 'Failed to fetch estimate report' });
    }
}

export async function getInvoiceReport(req: Request, res: Response) {
    try {
        const data = await reportService.getInvoiceReport();
        res.json(data);
    } catch (error) {
        console.error('Error fetching invoice report:', error);
        res.status(500).json({ error: 'Failed to fetch invoice report' });
    }
}
