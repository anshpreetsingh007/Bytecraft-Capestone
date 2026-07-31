"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../Context/AuthContext";
import "./cost-estimate.css";

const laborRatePerSqFt = 3.5;

interface InventoryItem {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    unit: string;
    reorderThreshold: number;
}

interface Inspector {
    inspector_id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface OrderWithDetails {
    order_id: number;
    client_id: number;
    request_id: number | null;
    order_date: string;
    status: string;
    client_first_name: string | null;
    client_last_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    client_address: string | null;
    request_details: string | null;
    request_scheduled_date: string | null;
    inspector_id: number | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}

interface EstimateResult {
  squareFootage: number;
  materialCost: number;
  laborCost: number;
  total: number;
  materialQuantity: number;
}

function calculateEstimate(
  length: number,
  width: number,
  height: number,
  material: InventoryItem | undefined
): EstimateResult {
  const baseArea = length * width;
  const pitchAdjustedArea = height > 0 ? baseArea * (1 + height * 0.05) : baseArea;
  const squareFootage = Math.round(pitchAdjustedArea * 100) / 100;
  
  const unitCost = material ? Number(material.unitCost) : 0;
  const materialCost = Math.round(squareFootage * unitCost * 100) / 100;
  const laborCost = Math.round(squareFootage * laborRatePerSqFt * 100) / 100;
  const total = Math.round((materialCost + laborCost) * 100) / 100;
  
  // Estimate material quantity needed (assuming 1 unit covers 1 sqft for simplicity, or we just ceil sqft)
  const materialQuantity = Math.ceil(squareFootage);

  return { squareFootage, materialCost, laborCost, total, materialQuantity };
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatName(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

function CostEstimateContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();
  const { userId } = useAuth(); // real admin_id, now that auth is wired up

  const [orderData, setOrderData] = useState<OrderWithDetails | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loadingInspectors, setLoadingInspectors] = useState(true);
  const [inspectorId, setInspectorId] = useState<number | "">("");

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [materialId, setMaterialId] = useState<number | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const data = await res.json();
        setInventory(data);
        if (data.length > 0) {
          setMaterialId(data[0].id);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingInventory(false);
      }
    }
    fetchInventory();
  }, []);

  useEffect(() => {
    async function fetchInspectors() {
      try {
        const res = await fetch("/api/inspectors");
        if (!res.ok) throw new Error("Failed to fetch inspectors");
        const data = await res.json();
        setInspectors(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingInspectors(false);
      }
    }
    fetchInspectors();
  }, []);

  useEffect(() => {
    if (!orderId) {
        setLoadingOrder(false);
        return;
    }
    async function fetchOrder() {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            if (!res.ok) throw new Error("Failed to fetch order data");
            const data: OrderWithDetails = await res.json();
            setOrderData(data);
            // Default the dropdown to whichever inspector was already on the
            // inspection request, if any — the admin can still change it.
            if (data.inspector_id) {
                setInspectorId(data.inspector_id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingOrder(false);
        }
    }
    fetchOrder();
  }, [orderId]);

  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;

  const selectedMaterial = useMemo(() => {
    return inventory.find(i => i.id === materialId);
  }, [inventory, materialId]);

  const result = useMemo(
    () => calculateEstimate(lengthNum, widthNum, heightNum, selectedMaterial),
    [lengthNum, widthNum, heightNum, selectedMaterial]
  );

  const hasValidInput = lengthNum > 0 && widthNum > 0 && selectedMaterial !== undefined;
  const canSubmit = hasValidInput && !!orderData && inspectorId !== "" && userId !== null;

  async function handleSubmitEstimate() {
    if (!orderData || inspectorId === "" || !userId) return;

    setIsSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const details = `Square Footage: ${result.squareFootage}, Material Cost: ${formatCurrency(result.materialCost)}, Labor Cost: ${formatCurrency(result.laborCost)}, Total: ${formatCurrency(result.total)}`;

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.order_id,
          inspector_id: inspectorId,
          admin_id: userId,
          details: details,
          estimate_date: new Date().toISOString(),
          status: "submitted",
          material_id: materialId !== "" ? materialId : null,
          material_quantity: result.materialQuantity
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push("/admin/estimates");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit estimate:", err);
      setError(err.message || "Failed to submit estimate");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!orderId) {
      return (
          <div className="p-6">
              <p>No order selected.</p>
              <button className="text-blue-500 underline mt-2" onClick={() => router.push("/admin/cost-estimate/select")}>
                  Select an Order
              </button>
          </div>
      );
  }

  if (loadingOrder || loadingInventory || loadingInspectors) return <div className="p-6">Loading data...</div>;

  return (
    <div className="estimate-page">
      <div className="flex justify-between items-center mb-6">
          <h1 className="page-title m-0">Cost Estimate</h1>
          <button 
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition"
              onClick={() => router.push("/admin/cost-estimate/select")}
          >
              Change Order
          </button>
      </div>

      {/* --- Inspector assignment --- */}
      <section className="info-card">
        <h2 className="section-title">Inspector</h2>
        <p className="section-subtitle">
          Since assignment is done here directly, pick which inspector this estimate is for.
        </p>

        {inspectors.length === 0 ? (
          <p className="section-subtitle" style={{ color: "#92400E" }}>
            No inspectors exist yet — one needs to be added before an estimate can be submitted.
          </p>
        ) : (
          <div className="calc-field">
            <label htmlFor="inspector">Inspector</label>
            <select
              id="inspector"
              value={inspectorId}
              onChange={(e) => setInspectorId(Number(e.target.value))}
            >
              <option value="">Select an inspector</option>
              {inspectors.map((i) => (
                <option key={i.inspector_id} value={i.inspector_id}>
                  {i.first_name} {i.last_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* --- Calculation section --- */}
      <section className="calc-card">
        <h2 className="section-title">Calculate Material &amp; Labor Cost</h2>
        <p className="section-subtitle">
          Enter the roof dimensions to calculate square footage and generate a cost estimate.
        </p>

        <div className="calc-grid">
          <div className="calc-field">
            <label htmlFor="length">Length (ft)</label>
            <input
              id="length"
              type="number"
              min="0"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="e.g. 40"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="width">Breadth / Width (ft)</label>
            <input
              id="width"
              type="number"
              min="0"
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="e.g. 25"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="height">Pitch / Height (ft, optional)</label>
            <input
              id="height"
              type="number"
              min="0"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 6"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="material">Material</label>
            <select
              id="material"
              value={materialId}
              onChange={(e) => setMaterialId(Number(e.target.value))}
            >
              {inventory.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({formatCurrency(Number(m.unitCost))}/{m.unit || 'sqft'}) - In stock: {m.quantity}
                </option>
              ))}
              {inventory.length === 0 && <option value="">No materials available</option>}
            </select>
          </div>
        </div>

        {/* --- Live results --- */}
        <div className="calc-results">
          <div className="result-row">
            <span className="result-label">Square Footage</span>
            <span className="result-value">
              {hasValidInput ? `${result.squareFootage.toLocaleString()} sqft` : "—"}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Material Required</span>
            <span className="result-value">
              {hasValidInput ? `${result.materialQuantity} ${selectedMaterial?.unit || 'units'}` : "—"}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Material Cost</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.materialCost) : "—"}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Labor Cost</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.laborCost) : "—"}
            </span>
          </div>
          <div className="result-row result-row-total">
            <span className="result-label">Total Estimate</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.total) : "—"}
            </span>
          </div>
        </div>
      </section>
      
      {orderData && (
          <section className="info-card">
            <h2 className="section-title">Customer Information</h2>

            <div className="info-grid">
              <div className="info-field">
                <span className="info-label">Name</span>
                <span className="info-value">
                  {formatName(orderData.client_first_name, orderData.client_last_name, "Unknown client")}
                </span>
              </div>
              <div className="info-field">
                <span className="info-label">Address</span>
                <span className="info-value">{orderData.client_address || "—"}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Phone</span>
                <span className="info-value">{orderData.client_phone || "—"}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Email</span>
                <span className="info-value">{orderData.client_email || "—"}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Request Date</span>
                <span className="info-value">
                  {orderData.request_scheduled_date
                    ? new Date(orderData.request_scheduled_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not yet scheduled"}
                </span>
              </div>
              <div className="info-field info-field-wide">
                <span className="info-label">Notes</span>
                <span className="info-value">{orderData.request_details || "—"}</span>
              </div>
            </div>
          </section>
      )}

      {error && (
        <div className="submit-banner" style={{ backgroundColor: "#ffcccc", color: "#990000", borderColor: "#cc0000" }}>
          Error: {error}
        </div>
      )}

      {submitted && (
        <div className="submit-banner">
          Estimate submitted for {orderData ? formatName(orderData.client_first_name, orderData.client_last_name, "the client") : "the client"} — total{" "}
          {formatCurrency(result.total)}. Redirecting...
        </div>
      )}

      <div className="estimate-actions">
        <button className="btn-secondary" onClick={() => setSubmitted(false)} type="button">
          Reset
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmitEstimate}
          disabled={!canSubmit || isSubmitting}
          type="button"
        >
          {isSubmitting ? "Submitting..." : "Submit Estimate"}
        </button>
      </div>
    </div>
  );
}

export default function CostEstimatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CostEstimateContent />
        </Suspense>
    );
}
