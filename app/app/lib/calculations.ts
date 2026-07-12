import type { Estimate } from "./types";

const SHEET_AREA = 40; // 4ft x 10ft standard sheet

export function calculateEstimate(input: {
  length: number;
  width: number;
  height: number;
  costPerSheet: number;
  wastagePercent: number;
  laborCost: number;
}) {
  const wallArea = 2 * input.height * (input.length + input.width);
  const areaWithWaste = wallArea * (1 + input.wastagePercent / 100);
  const sheetsNeeded = Math.ceil(areaWithWaste / SHEET_AREA);
  const materialCost = sheetsNeeded * input.costPerSheet;
  const totalCost = materialCost + input.laborCost;

  return { sheetsNeeded, totalCost };
}