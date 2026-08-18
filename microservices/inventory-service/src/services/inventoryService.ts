import { pool } from '../config/db';
import {
    ConsumeLine,
    CreateItemInput,
    InventoryItem,
    MovementInput,
    MovementReason,
    UpdateItemInput,
} from '../models/model';
import { badRequest, conflict, notFound, type Pagination } from '../shared';
import { checkAndNotifyLowStock } from './notifyClient';

const ITEM_SELECT = `
    SELECT item_id AS id,
           name,
           description,
           category,
           qty_on_hand AS quantity,
           unit_cost AS "unitCost",
           unit,
           reorder_threshold AS "reorderThreshold",
           coverage_sqft AS "coverageSqft",
           (reorder_threshold > 0 AND qty_on_hand <= reorder_threshold) AS "isLow"
    FROM items
`;

export interface ItemFilters {
    search?: string | null;
    category?: string | null;
    lowStockOnly?: boolean;
}

export async function listItems(
    filters: ItemFilters,
    page: Pagination,
): Promise<{ rows: InventoryItem[]; total: number }> {
    const conditions = ['deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.search) {
        params.push(`%${filters.search}%`);
        conditions.push(`(name ILIKE $${params.length} OR category ILIKE $${params.length})`);
    }
    if (filters.category) {
        params.push(filters.category);
        conditions.push(`category = $${params.length}`);
    }
    if (filters.lowStockOnly) {
        conditions.push('reorder_threshold > 0 AND qty_on_hand <= reorder_threshold');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, total] = await Promise.all([
        pool.query(
            `${ITEM_SELECT} ${where} ORDER BY item_id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM items ${where}`, params),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}

export async function getItem(id: number): Promise<InventoryItem | null> {
    const result = await pool.query(`${ITEM_SELECT} WHERE item_id = $1 AND deleted_at IS NULL`, [id]);
    return result.rows[0] ?? null;
}

/**
 * Default stock location.
 *
 * items.stock_id was hard-coded to 1 by the old controller, which meant every
 * insert failed with a foreign key violation on any database where stock row 1
 * did not happen to exist. This creates it on demand instead.
 */
async function defaultStockId(): Promise<number> {
    const existing = await pool.query('SELECT stock_id FROM stock ORDER BY stock_id LIMIT 1');
    if (existing.rows[0]) return existing.rows[0].stock_id;

    const created = await pool.query(
        `INSERT INTO stock (location, name, status, last_updated, low_stock_alert)
         VALUES ('Main warehouse', 'Main warehouse', 'active', CURRENT_DATE, 0)
         RETURNING stock_id`,
    );
    return created.rows[0].stock_id;
}

/** Appends to the ledger. Always called inside the caller's transaction. */
async function appendMovement(
    client: { query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }> },
    input: MovementInput & { balanceAfter: number },
): Promise<void> {
    await client.query(
        `INSERT INTO inventory_movement
            (item_id, change_qty, balance_after, reason, related_entity_type,
             related_entity_id, note, actor_role, actor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            input.itemId,
            input.changeQty,
            input.balanceAfter,
            input.reason,
            input.relatedEntityType ?? null,
            input.relatedEntityId ?? null,
            input.note ?? null,
            input.actorRole ?? null,
            input.actorId ?? null,
        ],
    );
}

export async function createItem(
    data: CreateItemInput,
    actor: { role: string | null; id: number | null },
): Promise<InventoryItem> {
    const stockId = await defaultStockId();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const inserted = await client.query(
            `INSERT INTO items
                (stock_id, name, description, qty_on_hand, unit_cost, category, unit,
                 reorder_threshold, coverage_sqft)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING item_id`,
            [
                stockId,
                data.name,
                data.description,
                data.quantity,
                data.unitCost,
                data.category,
                data.unit,
                data.reorderThreshold,
                data.coverageSqft,
            ],
        );

        const itemId = inserted.rows[0].item_id;

        if (data.quantity !== 0) {
            await appendMovement(client, {
                itemId,
                changeQty: data.quantity,
                balanceAfter: data.quantity,
                reason: 'initial',
                note: 'Opening balance',
                actorRole: actor.role,
                actorId: actor.id,
            });
        }

        await client.query('COMMIT');

        const created = await getItem(itemId);
        if (!created) throw notFound('Item could not be read back after creation');
        await checkAndNotifyLowStock(created);
        return created;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function updateItem(
    id: number,
    data: UpdateItemInput,
    actor: { role: string | null; id: number | null },
): Promise<InventoryItem> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // FOR UPDATE so two admins editing the same item cannot both compute a
        // movement from the same starting quantity.
        const currentResult = await client.query(
            'SELECT qty_on_hand FROM items WHERE item_id = $1 AND deleted_at IS NULL FOR UPDATE',
            [id],
        );
        const current = currentResult.rows[0];
        if (!current) throw notFound('Item not found');

        const previousQuantity = Number(current.qty_on_hand);
        const nextQuantity = data.quantity ?? previousQuantity;

        await client.query(
            `UPDATE items
             SET name = COALESCE($2, name),
                 description = COALESCE($3, description),
                 category = COALESCE($4, category),
                 qty_on_hand = $5,
                 unit_cost = COALESCE($6, unit_cost),
                 unit = COALESCE($7, unit),
                 reorder_threshold = COALESCE($8, reorder_threshold),
                 coverage_sqft = COALESCE($9, coverage_sqft)
             WHERE item_id = $1`,
            [
                id,
                data.name ?? null,
                data.description ?? null,
                data.category ?? null,
                nextQuantity,
                data.unitCost ?? null,
                data.unit ?? null,
                data.reorderThreshold ?? null,
                data.coverageSqft ?? null,
            ],
        );

        // A quantity typed straight into the form is an adjustment, and it now
        // leaves a trace. Previously stock could be silently rewritten with
        // nothing recording who did it or why.
        if (nextQuantity !== previousQuantity) {
            await appendMovement(client, {
                itemId: id,
                changeQty: nextQuantity - previousQuantity,
                balanceAfter: nextQuantity,
                reason: 'adjustment',
                note: 'Manual stock adjustment',
                actorRole: actor.role,
                actorId: actor.id,
            });
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    const updated = await getItem(id);
    if (!updated) throw notFound('Item not found');
    await checkAndNotifyLowStock(updated);
    return updated;
}

/** Soft delete: inventory_movement and estimate material lines reference it. */
export async function softDeleteItem(id: number): Promise<boolean> {
    const result = await pool.query(
        'UPDATE items SET deleted_at = now() WHERE item_id = $1 AND deleted_at IS NULL',
        [id],
    );
    return (result.rowCount ?? 0) > 0;
}

export interface ConsumeResult {
    applied: number;
    alreadyApplied: boolean;
    items: { item_id: number; quantity: number; balance_after: number }[];
}

/**
 * Draws stock for an approved estimate.
 *
 * Idempotent per (reference, item): the partial unique index on
 * inventory_movement means a repeated approval cannot deduct twice, and the
 * ON CONFLICT DO NOTHING turns that into a no-op rather than a 500.
 *
 * Runs in one transaction with row locks so two estimates approved at the same
 * moment cannot both read the same starting quantity and oversell stock.
 */
export async function consumeForReference(
    referenceType: string,
    referenceId: number,
    lines: ConsumeLine[],
    actor: { role: string | null; id: number | null },
): Promise<ConsumeResult> {
    if (lines.length === 0) return { applied: 0, alreadyApplied: false, items: [] };

    const client = await pool.connect();
    const applied: ConsumeResult['items'] = [];

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            `SELECT 1 FROM inventory_movement
             WHERE reason = 'consumption' AND related_entity_type = $1 AND related_entity_id = $2
             LIMIT 1`,
            [referenceType, referenceId],
        );
        if ((existing.rowCount ?? 0) > 0) {
            await client.query('ROLLBACK');
            return { applied: 0, alreadyApplied: true, items: [] };
        }

        // Deterministic lock order avoids deadlocking against a concurrent
        // consumption that touches the same items in a different sequence.
        const ordered = [...lines].sort((a, b) => a.item_id - b.item_id);

        for (const line of ordered) {
            const itemResult = await client.query(
                'SELECT item_id, name, qty_on_hand FROM items WHERE item_id = $1 AND deleted_at IS NULL FOR UPDATE',
                [line.item_id],
            );
            const item = itemResult.rows[0];
            if (!item) throw badRequest(`Inventory item #${line.item_id} no longer exists`);

            const balanceAfter = Number(item.qty_on_hand) - line.quantity;
            if (balanceAfter < 0) {
                throw conflict(
                    `Not enough ${item.name} in stock: ${item.qty_on_hand} on hand, ${line.quantity} needed`,
                    { itemId: item.item_id, onHand: Number(item.qty_on_hand), required: line.quantity },
                );
            }

            await client.query('UPDATE items SET qty_on_hand = $2 WHERE item_id = $1', [
                line.item_id,
                balanceAfter,
            ]);

            await client.query(
                `INSERT INTO inventory_movement
                    (item_id, change_qty, balance_after, reason, related_entity_type,
                     related_entity_id, note, actor_role, actor_id)
                 VALUES ($1, $2, $3, 'consumption', $4, $5, $6, $7, $8)
                 ON CONFLICT (related_entity_type, related_entity_id, item_id)
                     WHERE reason = 'consumption'
                     DO NOTHING`,
                [
                    line.item_id,
                    -line.quantity,
                    balanceAfter,
                    referenceType,
                    referenceId,
                    `Consumed by ${referenceType} #${referenceId}`,
                    actor.role,
                    actor.id,
                ],
            );

            applied.push({ item_id: line.item_id, quantity: line.quantity, balance_after: balanceAfter });
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    // Consumption is the most likely thing to push an item below its reorder
    // threshold, so the low-stock check runs after the transaction commits.
    for (const line of applied) {
        const item = await getItem(line.item_id);
        if (item) await checkAndNotifyLowStock(item);
    }

    return { applied: applied.length, alreadyApplied: false, items: applied };
}

export async function receiveStock(
    itemId: number,
    quantity: number,
    reason: MovementReason,
    note: string | null,
    actor: { role: string | null; id: number | null },
): Promise<InventoryItem> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const itemResult = await client.query(
            'SELECT qty_on_hand FROM items WHERE item_id = $1 AND deleted_at IS NULL FOR UPDATE',
            [itemId],
        );
        if (!itemResult.rows[0]) throw notFound('Item not found');

        const balanceAfter = Number(itemResult.rows[0].qty_on_hand) + quantity;
        if (balanceAfter < 0) throw conflict('That would take the item below zero');

        await client.query('UPDATE items SET qty_on_hand = $2 WHERE item_id = $1', [itemId, balanceAfter]);
        await appendMovement(client, {
            itemId,
            changeQty: quantity,
            balanceAfter,
            reason,
            note,
            actorRole: actor.role,
            actorId: actor.id,
        });

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

    const updated = await getItem(itemId);
    if (!updated) throw notFound('Item not found');
    await checkAndNotifyLowStock(updated);
    return updated;
}

export async function listMovements(
    itemId: number | null,
    page: Pagination,
): Promise<{ rows: unknown[]; total: number }> {
    const where = itemId ? 'WHERE m.item_id = $1' : '';
    const params: unknown[] = itemId ? [itemId] : [];

    const [rows, total] = await Promise.all([
        pool.query(
            `SELECT m.*, i.name AS item_name, i.unit
             FROM inventory_movement m
             LEFT JOIN items i ON i.item_id = m.item_id
             ${where}
             ORDER BY m.created_at DESC, m.movement_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, page.limit, page.offset],
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM inventory_movement m ${where}`, params),
    ]);

    return { rows: rows.rows, total: total.rows[0].count };
}
