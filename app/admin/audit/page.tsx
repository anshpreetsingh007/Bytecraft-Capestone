"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { api, errorMessage, pageInfo, query, rows } from "@/lib/api";
import {
  Banner,
  EmptyState,
  Pagination,
  SkeletonRows,
  type PageInfo,
} from "../../../components/ui";
import "../admin-shared.css";
import "./audit.css";

interface AuditEntry {
  audit_id: string;
  actor_uid: string | null;
  actor_role: string | null;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  request_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const ENTITY_FILTERS = [
  { label: "Everything", value: "" },
  { label: "Accounts", value: "user" },
  { label: "Inspections", value: "inspection_request" },
  { label: "Estimates", value: "cost_estimate" },
  { label: "Inventory", value: "item" },
  { label: "Job reports", value: "report" },
];

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedEntity: string, requestedPage: number) => {
    setError(null);
    try {
      const payload = await api.get<AuditEntry[]>(
        `/api/auth/audit${query({ entityType: selectedEntity || null, page: requestedPage, limit: 50 })}`,
      );
      setEntries(rows(payload));
      setPagination(pageInfo(payload));
    } catch (err) {
      setError(errorMessage(err, "Could not load the audit log."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(entityType, page);
  }, [entityType, page, load]);

  useEffect(() => {
    setPage(1);
  }, [entityType]);

  return (
    <main className="audit-page">
      <AdminPageHeader
        eyebrow="Accountability"
        title="Audit Log"
        subtitle="Who changed what, and when. Role changes, approvals, stock adjustments and deletions all land here."
        chips={[{ label: "Entries", value: loading ? "—" : (pagination?.total ?? entries.length) }]}
      />

      <div className="request-filters">
        {ENTITY_FILTERS.map((entry) => (
          <button
            key={entry.value || "all"}
            className={entityType === entry.value ? "active" : ""}
            onClick={() => setEntityType(entry.value)}
            aria-pressed={entityType === entry.value}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows rows={6} height={48} />
      ) : error ? (
        <Banner title="Could not load the audit log" detail={error} onRetry={() => load(entityType, page)} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={22} />}
          title="Nothing recorded yet"
          message="Once people start approving estimates, changing roles or adjusting stock, every one of those actions will be listed here."
        />
      ) : (
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Subject</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.audit_id}>
                  <td className="audit-when">
                    {new Date(entry.created_at).toLocaleString("en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <span className="audit-role">{entry.actor_role ?? "system"}</span>
                    {entry.actor_id ? <span className="audit-id"> #{entry.actor_id}</span> : null}
                  </td>
                  <td>
                    <code className="audit-action">{entry.action}</code>
                  </td>
                  <td>
                    {entry.entity_type}
                    {entry.entity_id ? ` #${entry.entity_id}` : ""}
                  </td>
                  <td className="audit-summary">{entry.summary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && !loading && !error ? (
        <Pagination info={pagination} onPageChange={setPage} label="entries" busy={loading} />
      ) : null}
    </main>
  );
}
