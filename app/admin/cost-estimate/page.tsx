"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "./cost-estimate.css";
import { laborRatePerSqFt } from "../mockdata/materialRates";

interface InventoryItem {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    unit: string;
    reorderThreshold: number;
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

function CostEstimateContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const router = useRouter();

  const [requestData, setRequestData] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

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
    if (!requestId) {
        setLoadingRequest(false);
        return;
    }
    async function fetchRequest() {
        try {
            const res = await fetch(`/api/inspection-requests/${requestId}`);
            if (!res.ok) throw new Error("Failed to fetch request data");
            const data = await res.json();
            setRequestData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingRequest(false);
        }
    }
    fetchRequest();
  }, [requestId]);

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

  async function handleSubmitEstimate() {
    setIsSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const details = `Square Footage: ${result.squareFootage}, Material Cost: ${formatCurrency(result.materialCost)}, Labor Cost: ${formatCurrency(result.laborCost)}, Total: ${formatCurrency(result.total)}`;

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: requestData?.order_id || 1, 
          inspector_id: 1, 
          admin_id: 1, 
          details: details,
          estimate_date: new Date().toISOString(),
          status: "pending",
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

  if (!requestId) {
      return (
          <div className="p-6">
              <p>No inspection request selected.</p>
              <button className="text-blue-500 underline mt-2" onClick={() => router.push("/admin/cost-estimate/select")}>
                  Select an Inspection Request
              </button>
          </div>
      );
  }

  if (loadingRequest || loadingInventory) return <div className="p-6">Loading data...</div>;

  return (
    <div className="estimate-page">
      <div className="flex justify-between items-center mb-6">
          <h1 className="page-title m-0">Cost Estimate</h1>
          <button 
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition"
              onClick={() => router.push("/admin/cost-estimate/select")}
          >
              Change Inspection
          </button>
      </div>

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
      
      {requestData && (
          <section className="info-card">
            <h2 className="section-title">Customer Information</h2>

            <div className="info-grid">
              <div className="info-field">
                <span className="info-label">Name</span>
                <span className="info-value">{requestData.first_name} {requestData.last_name}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Address</span>
                <span className="info-value">{requestData.address}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Phone</span>
                <span className="info-value">{requestData.phone}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Email</span>
                <span className="info-value">{requestData.email}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Request Date</span>
                <span className="info-value">
                  {requestData.scheduled_date
                    ? new Date(requestData.scheduled_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not yet scheduled"}
                </span>
              </div>
              <div className="info-field info-field-wide">
                <span className="info-label">Notes</span>
                <span className="info-value">{requestData.details}</span>
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
          Estimate submitted for {requestData?.first_name} {requestData?.last_name} — total{" "}
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
          disabled={!hasValidInput || isSubmitting || !requestData}
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