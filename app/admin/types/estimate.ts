export type MaterialType = "asphalt-shingle" | "metal" | "tile" | "flat-membrane";

export interface MaterialRate {
  id: MaterialType;
  label: string;
  costPerSqFt: number; 
}

export interface CustomerRequest {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  email: string;
  requestDate: string; 
  notes: string;
}

export interface EstimateResult {
  squareFootage: number;
  materialCost: number;
  laborCost: number;
  total: number;
}