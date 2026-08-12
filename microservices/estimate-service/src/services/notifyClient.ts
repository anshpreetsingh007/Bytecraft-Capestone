// Thin HTTP client for calling notification-service from estimate-service.
// Kept deliberately small and fire-and-forget-safe: 
// A notification-service outage should never prevent an estimate status update from succeeding.

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

/**
 * Tell every admin an estimate is waiting for review.
 *
 * Broadcast rather than targeted: an estimate isn't owned by one admin, it
 * goes into a shared queue that any of them can action.
 *
 * @param isRevision true when a previously approved/rejected estimate was
 *                   edited back into the queue, so the copy reflects that
 *                   it's a re-review rather than something brand new.
 */
export async function notifyEstimateSubmitted(
    estimateId: number,
    orderId: number,
    isRevision = false
): Promise<void> {
    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'estimate_submitted',
                title: isRevision
                    ? 'A cost estimate was revised and needs re-approval'
                    : 'A cost estimate is waiting for approval',
                message: isRevision
                    ? `Estimate #${estimateId} (order #${orderId}) was edited after being reviewed and needs approval again.`
                    : `Estimate #${estimateId} (order #${orderId}) has been submitted and is ready for review.`,
                related_entity_type: 'cost_estimate',
                related_entity_id: estimateId,
            }),
        });

        if (!response.ok) {
            console.error(`notification-service returned ${response.status} for estimate-submitted notification`);
        }
    } catch (err) {
        // Never let a notification outage block the estimate itself.
        console.error('Failed to send estimate-submitted notification:', err);
    }
}

export async function notifyEstimateApproved(clientId: number, estimateId: number): Promise<void> {
    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_type: 'client',
                recipient_id: clientId,
                type: 'estimate_approved',
                title: 'Your cost estimate has been approved',
                message: `Estimate #${estimateId} has been approved and is now available for you to view.`,
                related_entity_type: 'cost_estimate',
                related_entity_id: estimateId,
            }),
        });

        if (!response.ok) {
            console.error(`notification-service returned ${response.status} for estimate-approved notification`);
        }
    } catch (err) {
        // Don't let a notification-service outage break the estimate approval flow.
        console.error('Failed to send estimate-approved notification:', err);
    }
}