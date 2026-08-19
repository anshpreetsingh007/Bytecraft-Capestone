"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../Context/AuthContext";

import SelectInspectionPage from "./select/page";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { api, errorMessage, rows } from "@/lib/api";
import { Banner, SkeletonRows, useToast } from "../../../components/ui";
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
    coverageSqft?: number;
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

interface MaterialBreakdown {
  inventoryItem: InventoryItem;
  quantityNeeded: number;
  cost: number;
}

interface EstimateResult {
  squareFootage: number;
  materialBreakdown: MaterialBreakdown[];
  totalMaterialCost: number;
  laborCost: number;
  total: number;
}

function calculateEstimate(
  length: number,
  width: number,
  height: number,
  materials: InventoryItem[]
): EstimateResult {
  const baseArea = length * width;
  const pitchAdjustedArea = height > 0 ? baseArea * (1 + height * 0.05) : baseArea;
  const squareFootage = Math.round(pitchAdjustedArea * 100) / 100;
  
  let totalMaterialCost = 0;
  const materialBreakdown: MaterialBreakdown[] = [];

  for (const material of materials) {
    const coverage = material.coverageSqft || 1.0;
    const unitCost = Number(material.unitCost) || 0;
    
    // Calculate how many units (e.g. bundles) are needed
    const quantityNeeded = Math.ceil(squareFootage / coverage);
    const cost = Math.round(quantityNeeded * unitCost * 100) / 100;
    
    totalMaterialCost += cost;
    materialBreakdown.push({ inventoryItem: material, quantityNeeded, cost });
  }
  
  totalMaterialCost = Math.round(totalMaterialCost * 100) / 100;
  const laborCost = Math.round(squareFootage * laborRatePerSqFt * 100) / 100;
  const total = Math.round((totalMaterialCost + laborCost) * 100) / 100;

  return { squareFootage, materialBreakdown, totalMaterialCost, laborCost, total };
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
  const estimateId = searchParams.get("estimateId");
  const router = useRouter();
  const toast = useToast();
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
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [materialToAdd, setMaterialToAdd] = useState<number | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing an existing estimate. `existingStatus` drives the re-approval
  // warning: the server sends an approved estimate back to 'submitted' on any
  // content edit, so the admin needs to know before they save.
  const [loadingEstimate, setLoadingEstimate] = useState(!!estimateId);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!estimateId) {
      setLoadingEstimate(false);
      return;
    }

    const controller = new AbortController();

    async function fetchEstimate() {
      try {
        const data = await api.get<Record<string, unknown>>(`/api/estimates/${estimateId}`, {
          signal: controller.signal,
        });

        setExistingStatus(typeof data.status === "string" ? data.status : null);

        // Dimensions come back as numeric strings from pg; the inputs are
        // controlled text fields, so normalise to string and skip nulls
        // (estimates created before dimensions were stored have none).
        if (data.length_ft !== null && data.length_ft !== undefined) setLength(String(data.length_ft));
        if (data.width_ft !== null && data.width_ft !== undefined) setWidth(String(data.width_ft));
        if (data.pitch_ft !== null && data.pitch_ft !== undefined) setHeight(String(data.pitch_ft));

        if (data.inspector_id) setInspectorId(data.inspector_id as number);

        // materials is jsonb: [{ material_id, quantity, cost }, ...]
        if (Array.isArray(data.materials)) {
          const ids = data.materials
            .map((m: { material_id?: number }) => m?.material_id)
            .filter((id: unknown): id is number => typeof id === "number");
          setSelectedMaterialIds(ids);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load estimate for editing:", err);
        setError(
          "Couldn't load this estimate to edit. Saving now would overwrite it, so please reload before making changes."
        );
      } finally {
        setLoadingEstimate(false);
      }
    }

    fetchEstimate();
    return () => controller.abort();
  }, [estimateId]);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const payload = await api.get<InventoryItem[]>("/api/inventory?limit=100");
        setInventory(rows(payload));
      } catch (err) {
        // Without materials the calculator cannot price anything, so this is
        // surfaced rather than logged and forgotten.
        setError(errorMessage(err, "Could not load the materials list."));
      } finally {
        setLoadingInventory(false);
      }
    }
    fetchInventory();
  }, []);

  useEffect(() => {
    async function fetchInspectors() {
      try {
        const payload = await api.get<Inspector[]>("/api/inspectors");
        setInspectors(rows(payload));
      } catch (err) {
        setError(errorMessage(err, "Could not load the inspector list."));
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
            const data = await api.get<OrderWithDetails>(`/api/orders/${orderId}`);
            setOrderData(data);
            // Default the dropdown to whichever inspector was already on the
            // inspection request, if any — the admin can still change it.
            // Skipped when editing: the estimate's own inspector is the
            // authoritative value and these two fetches race otherwise.
            if (data.inspector_id && !estimateId) {
                setInspectorId(data.inspector_id);
            }
        } catch (err) {
            setError(errorMessage(err, "Could not load that order."));
        } finally {
            setLoadingOrder(false);
        }
    }
    fetchOrder();
  }, [orderId, estimateId]);

  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;

  const selectedMaterials = useMemo(() => {
    return selectedMaterialIds
      .map(id => inventory.find(i => i.id === id))
      .filter((i): i is InventoryItem => i !== undefined);
  }, [inventory, selectedMaterialIds]);

  const result = useMemo(
    () => calculateEstimate(lengthNum, widthNum, heightNum, selectedMaterials),
    [lengthNum, widthNum, heightNum, selectedMaterials]
  );

  const hasValidInput = lengthNum > 0 && widthNum > 0 && selectedMaterials.length > 0;
  const canSubmit = hasValidInput && !!orderData && inspectorId !== "" && userId !== null;

  async function handleSubmitEstimate() {
    if (!orderData || inspectorId === "" || !userId) return;

    setIsSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const details = `Square Footage: ${result.squareFootage}, Material Cost: ${formatCurrency(result.totalMaterialCost)}, Labor Cost: ${formatCurrency(result.laborCost)}, Total: ${formatCurrency(result.total)}`;

      const apiMaterials = result.materialBreakdown.map(mb => ({
        material_id: mb.inventoryItem.id,
        quantity: mb.quantityNeeded,
        cost: mb.cost
      }));

      const isEdit = Boolean(estimateId);
      const url = isEdit ? `/api/estimates/${estimateId}` : "/api/estimates";

      const payload = {
        order_id: orderData.order_id,
        inspector_id: inspectorId,
        admin_id: userId,
        details,
        estimate_date: new Date().toISOString().slice(0, 10),
        status: "submitted",
        materials: apiMaterials,
        // Sent explicitly so the customer-facing figure is the one the
        // calculator produced, rather than being re-derived server-side.
        total_amount: Number(result.total.toFixed(2)),
        // Persisted so this estimate can be reopened and edited later instead
        // of rebuilt from scratch. Pitch is optional.
        length_ft: lengthNum,
        width_ft: widthNum,
        pitch_ft: heightNum > 0 ? heightNum : null,
      };

      const saved = isEdit
        ? await api.put<{ status?: string }>(url, payload)
        : await api.post<{ status?: string }>(url, payload);

      // The server owns the final status: editing a settled estimate forces it
      // back to 'submitted' for re-approval, so report what actually landed
      // rather than assuming the update stuck as-is.
      const landedStatus = typeof saved?.status === "string" ? saved.status : null;
      const wasSettled = existingStatus === "approved" || existingStatus === "rejected";

      toast.success(
        !isEdit ? "Estimate submitted" : "Estimate updated",
        !isEdit
          ? "It is now in the admin review queue."
          : wasSettled && landedStatus === "submitted"
            ? "Because it had already been reviewed, it has been sent back for approval."
            : "Your changes have been saved.",
      );

      setSubmitted(true);
      setTimeout(() => {
        // Redirect logic remains, but we also showed an alert above.
        router.push("/admin/estimates");
      }, 2000);
    } catch (err) {
      const message = errorMessage(err, "Failed to submit the estimate.");
      setError(message);
      toast.error("Could not save the estimate", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!orderId) {
      return <SelectInspectionPage />;
  }

  if (loadingOrder || loadingInventory || loadingInspectors || loadingEstimate) {
    return (
      <div className="estimate-page">
        <SkeletonRows rows={4} height={90} />
      </div>
    );
  }

  return (
    <div className="estimate-page">
      {error ? <Banner title="There is a problem with this estimate" detail={error} /> : null}

      {/* An approved estimate is what the customer currently sees. Saving an
          edit pulls it back into the review queue, so say so up front rather
          than surprising the admin after the fact. */}
      {existingStatus === "approved" && (
        <div className="submit-banner" role="status">
          This estimate is already approved and visible to the customer. Saving
          changes will return it to the review queue for re-approval.
        </div>
      )}

      {existingStatus === "rejected" && (
        <div className="submit-banner" role="status">
          This estimate was rejected. Saving changes will resubmit it for review.
        </div>
      )}

      <AdminPageHeader
        eyebrow={estimateId ? "Editing" : "New estimate"}
        title={estimateId ? "Edit Cost Estimate" : "Cost Estimate"}
        subtitle="Pick materials, set the roof area, and the totals update as you go."
        actions={
          <button
            type="button"
            className="adm-hero-btn adm-hero-btn-ghost"
            onClick={() => router.push("/admin/cost-estimate")}
          >
            Change Order
          </button>
        }
      />

      {/* --- Inspector assignment --- */}
      <section className="info-card">
        <h2 className="section-title">Inspector</h2>
        <p className="section-subtitle">
          Since assignment is done here directly, pick which inspector this estimate is for.
        </p>

        {inspectors.length === 0 ? (
          <p className="section-subtitle" style={{ color: "var(--color-accent-text)" }}>
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

          <div className="calc-field" style={{ gridColumn: "1 / -1" }}>
            <label>Materials</label>
            <div className="flex gap-2 mb-4">
              <select
                className="flex-1 bg-bg text-ink"
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}
                value={materialToAdd}
                onChange={(e) => setMaterialToAdd(Number(e.target.value))}
              >
                <option value="">Select a material to add...</option>
                {inventory.filter(m => !selectedMaterialIds.includes(m.id)).map((m) => {
                  const pricePerSqft = (Number(m.unitCost) / (m.coverageSqft || 1.0));
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(Number(m.unitCost))}/{m.unit || 'sqft'} ≈ {formatCurrency(pricePerSqft)}/sqft) - In stock: {m.quantity}
                    </option>
                  );
                })}
              </select>
              <button 
                type="button" 
                className="btn-primary"
                style={{ whiteSpace: "nowrap" }}
                onClick={() => {
                  if (materialToAdd !== "") {
                    setSelectedMaterialIds([...selectedMaterialIds, materialToAdd as number]);
                    setMaterialToAdd("");
                  }
                }}
                disabled={materialToAdd === ""}
              >
                Add Material
              </button>
            </div>

            {selectedMaterials.length > 0 && (
              <div className="flex flex-col gap-2" style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px", backgroundColor: "var(--color-bg)" }}>
                {selectedMaterials.map(m => (
                  <div key={m.id} className="flex justify-between items-center" style={{ backgroundColor: "var(--color-surface)", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
                    <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>{m.name}</span>
                    <button 
                      type="button" 
                      className="text-danger-text hover:underline text-sm font-medium"
                      onClick={() => setSelectedMaterialIds(selectedMaterialIds.filter(id => id !== m.id))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedMaterials.length === 0 && (
              <p className="text-sm text-muted italic mt-2">No materials added yet. Please add at least one material to proceed.</p>
            )}
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
          {hasValidInput && result.materialBreakdown.map(mb => (
            <div className="result-row" key={mb.inventoryItem.id} style={{ fontSize: '0.9em', color: 'var(--color-muted)' }}>
              <span className="result-label">↳ {mb.inventoryItem.name} Required</span>
              <span className="result-value">
                {mb.quantityNeeded} {mb.inventoryItem.unit || 'units'} ({formatCurrency(mb.cost)})
              </span>
            </div>
          ))}
          <div className="result-row">
            <span className="result-label">Total Material Cost</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.totalMaterialCost) : "—"}
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
        <div className="submit-banner error">
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
          {isSubmitting ? "Submitting..." : (estimateId ? "Update Estimate" : "Submit Estimate")}
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
