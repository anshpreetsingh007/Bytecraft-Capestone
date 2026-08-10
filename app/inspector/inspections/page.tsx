"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../Context/AuthContext";
import "../styles/inspector.css";
import Link from "next/link";

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

function formatName(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

export default function InspectorInspectionsPage() {
  const { userId } = useAuth();
  const [requests, setRequests] = useState<InspectionRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const res = await fetch(`/api/inspection-requests/inspector/${userId}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setRequests(await res.json());
    } catch (err) {
      console.error("Failed to load inspection requests:", err);
      setError("Couldn't load your assigned inspections.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadRequests();
    }
  }, [userId, loadRequests]);

  return (
    <div className="inspector-content-wrapper">
      <h1>Assigned Inspections</h1>
      <p className="subtitle">
        Review customer inspections that have been assigned to you.
      </p>

      {loading ? (
        <p>Loading inspections…</p>
      ) : error ? (
        <p className="estimate-error">{error}</p>
      ) : requests.length === 0 ? (
        <p>You have no assigned inspections right now.</p>
      ) : (
        <div className="inspection-grid">
          {requests.map((request) => (
            <div className="inspection-card" key={request.request_id}>
              <h2>{formatName(request.client_first_name, request.client_last_name, "Unknown client")}</h2>
              <p>
                <strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{request.status.replace("_", " ")}</span>
              </p>
              {request.scheduled_date && (
                <p>
                  <strong>Scheduled:</strong> {new Date(request.scheduled_date).toLocaleDateString("en-CA")}
                </p>
              )}
              <div style={{ marginTop: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Details:</p>
                <p style={{ fontSize: "13px", color: "var(--color-muted)" }}>{request.details}</p>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <Link
                  href="/inspector/inspection"
                  className="inspection-button"
                >
                  Start Report
                </Link>
                {request.existing_order_id && (
                  <Link
                    href={`/inspector/cost-estimate?orderId=${request.existing_order_id}`}
                    className="inspection-button"
                    style={{ background: "var(--color-navy)" }}
                  >
                    Cost Estimate
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
