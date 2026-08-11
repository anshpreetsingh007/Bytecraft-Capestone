import { InventoryItem } from "../types/inventory";

export const mockInventory: InventoryItem[] = [
  { id: "inv-001", name: "Asphalt Shingles (3-tab)", category: "Roofing Material", quantity: 84, unit: "bundles", reorderThreshold: 20, unitCost: 35.00, coverageSqft: 33.3 },
  { id: "inv-002", name: "Metal Roofing Panels", category: "Roofing Material", quantity: 12, unit: "sheets", reorderThreshold: 15, unitCost: 45.00, coverageSqft: 25.0 },
  { id: "inv-003", name: "Roofing Nails (1.25\")", category: "Fasteners", quantity: 340, unit: "lbs", reorderThreshold: 50, unitCost: 2.50, coverageSqft: 100.0 },
  { id: "inv-004", name: "Underlayment Felt", category: "Roofing Material", quantity: 6, unit: "rolls", reorderThreshold: 10, unitCost: 40.00, coverageSqft: 400.0 },
  { id: "inv-005", name: "Ridge Cap Shingles", category: "Roofing Material", quantity: 0, unit: "bundles", reorderThreshold: 5, unitCost: 30.00, coverageSqft: 35.0 },
  { id: "inv-006", name: "Flashing (Aluminum)", category: "Flashing", quantity: 45, unit: "pieces", reorderThreshold: 10, unitCost: 15.00, coverageSqft: 10.0 },
  { id: "inv-007", name: "Caulk / Sealant", category: "Supplies", quantity: 28, unit: "tubes", reorderThreshold: 15, unitCost: 8.50, coverageSqft: 50.0 },
];
