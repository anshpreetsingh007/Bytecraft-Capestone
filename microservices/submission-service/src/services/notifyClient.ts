/**
 * Notification calls from submission-service.
 *
 * Every call goes through the shared service client, so it carries the
 * internal token, retries transient failures with backoff, and logs loudly if
 * it eventually gives up -- rather than the previous single bare fetch whose
 * failure vanished into a console.error.
 */
import { callServiceBestEffort } from '../shared';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const CALLER = 'submission-service';

const broadcastUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`;
const createUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications`;

export async function notifyRequestSubmitted(
    requestId: number,
    clientName: string,
): Promise<void> {
    await callServiceBestEffort(broadcastUrl, {
        callerName: CALLER,
        body: {
            type: 'inspection_request_submitted',
            title: 'New inspection request',
            message: `${clientName} submitted inspection request #${requestId}.`,
            related_entity_type: 'inspection_request',
            related_entity_id: requestId,
        },
    });
}

export async function notifyInspectorAssigned(
    inspectorId: number,
    requestId: number,
    scheduledFor: string | null,
): Promise<void> {
    await callServiceBestEffort(createUrl, {
        callerName: CALLER,
        body: {
            recipient_type: 'inspector',
            recipient_id: inspectorId,
            type: 'inspection_assigned',
            title: 'You have a new inspection',
            message: scheduledFor
                ? `Inspection #${requestId} has been assigned to you for ${scheduledFor}.`
                : `Inspection #${requestId} has been assigned to you.`,
            related_entity_type: 'inspection_request',
            related_entity_id: requestId,
        },
    });
}

export async function notifyClientScheduled(
    clientId: number,
    requestId: number,
    scheduledFor: string,
): Promise<void> {
    await callServiceBestEffort(createUrl, {
        callerName: CALLER,
        body: {
            recipient_type: 'client',
            recipient_id: clientId,
            type: 'inspection_scheduled',
            title: 'Your inspection has been booked',
            message: `Inspection #${requestId} is booked for ${scheduledFor}.`,
            related_entity_type: 'inspection_request',
            related_entity_id: requestId,
        },
    });
}

export async function notifyClientStatusChanged(
    clientId: number,
    requestId: number,
    status: string,
): Promise<void> {
    const wording: Record<string, string> = {
        assigned: 'has been assigned to an inspector',
        in_progress: 'is now underway',
        completed: 'has been completed',
        cancelled: 'has been cancelled',
    };

    await callServiceBestEffort(createUrl, {
        callerName: CALLER,
        body: {
            recipient_type: 'client',
            recipient_id: clientId,
            type: 'inspection_status_changed',
            title: 'Update on your inspection',
            message: `Inspection #${requestId} ${wording[status] ?? `is now ${status}`}.`,
            related_entity_type: 'inspection_request',
            related_entity_id: requestId,
        },
    });
}
