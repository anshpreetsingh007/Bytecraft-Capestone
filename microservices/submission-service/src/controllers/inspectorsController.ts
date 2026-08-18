import type { Request, Response } from 'express';
import * as inspectorsService from '../services/inspectors';
import * as scheduling from '../services/scheduling';
import {
    assertInspectorAccess,
    badRequest,
    getActor,
    idParam,
    requireInt,
    requireTimestamp,
} from '../shared';

/** GET /api/inspectors — staff lookup list. */
export async function getAll(req: Request, res: Response): Promise<void> {
    res.json(await inspectorsService.getAllInspectors(req.query.includeInactive === 'true'));
}

/** GET /api/inspectors/:id/availability */
export async function getAvailability(req: Request, res: Response): Promise<void> {
    const inspectorId = idParam(req);
    assertInspectorAccess(getActor(req), inspectorId);
    res.json(await scheduling.getAvailability(inspectorId));
}

/** PUT /api/inspectors/:id/availability — admin only. Replaces the week. */
export async function replaceAvailability(req: Request, res: Response): Promise<void> {
    const inspectorId = idParam(req);

    if (!Array.isArray(req.body.windows)) {
        throw badRequest('windows must be an array of { weekday, start_minute, end_minute }');
    }
    if (req.body.windows.length > 40) {
        throw badRequest('That is more availability windows than a week can hold');
    }

    const windows = req.body.windows.map((raw: unknown, index: number) => {
        const window = (raw ?? {}) as Record<string, unknown>;
        const startMinute = requireInt(window.start_minute, `windows[${index}].start_minute`, {
            min: 0,
            max: 1439,
        });
        const endMinute = requireInt(window.end_minute, `windows[${index}].end_minute`, {
            min: 1,
            max: 1440,
        });

        if (endMinute <= startMinute) {
            throw badRequest(`windows[${index}] ends before it starts`);
        }

        return {
            weekday: requireInt(window.weekday, `windows[${index}].weekday`, { min: 0, max: 6 }),
            start_minute: startMinute,
            end_minute: endMinute,
        };
    });

    res.json(await scheduling.replaceAvailability(inspectorId, windows));
}

/** GET /api/inspectors/:id/schedule?from=...&to=... */
export async function getSchedule(req: Request, res: Response): Promise<void> {
    const inspectorId = idParam(req);
    assertInspectorAccess(getActor(req), inspectorId);

    const from = requireTimestamp(req.query.from ?? new Date().toISOString(), 'from');
    const to = requireTimestamp(
        req.query.to ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        'to',
    );

    if (to <= from) throw badRequest('to must be after from');
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
        throw badRequest('Ask for at most a year of schedule at a time');
    }

    res.json(await scheduling.getSchedule(inspectorId, from, to));
}

/**
 * POST /api/inspectors/:id/schedule/check
 * Lets the booking form warn about a clash before anything is saved.
 */
export async function checkAvailability(req: Request, res: Response): Promise<void> {
    const inspectorId = idParam(req);
    const startsAt = requireTimestamp(req.body.scheduled_date, 'scheduled_date');
    const durationMinutes = req.body.duration_minutes
        ? requireInt(req.body.duration_minutes, 'duration_minutes', { min: 15, max: 480 })
        : 60;

    const conflicts = await scheduling.findScheduleConflicts({
        inspectorId,
        startsAt,
        durationMinutes,
        ignoreRequestId: req.body.request_id
            ? requireInt(req.body.request_id, 'request_id', { min: 1 })
            : undefined,
    });

    res.json({
        available: conflicts.length === 0,
        blocking: conflicts.filter((conflict) => conflict.kind === 'appointment'),
        warnings: conflicts.filter((conflict) => conflict.kind !== 'appointment'),
    });
}
