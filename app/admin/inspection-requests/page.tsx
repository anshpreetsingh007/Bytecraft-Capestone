"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
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

interface Inspector {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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
  
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<Record<number, string>>({});
  const [assigningId, setAssigningId] = useState<number | null>(null);

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
    
    // Fetch inspectors once on mount
    fetch("/api/auth/inspectors")
      .then(res => res.json())
      .then(data => setInspectors(data))
      .catch(err => console.error("Failed to load inspectors:", err));
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

  async function handleAssignInspector(request: InspectionRequestWithDetails) {
    const inspectorIdStr = selectedInspectorId[request.request_id];
    if (!inspectorIdStr) {
      alert("Please select an inspector first.");
      return;
    }
    const inspectorId = parseInt(inspectorIdStr, 10);
    const selectedInsp = inspectors.find(i => i.id === inspectorId);
    const inspName = selectedInsp ? `${selectedInsp.firstName} ${selectedInsp.lastName}` : `Inspector #${inspectorId}`;
    const isReassign = !!request.inspector_id;

    const confirmed = window.confirm(
      isReassign
        ? `Reassign this request to ${inspName}? The previous inspector will be removed.`
        : `Assign ${inspName} to this inspection request?`
    );
    if (!confirmed) return;

    setAssigningId(request.request_id);
    try {
      const res = await fetch(`/api/inspection-requests/${request.request_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          inspector_id: inspectorId,
          status: "assigned"
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      
      alert(isReassign ? "Inspector reassigned successfully!" : "Inspector assigned successfully!");
      loadRequests(filter);
    } catch (err) {
      console.error("Failed to assign inspector:", err);
      alert("Something went wrong assigning the inspector.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <main className="requests-page">
      <AdminPageHeader
        eyebrow="Intake"
        title="Inspection Requests"
        subtitle="Review submitted requests, assign an inspector, and convert them into orders so estimates can be created."
        chips={[
          { label: "In view", value: loading ? "—" : requests.length },
          { label: "Inspectors", value: inspectors.length },
        ]}
      />

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
                  
                  {request.status !== "completed" && request.status !== "cancelled" && (
                    <div className="assign-group">
                      <select 
                        className="assign-select"
                        value={selectedInspectorId[request.request_id] || ""}
                        onChange={e => setSelectedInspectorId(prev => ({ ...prev, [request.request_id]: e.target.value }))}
                      >
                        <option value="" disabled>{request.inspector_id ? "Change Inspector" : "Select Inspector"}</option>
                        {inspectors.map(insp => (
                          <option key={insp.id} value={insp.id}>
                            {insp.firstName} {insp.lastName}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="btn-assign"
                        disabled={assigningId === request.request_id || !selectedInspectorId[request.request_id]}
                        onClick={() => handleAssignInspector(request)}
                      >
                        {assigningId === request.request_id ? "Assigning…" : request.inspector_id ? "Reassign" : "Assign"}
                      </button>
                    </div>
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
