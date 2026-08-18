import pool from '../config/db';
import { AvailabilityWindow, ScheduleConflict } from '../models/model';

/**
 * Appointment scheduling.
 *
 * scheduled_date used to be a DATE, so an appointment could not carry a time
 * of day and two inspectors could be sent to opposite ends of the city in the
 * same hour with nothing to flag it. It is now a TIMESTAMPTZ with a duration,
 * and every booking is checked against three things: the inspector's working
 * hours, their booked time off, and their existing appointments.
 */

/** IANA zone the company's working hours are expressed in. */
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Edmonton';

/**
 * Weekday and minute-of-day for an instant, in the business timezone.
 *
 * Doing this with Intl rather than getDay()/getHours() matters: the container
 * runs in UTC, so a 9am Calgary appointment would otherwise look like 15:00
 * and fall outside every working-hours window.
 */
function businessLocalParts(instant: Date): { weekday: number; minuteOfDay: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(instant);
    const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

    const weekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = weekdayNames.indexOf(lookup('weekday').toLowerCase().slice(0, 3));

    // Intl renders midnight as "24" in some ICU versions.
    const hour = Number(lookup('hour')) % 24;
    const minute = Number(lookup('minute'));

    return { weekday: weekday < 0 ? 0 : weekday, minuteOfDay: hour * 60 + minute };
}

export async function getAvailability(inspectorId: number): Promise<AvailabilityWindow[]> {
    const result = await pool.query(
        `SELECT availability_id, inspector_id, weekday, start_minute, end_minute
         FROM inspector_availability
         WHERE inspector_id = $1
         ORDER BY weekday, start_minute`,
        [inspectorId],
    );
    return result.rows;
}

/** Replaces the whole weekly pattern in one transaction. */
export async function replaceAvailability(
    inspectorId: number,
    windows: AvailabilityWindow[],
): Promise<AvailabilityWindow[]> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM inspector_availability WHERE inspector_id = $1', [inspectorId]);

        for (const window of windows) {
            await client.query(
                `INSERT INTO inspector_availability (inspector_id, weekday, start_minute, end_minute)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (inspector_id, weekday, start_minute) DO UPDATE
                    SET end_minute = EXCLUDED.end_minute`,
                [inspectorId, window.weekday, window.start_minute, window.end_minute],
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    return getAvailability(inspectorId);
}

export interface ConflictCheckInput {
    inspectorId: number;
    startsAt: Date;
    durationMinutes: number;
    /** Excluded from the overlap check when rescheduling an existing booking. */
    ignoreRequestId?: number;
}

export async function findScheduleConflicts(input: ConflictCheckInput): Promise<ScheduleConflict[]> {
    const { inspectorId, startsAt, durationMinutes, ignoreRequestId } = input;
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    const conflicts: ScheduleConflict[] = [];

    // 1. Inside the inspector's working hours?
    const windows = await getAvailability(inspectorId);
    if (windows.length > 0) {
        const start = businessLocalParts(startsAt);
        const end = businessLocalParts(new Date(endsAt.getTime() - 1));

        const fits =
            start.weekday === end.weekday &&
            windows.some(
                (window) =>
                    window.weekday === start.weekday &&
                    start.minuteOfDay >= window.start_minute &&
                    end.minuteOfDay < window.end_minute,
            );

        if (!fits) {
            conflicts.push({
                kind: 'outside_hours',
                message: 'This falls outside the working hours set for that inspector.',
            });
        }
    }

    // 2. Booked time off?
    const timeOff = await pool.query(
        `SELECT reason, starts_at, ends_at
         FROM inspector_time_off
         WHERE inspector_id = $1 AND starts_at < $3 AND ends_at > $2`,
        [inspectorId, startsAt.toISOString(), endsAt.toISOString()],
    );
    for (const row of timeOff.rows) {
        conflicts.push({
            kind: 'time_off',
            message: row.reason
                ? `That inspector is away (${row.reason}) at that time.`
                : 'That inspector has booked time off at that time.',
        });
    }

    // 3. Overlapping appointment? Two intervals overlap when each starts
    //    before the other ends -- comparing start times alone misses the case
    //    where a long job runs into a later one.
    const overlapping = await pool.query(
        `SELECT request_id, scheduled_date
         FROM inspection_request
         WHERE inspector_id = $1
           AND deleted_at IS NULL
           AND scheduled_date IS NOT NULL
           AND status NOT IN ('cancelled', 'completed')
           AND ($4::int IS NULL OR request_id <> $4)
           AND scheduled_date < $3
           AND scheduled_date + make_interval(mins => duration_minutes) > $2
         ORDER BY scheduled_date`,
        [inspectorId, startsAt.toISOString(), endsAt.toISOString(), ignoreRequestId ?? null],
    );

    for (const row of overlapping.rows) {
        conflicts.push({
            kind: 'appointment',
            message: `That inspector already has inspection #${row.request_id} booked at that time.`,
            request_id: row.request_id,
            scheduled_date: row.scheduled_date,
        });
    }

    return conflicts;
}

export interface ScheduleEntry {
    request_id: number;
    scheduled_date: string;
    duration_minutes: number;
    status: string;
    client_first_name: string | null;
    client_last_name: string | null;
    site_address: string | null;
}

/** An inspector's booked work between two instants, for the calendar view. */
export async function getSchedule(inspectorId: number, from: Date, to: Date): Promise<ScheduleEntry[]> {
    const result = await pool.query(
        `SELECT ir.request_id, ir.scheduled_date, ir.duration_minutes, ir.status,
                ir.site_address, c.first_name AS client_first_name, c.last_name AS client_last_name
         FROM inspection_request ir
         LEFT JOIN client c ON c.client_id = ir.client_id
         WHERE ir.inspector_id = $1
           AND ir.deleted_at IS NULL
           AND ir.scheduled_date IS NOT NULL
           AND ir.scheduled_date >= $2
           AND ir.scheduled_date < $3
           AND ir.status <> 'cancelled'
         ORDER BY ir.scheduled_date`,
        [inspectorId, from.toISOString(), to.toISOString()],
    );
    return result.rows;
}
