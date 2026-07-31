"use client";

import { useCallback, useEffect, useState } from "react";
import "./inspection-requests.css";

interface InspectionRequestWithDetails {
  request_id: number;
  client_id: number;
  inspector_id: number | null;
  status: string;
  details: string;
  scheduled_date: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
  existing_order_id: number | null;
}

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function formatName(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

export default function InspectionRequestsPage() {
  const [requests, setRequests] = useState<InspectionRequestWithDetails[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const loadRequests = useCallback(async (selectedFilter: string) => {
    setError(null);
    try {
      const url =
        selectedFilter === "all"
          ? "/api/inspection-requests"
          : `/api/inspection-requests?status=${selectedFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setRequests(await res.json());
    } catch (err) {
      console.error("Failed to load inspection requests:", err);
      setError("Couldn't load inspection requests. Is submission-service running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadRequests(filter);
  }, [filter, loadRequests]);

  async function handleConvertToOrder(request: InspectionRequestWithDetails) {
    const customerName = formatName(request.client_first_name, request.client_last_name, "this client");
    const confirmed = window.confirm(
      `Convert this request from ${customerName} into an order? This unlocks creating a cost estimate for it.`
    );
    if (!confirmed) return;

    setConvertingId(request.request_id);
    try {
      const res = await fetch(`/api/orders/from-request/${request.request_id}`, { method: "POST" });

      if (res.status === 409) {
        alert("This request was already converted to an order.");
        loadRequests(filter);
        return;
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const order = await res.json();
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === request.request_id ? { ...r, existing_order_id: order.order_id } : r
        )
      );
    } catch (err) {
      console.error("Failed to convert request to order:", err);
      alert("Something went wrong converting this request. Please try again.");
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <main className="requests-page">
      <h1>Inspection Requests</h1>
      <p className="requests-subtitle">
        Review submitted requests and convert them into orders so estimates can be created.
      </p>

      <div className="request-filters">
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
        <p className="requests-status">Loading requests…</p>
      ) : error ? (
        <p className="requests-status error">{error}</p>
      ) : requests.length === 0 ? (
        <p className="requests-empty">No inspection requests here right now.</p>
      ) : (
        <div className="request-list">
          {requests.map((request) => {
            const isConverting = convertingId === request.request_id;

            return (
              <div className="request-card" key={request.request_id}>
                <div className="request-card-header">
                  <h2>{formatName(request.client_first_name, request.client_last_name, "Unknown client")}</h2>
                  <span className={`pill pill-${request.status}`}>{request.status.replace("_", " ")}</span>
                </div>

                <p className="muted">
                  Inspector: {formatName(request.inspector_first_name, request.inspector_last_name, "Unassigned")}
                </p>
                {request.scheduled_date && (
                  <p className="muted">
                    Scheduled: {new Date(request.scheduled_date).toLocaleDateString("en-CA")}
                  </p>
                )}

                <p className="request-details">{request.details}</p>

                <div className="request-actions">
                  {request.existing_order_id ? (
                    <span className="pill pill-converted">Order #{request.existing_order_id}</span>
                  ) : (
                    <button
                      className="btn-convert"
                      disabled={isConverting}
                      onClick={() => handleConvertToOrder(request)}
                    >
                      {isConverting ? "Converting…" : "Convert to Order"}
                    </button>
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
