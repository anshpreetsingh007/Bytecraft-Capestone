import type { Request, Response } from 'express';
import { pool } from '../config/db';
import * as jobReportService from '../services/jobReportService';
import { JOB_REPORT_STATUSES, type JobReportStatus } from '../models/model';
import {
    assertInspectorAccess,
    forbidden,
    getActor,
    idParam,
    isAdmin,
    notFound,
    optionalDate,
    optionalEnum,
    optionalInt,
    optionalNumber,
    optionalString,
    pagination,
    recordAudit,
    requireEnum,
    requireInt,
    requireString,
    sanitizeText,
    toPage,
} from '../shared';

export async function getAll(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const page = pagination(req, 25);

    // An inspector sees their own reports; admins see everyone's.
    const inspectorId = isAdmin(actor) ? optionalInt(req.query.inspectorId, 'inspectorId') : actor.id;

    const { rows, total } = await jobReportService.listJobReports(
        {
            inspectorId,
            orderId: optionalInt(req.query.orderId, 'orderId'),
            status: optionalEnum<JobReportStatus>(req.query.status, 'status', JOB_REPORT_STATUSES),
        },
        page,
    );

    res.json(toPage(rows, total, page));
}

export async function getById(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const report = await jobReportService.getJobReport(idParam(req));
    if (!report) throw notFound('Report not found');

    if (!isAdmin(actor)) assertInspectorAccess(actor, report.inspector_id);
    res.json(report);
}

export async function create(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);

    // An inspector files under their own id; an admin may file on their behalf.
    const inspectorId =
        actor.role === 'inspector' && actor.id !== null
            ? actor.id
            : requireInt(req.body.inspector_id, 'inspector_id', { min: 1 });

    if (actor.role === 'inspector' && req.body.inspector_id && req.body.inspector_id !== actor.id) {
        throw forbidden('You can only file reports under your own name');
    }

    const created = await jobReportService.createJobReport({
        order_id: requireInt(req.body.order_id, 'order_id', { min: 1 }),
        inspector_id: inspectorId,
        title: sanitizeText(requireString(req.body.title, 'title', { max: 150 })),
        findings: optionalString(req.body.findings, 'findings', { max: 5000 }),
        recommendations: optionalString(req.body.recommendations, 'recommendations', { max: 5000 }),
        details: optionalString(req.body.details, 'details', { max: 5000 }),
        material_used_cost: optionalNumber(req.body.material_used_cost, 'material_used_cost', {
            min: 0,
            max: 10000000,
        }),
        material_waste_cost: optionalNumber(req.body.material_waste_cost, 'material_waste_cost', {
            min: 0,
            max: 10000000,
        }),
        labour_hours: optionalNumber(req.body.labour_hours, 'labour_hours', { min: 0, max: 10000 }),
        profit: optionalNumber(req.body.profit, 'profit', { min: -10000000, max: 10000000 }),
        report_date: optionalDate(req.body.report_date, 'report_date') ?? new Date().toISOString().slice(0, 10),
        status: requireEnum<JobReportStatus>(req.body.status ?? 'draft', 'status', ['draft', 'submitted']),
    });

    await recordAudit(
        pool,
        {
            action: 'job_report.created',
            entityType: 'report',
            entityId: created.report_id,
            summary: `Report filed for order #${created.order_id} as ${created.status}`,
        },
        { req },
    );

    res.status(201).json(created);
}

export async function update(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    const existing = await jobReportService.getJobReport(id);
    if (!existing) throw notFound('Report not found');

    if (!isAdmin(actor) && !(actor.role === 'inspector' && actor.id === existing.inspector_id)) {
        throw forbidden('You can only edit your own reports');
    }

    const updated = await jobReportService.updateJobReport(id, {
        title:
            req.body.title === undefined
                ? undefined
                : sanitizeText(requireString(req.body.title, 'title', { max: 150 })),
        findings: req.body.findings === undefined ? undefined : optionalString(req.body.findings, 'findings', { max: 5000 }),
        recommendations:
            req.body.recommendations === undefined
                ? undefined
                : optionalString(req.body.recommendations, 'recommendations', { max: 5000 }),
        details: req.body.details === undefined ? undefined : optionalString(req.body.details, 'details', { max: 5000 }),
        material_used_cost:
            req.body.material_used_cost === undefined
                ? undefined
                : optionalNumber(req.body.material_used_cost, 'material_used_cost', { min: 0, max: 10000000 }),
        material_waste_cost:
            req.body.material_waste_cost === undefined
                ? undefined
                : optionalNumber(req.body.material_waste_cost, 'material_waste_cost', { min: 0, max: 10000000 }),
        labour_hours:
            req.body.labour_hours === undefined
                ? undefined
                : optionalNumber(req.body.labour_hours, 'labour_hours', { min: 0, max: 10000 }),
        profit:
            req.body.profit === undefined
                ? undefined
                : optionalNumber(req.body.profit, 'profit', { min: -10000000, max: 10000000 }),
        report_date: optionalDate(req.body.report_date, 'report_date') ?? undefined,
        status:
            req.body.status === undefined
                ? undefined
                : requireEnum<JobReportStatus>(req.body.status, 'status', ['draft', 'submitted']),
    });

    await recordAudit(
        pool,
        { action: 'job_report.updated', entityType: 'report', entityId: id, metadata: { status: updated.status } },
        { req },
    );

    res.json(updated);
}

/** PATCH /api/job-reports/:id/review — admin sign-off, closes the order. */
export async function review(req: Request, res: Response): Promise<void> {
    const actor = getActor(req);
    const id = idParam(req);

    // report.admin_id has a foreign key to the admin table, not super_admin
    // (a separate table) -- only attribute the sign-off when the actor is a
    // plain admin, otherwise the FK is violated for a super_admin reviewer.
    const reviewed = await jobReportService.reviewJobReport(id, actor.role === 'admin' ? actor.id : null);

    await recordAudit(
        pool,
        {
            action: 'job_report.reviewed',
            entityType: 'report',
            entityId: id,
            summary: `Report #${id} signed off, order #${reviewed.order_id} closed`,
        },
        { req },
    );

    res.json(reviewed);
}

export async function remove(req: Request, res: Response): Promise<void> {
    const id = idParam(req);
    const deleted = await jobReportService.softDeleteJobReport(id);
    if (!deleted) throw notFound('Report not found');

    await recordAudit(pool, { action: 'job_report.deleted', entityType: 'report', entityId: id }, { req });

    res.status(204).send();
}
