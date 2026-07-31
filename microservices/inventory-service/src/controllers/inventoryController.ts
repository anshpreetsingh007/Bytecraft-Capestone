/**
 * Handles business logic for inventory management, including fetching, creating,
 * updating, and deleting inventory items in the PostgreSQL database.
 */
import { Request, Response } from 'express';
import { pool } from '../config/db';
import { checkAndNotifyLowStock } from '../services/notifyClient';

/**
 * Retrieves all inventory items from the database, ordered by ID descending.
 */
export async function getAllItems(req: Request, res: Response) {
    try {
        const result = await pool.query('SELECT item_id as id, name, category, qty_on_hand as quantity, unit_cost as "unitCost", unit, reorder_threshold as "reorderThreshold" FROM items ORDER BY item_id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
}

/**
 * Creates a new inventory item and checks if stock is low to notify clients.
 */
export async function createItem(req: Request, res: Response) {
    try {
        const { name, category, quantity, unitCost, unit, reorderThreshold } = req.body;

        if (!name || !category || !unit) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO items (stock_id, name, description, qty_on_hand, unit_cost, category, unit, reorder_threshold) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING item_id as id, name, category, qty_on_hand as quantity, unit_cost as "unitCost", unit, reorder_threshold as "reorderThreshold"`,
            [1, name, category, quantity || 0, unitCost || 0, category, unit, reorderThreshold || 0]
        );

        const newItem = result.rows[0];
        await checkAndNotifyLowStock(newItem);

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
}

/**
 * Updates an existing inventory item based on its ID.
 */
export async function updateItem(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const { name, category, quantity, unitCost, unit, reorderThreshold } = req.body;

        const result = await pool.query(
            `UPDATE items 
             SET name = $1, category = $2, qty_on_hand = $3, unit_cost = $4, unit = $5, reorder_threshold = $6 
             WHERE item_id = $7 
             RETURNING item_id as id, name, category, qty_on_hand as quantity, unit_cost as "unitCost", unit, reorder_threshold as "reorderThreshold"`,
            [name, category, quantity, unitCost, unit, reorderThreshold, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        const updatedItem = result.rows[0];
        await checkAndNotifyLowStock(updatedItem);

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
}

/**
 * Deletes an inventory item from the database.
 */
export async function deleteItem(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id as string);
        const result = await pool.query('DELETE FROM items WHERE item_id = $1 RETURNING item_id', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
}