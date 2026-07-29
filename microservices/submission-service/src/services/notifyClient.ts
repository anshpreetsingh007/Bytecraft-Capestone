// Thin HTTP client for calling notification-service from submission-service.
// Fire-and-forget-safe: a notification-service outage should never prevent
// a client's inspection request from being submitted successfully.

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

export async function notifyInspectionRequestSubmitted(requestId: number, clientId: number): Promise<void> {
    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'inspection_request_submitted',
                title: 'New inspection request submitted',
                message: `Client #${clientId} submitted a new inspection request (#${requestId}).`,
                related_entity_type: 'inspection_request',
                related_entity_id: requestId,
            }),
        });

        if (!response.ok) {
            console.error(`notification-service returned ${response.status} for inspection-request-submitted notification`);
        }
    } catch (err) {
        console.error('Failed to send inspection-request-submitted notification:', err);
    }
}