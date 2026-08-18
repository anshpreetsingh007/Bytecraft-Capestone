/**
 * Low-stock alerts from inventory-service.
 *
 * notification-service deduplicates these, so one item that stays low does not
 * raise a fresh alert on every save -- but the call itself is now retried and
 * carries the internal token.
 */
import { callServiceBestEffort } from '../shared';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

interface LowStockItem {
    id: number;
    name: string;
    quantity: number;
    reorderThreshold: number;
    unit?: string;
}

export async function checkAndNotifyLowStock(item: LowStockItem): Promise<void> {
    // A threshold of zero means no alert is configured for this item.
    if (item.reorderThreshold <= 0 || item.quantity > item.reorderThreshold) return;

    const unit = item.unit ? ` ${item.unit}` : ' units';

    await callServiceBestEffort(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-admins`, {
        callerName: 'inventory-service',
        body: {
            type: 'low_stock',
            title: `Low stock: ${item.name}`,
            message: `${item.name} is down to ${item.quantity}${unit}, at or below the reorder point of ${item.reorderThreshold}.`,
            related_entity_type: 'item',
            related_entity_id: item.id,
        },
    });
}
