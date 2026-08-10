"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import "./estimates.css";
import { EstimateWithNames, EstimateStatus } from "../types/estimate";

// TODO: move to NEXT_PUBLIC_ESTIMATE_SERVICE_URL once the rest of the
// frontend adopts env-based service URLs (currently other pages hardcode
// localhost too).
const ESTIMATE_SERVICE_URL = "";

const FILTERS: { label: string; value: EstimateStatus | "all" }[] = [
  { label: "Needs Review", value: "submitted" },
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft", value: "draft" },
];

// The creation form embeds "Total: $X.XX" as text inside `details`
// (there's no dollar-amount column on cost_estimate). Pull it back out
// for display; fall back gracefully if it's not there.
function extractTotal(details: string): string | null {
  const match = details.match(/Total:\s*(\$[\d,]+\.?\d*)/i);
  return match ? match[1] : null;
}

function formatName(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<EstimateWithNames[]>([]);
  const [filter, setFilter] = useState<EstimateStatus | "all">("submitted");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadEstimates = useCallback(async (selectedFilter: EstimateStatus | "all") => {
    setError(null);
    try {
      const url =
        selectedFilter === "all"
          ? `${ESTIMATE_SERVICE_URL}/api/estimates`
          : `${ESTIMATE_SERVICE_URL}/api/estimates?status=${selectedFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setEstimates(await res.json());
    } catch (err) {
      console.error("Failed to load estimates:", err);
      setError("Couldn't load estimates. Is estimate-service running on port 3002?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadEstimates(filter);
  }, [filter, loadEstimates]);

  async function handleStatusChange(estimate: EstimateWithNames, newStatus: "approved" | "rejected") {
    const customerName = formatName(estimate.client_first_name, estimate.client_last_name, "this customer");
    const confirmed = window.confirm(
      newStatus === "approved"
        ? `Approve this estimate for ${customerName}? They'll be notified it's ready to view.`
        : `Reject this estimate for ${customerName}?`
    );
    if (!confirmed) return;

    setActioningId(estimate.estimate_id);
    try {
      const res = await fetch(`${ESTIMATE_SERVICE_URL}/api/estimates/${estimate.estimate_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      // Remove it from the current list if it no longer matches the active filter
      // (e.g. approving an item while viewing "Needs Review"), otherwise update it in place.
      setEstimates((prev) =>
        filter !== "all" && filter !== newStatus
          ? prev.filter((e) => e.estimate_id !== estimate.estimate_id)
          : prev.map((e) => (e.estimate_id === estimate.estimate_id ? { ...e, status: newStatus } : e))
      );
      alert(newStatus === "approved" ? "Estimate approved successfully!" : "Estimate rejected successfully!");
    } catch (err) {
      console.error(`Failed to ${newStatus === "approved" ? "approve" : "reject"} estimate:`, err);
      alert("Something went wrong updating this estimate. Please try again.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <main className="estimates-page">
      <h1>Estimates</h1>
      <p className="estimates-subtitle">Review inspection estimates and approve or reject them.</p>

      <div className="estimate-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? "active" : ""}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="estimates-status">Loading estimates…</p>
      ) : error ? (
        <p className="estimates-status error">{error}</p>
      ) : estimates.length === 0 ? (
        <p className="estimates-empty">No estimates here right now.</p>
      ) : (
        <div className="estimate-list">
          {estimates.map((estimate) => {
            const total = extractTotal(estimate.details);
            const isActioning = actioningId === estimate.estimate_id;

            return (
              <div className="estimate-card" key={estimate.estimate_id}>
                <div className="estimate-card-header">
                  <h2>{formatName(estimate.client_first_name, estimate.client_last_name, "Unknown client")}</h2>
                  <span className={`pill pill-${estimate.status}`}>{estimate.status}</span>
                </div>

                <p className="muted">
                  Inspector: {formatName(estimate.inspector_first_name, estimate.inspector_last_name, "Unassigned")}
                </p>
                <p className="muted">
                  Date: {new Date(estimate.estimate_date).toLocaleDateString("en-CA")}
                </p>

                {total && <p className="estimate-total">{total}</p>}

                <p className="estimate-details">{estimate.details}</p>

                <div className="estimate-actions">
                  {estimate.status === "submitted" && (
                    <>
                      <button
                        className="btn-approve"
                        disabled={isActioning}
                        onClick={() => handleStatusChange(estimate, "approved")}
                      >
                        {isActioning ? "Working…" : "Approve"}
                      </button>
                      <button
                        className="btn-reject"
                        disabled={isActioning}
                        onClick={() => handleStatusChange(estimate, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(estimate.status === "submitted" || estimate.status === "approved") && (
                    <Link
                      href={`/admin/cost-estimate?orderId=${estimate.order_id}&estimateId=${estimate.estimate_id}`}
                      className="btn-secondary"
                      style={{ textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-ink)', display: 'inline-block' }}
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
