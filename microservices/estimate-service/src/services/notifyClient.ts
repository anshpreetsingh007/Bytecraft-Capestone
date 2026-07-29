// Thin HTTP client for calling notification-service from estimate-service.
// Kept deliberately small and fire-and-forget-safe: 
// A notification-service outage should never prevent an estimate status update from succeeding.

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

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