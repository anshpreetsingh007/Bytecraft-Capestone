/**
 * Notification and inventory calls from estimate-service.
 *
 * The type name below was the bug that made the admin approval queue silent:
 * 'estimate_submitted' was not in the database CHECK constraint, so every
 * insert raised 23514 and the catch swallowed it. Migration 002 widens the
 * constraint; the shared service client now also retries and logs loudly.
 */
import { callService, callServiceBestEffort, ServiceCallError, conflict } from '../shared';
import type { EstimateMaterial } from '../models/model';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';
const CALLER = 'estimate-service';

const broadcastUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`;
const createUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications`;

export async function notifyEstimateSubmitted(
    estimateId: number,
    orderId: number,
    isRevision = false,
): Promise<void> {
    await callServiceBestEffort(broadcastUrl, {
        callerName: CALLER,
        body: {
            type: 'estimate_submitted',
            title: isRevision
                ? 'A cost estimate was revised and needs re-approval'
                : 'A cost estimate is waiting for approval',
            message: isRevision
                ? `Estimate #${estimateId} (order #${orderId}) was edited after review and needs approval again.`
                : `Estimate #${estimateId} (order #${orderId}) is ready for review.`,
            related_entity_type: 'cost_estimate',
            related_entity_id: estimateId,
        },
    });
}

export async function notifyEstimateDecision(
    clientId: number,
    estimateId: number,
    approved: boolean,
): Promise<void> {
    await callServiceBestEffort(createUrl, {
        callerName: CALLER,
        body: {
            recipient_type: 'client',
            recipient_id: clientId,
            type: approved ? 'estimate_approved' : 'estimate_rejected',
            title: approved ? 'Your cost estimate is ready' : 'Your cost estimate needs revisiting',
            message: approved
                ? `Estimate #${estimateId} has been approved and is ready for you to review and accept.`
                : `Estimate #${estimateId} was sent back for changes. We will be in touch shortly.`,
            related_entity_type: 'cost_estimate',
            related_entity_id: estimateId,
        },
    });
}

export async function notifyInspectorOfDecision(
    inspectorId: number,
    estimateId: number,
    approved: boolean,
): Promise<void> {
    await callServiceBestEffort(createUrl, {
        callerName: CALLER,
        body: {
            recipient_type: 'inspector',
            recipient_id: inspectorId,
            type: approved ? 'estimate_approved' : 'estimate_rejected',
            title: approved ? 'Your estimate was approved' : 'Your estimate was sent back',
            message: `Estimate #${estimateId} was ${approved ? 'approved' : 'rejected'} by an admin.`,
            related_entity_type: 'cost_estimate',
            related_entity_id: estimateId,
        },
    });
}

/** The customer accepting or declining is the event the office cares about most. */
export async function notifyClientResponse(
    estimateId: number,
    accepted: boolean,
    clientName: string,
): Promise<void> {
    await callServiceBestEffort(broadcastUrl, {
        callerName: CALLER,
        body: {
            type: accepted ? 'estimate_accepted_by_client' : 'estimate_declined_by_client',
            title: accepted ? 'A customer accepted an estimate' : 'A customer declined an estimate',
            message: `${clientName} ${accepted ? 'accepted' : 'declined'} estimate #${estimateId}.`,
            related_entity_type: 'cost_estimate',
            related_entity_id: estimateId,
        },
    });
}

/**
 * Draws the priced materials out of stock when an estimate is approved.
 *
 * Not best-effort: if stock cannot be reserved the office needs to know
 * immediately, because the alternative is a crew arriving at a job with
 * materials that were already used elsewhere. inventory-service makes this
 * idempotent per estimate, so a retry cannot double-deduct.
 */
export async function consumeMaterials(
    estimateId: number,
    materials: EstimateMaterial[],
): Promise<{ applied: number } | null> {
    if (materials.length === 0) return { applied: 0 };

    try {
        return await callService<{ applied: number }>(`${INVENTORY_SERVICE_URL}/api/inventory/consume`, {
            callerName: CALLER,
            body: {
                reference_type: 'cost_estimate',
                reference_id: estimateId,
                lines: materials.map((material) => ({
                    item_id: material.material_id,
                    quantity: material.quantity,
                })),
            },
        });
    } catch (error) {
        if (error instanceof ServiceCallError && error.status === 409) {
            throw conflict('Not enough materials in stock to approve this estimate.');
        }
        throw error;
    }
}
