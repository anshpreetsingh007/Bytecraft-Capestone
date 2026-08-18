export const MOVEMENT_REASONS = [
    'initial',
    'receipt',
    'consumption',
    'return',
    'adjustment',
    'correction',
    'write_off',
] as const;

export type MovementReason = (typeof MOVEMENT_REASONS)[number];

/** Camel-cased on the way out because that is what the admin UI consumes. */
export interface InventoryItem {
    id: number;
    name: string;
    description: string | null;
    category: string;
    quantity: number;
    unitCost: string | number;
    unit: string;
    reorderThreshold: number;
    coverageSqft: string | number;
    isLow: boolean;
}

export interface CreateItemInput {
    name: string;
    description: string | null;
    category: string;
    quantity: number;
    unitCost: number;
    unit: string;
    reorderThreshold: number;
    coverageSqft: number;
}

export interface UpdateItemInput {
    name?: string;
    description?: string | null;
    category?: string;
    quantity?: number;
    unitCost?: number;
    unit?: string;
    reorderThreshold?: number;
    coverageSqft?: number;
}

export interface MovementInput {
    itemId: number;
    changeQty: number;
    reason: MovementReason;
    relatedEntityType?: string | null;
    relatedEntityId?: number | null;
    note?: string | null;
    actorRole?: string | null;
    actorId?: number | null;
}

export interface ConsumeLine {
    item_id: number;
    quantity: number;
}
