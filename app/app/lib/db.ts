import fs from "fs";
import path from "path";
import { calculateEstimate } from "./calculations";
import type { Estimate, Order } from "./types";

const FILE = path.join(process.cwd(), "data", "db.json");

function readData(): { estimates: Estimate[]; orders: Order[] } {
  if (!fs.existsSync(FILE)) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ estimates: [], orders: [] }));
  }
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function writeData(data: { estimates: Estimate[]; orders: Order[] }) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ----- Estimates -----

export function getEstimates(): Estimate[] {
  return readData().estimates;
}

export function getEstimate(id: string): Estimate | undefined {
  return readData().estimates.find((e) => e.id === id);
}

export function createEstimate(input: {
  projectName: string;
  clientName: string;
  clientEmail: string;
  length: number;
  width: number;
  height: number;
  material: string;
  costPerSheet: number;
  wastagePercent: number;
  laborCost: number;
}): Estimate {
  const data = readData();
  const { sheetsNeeded, totalCost } = calculateEstimate(input);

  const estimate: Estimate = {
    id: "est_" + Date.now(),
    ...input,
    sheetsNeeded,
    totalCost,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  data.estimates.push(estimate);
  writeData(data);
  return estimate;
}

export function updateEstimateStatus(id: string, status: Estimate["status"]): Estimate | undefined {
  const data = readData();
  const estimate = data.estimates.find((e) => e.id === id);
  if (!estimate) return undefined;
  estimate.status = status;
  writeData(data);
  return estimate;
}

// ----- Orders -----

export function getOrders(): Order[] {
  return readData().orders;
}

export function getOrder(id: string): Order | undefined {
  return readData().orders.find((o) => o.id === id);
}

export function createOrderFromEstimate(estimateId: string): Order | null {
  const data = readData();
  const estimate = data.estimates.find((e) => e.id === estimateId);
  if (!estimate || estimate.status !== "approved") return null;

  const order: Order = {
    id: "ord_" + Date.now(),
    estimateId: estimate.id,
    projectName: estimate.projectName,
    clientName: estimate.clientName,
    totalCost: estimate.totalCost,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  data.orders.push(order);
  writeData(data);
  return order;
}

export function updateOrderStatus(id: string, status: Order["status"]): Order | undefined {
  const data = readData();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = status;
  writeData(data);
  return order;
}