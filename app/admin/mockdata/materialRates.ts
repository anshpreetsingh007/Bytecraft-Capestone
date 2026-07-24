import { MaterialRate } from "../types/estimate";

export const materialRates: MaterialRate[] = [
  { id: "asphalt-shingle", label: "Asphalt Shingle", costPerSqFt: 4.5 },
  { id: "metal", label: "Metal", costPerSqFt: 8.75 },
  { id: "tile", label: "Tile", costPerSqFt: 11.0 },
  { id: "flat-membrane", label: "Flat / Membrane", costPerSqFt: 6.25 },
];
export const laborRatePerSqFt = 3.5;