import type { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import { REPORT_PERIODS, type ReportPeriod } from '../services/reportService';
import { badRequest, optionalDate, requireEnum } from '../shared';

export async function getOverview(_req: Request, res: Response): Promise<void> {
    res.json(await reportService.getOverview());
}

export async function getFinancialReport(req: Request, res: Response): Promise<void> {
    const period = requireEnum<ReportPeriod>(req.query.period ?? 'month', 'period', REPORT_PERIODS);
    const start = optionalDate(req.query.start, 'start');
    const end = optionalDate(req.query.end, 'end');

    if (start && end && start > end) throw badRequest('start must be on or before end');

    res.json(await reportService.getFinancialReport(period, start, end));
}

export async function getInspectorReport(_req: Request, res: Response): Promise<void> {
    res.json(await reportService.getInspectorPerformance());
}

export async function getEstimateReport(_req: Request, res: Response): Promise<void> {
    res.json(await reportService.getEstimateReport());
}

/**
 * Replaces the old invoice aging report. There is no invoicing in the
 * product, so this reports the job pipeline instead of money owed.
 */
export async function getJobsReport(_req: Request, res: Response): Promise<void> {
    res.json(await reportService.getJobsReport());
}
