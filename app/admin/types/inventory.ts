export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; 
  reorderThreshold: number;
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return "Out of Stock";
  if (item.quantity <= item.reorderThreshold) return "Low Stock";
  return "In Stock";
}