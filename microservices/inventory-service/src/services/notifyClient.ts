// Thin HTTP client for calling notification-service from inventory-service.
// Fire-and-forget-safe: a notification-service outage should never prevent
// an inventory create/update from succeeding.

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

interface LowStockItem {
    id: number;
    name: string;
    quantity: number;
    reorderThreshold: number;
}

export async function checkAndNotifyLowStock(item: LowStockItem): Promise<void> {
    // reorderThreshold of 0 means "no alert configured" for this item.
    if (item.reorderThreshold <= 0 || item.quantity > item.reorderThreshold) {
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'low_stock',
                title: `Low stock: ${item.name}`,
                message: `${item.name} is at ${item.quantity} units, at or below the reorder threshold of ${item.reorderThreshold}.`,
                related_entity_type: 'item',
                related_entity_id: item.id,
            }),
        });

        if (!response.ok) {
            console.error(`notification-service returned ${response.status} for low-stock notification`);
        }
    } catch (err) {
        console.error('Failed to send low-stock notification:', err);
    }
}