"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import "./estimates.css";
import { EstimateWithNames, EstimateStatus } from "../types/estimate";
import { api, errorMessage, pageInfo, query, rows } from "@/lib/api";
import {
  Banner,
  ConfirmDialog,
  EmptyState,
  Pagination,
  SkeletonRows,
  useToast,
  type PageInfo,
} from "../../../components/ui";

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

interface PendingDecision {
  estimate: EstimateWithNames;
  status: "approved" | "rejected";
}

export default function EstimatesPage() {
  const toast = useToast();
  const [estimates, setEstimates] = useState<EstimateWithNames[]>([]);
  const [filter, setFilter] = useState<EstimateStatus | "all">("submitted");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const loadEstimates = useCallback(
    async (selectedFilter: EstimateStatus | "all", requestedPage: number) => {
      setError(null);
      try {
        const payload = await api.get<EstimateWithNames[]>(
          `/api/estimates${query({
            status: selectedFilter === "all" ? null : selectedFilter,
            page: requestedPage,
            limit: 25,
          })}`,
        );
        setEstimates(rows(payload));
        setPagination(pageInfo(payload));
      } catch (err) {
        setError(errorMessage(err, "Could not load estimates."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    loadEstimates(filter, page);
  }, [filter, page, loadEstimates]);

  // Changing the filter should always land on the first page of the new list.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  function handleStatusChange(estimate: EstimateWithNames, newStatus: "approved" | "rejected") {
    // window.confirm/alert replaced with a real dialog and toasts: they could
    // not explain the consequence, and alert() blocks the whole tab.
    setPendingDecision({ estimate, status: newStatus });
  }

  async function confirmDecision() {
    if (!pendingDecision) return;
    const { estimate, status: newStatus } = pendingDecision;

    setActioningId(estimate.estimate_id);
    try {
      await api.patch(`/api/estimates/${estimate.estimate_id}/status`, { status: newStatus });

      // Drop it from the list when it no longer matches the active filter
      // (approving while viewing "Needs Review"), otherwise update in place.
      setEstimates((prev) =>
        filter !== "all" && filter !== newStatus
          ? prev.filter((entry) => entry.estimate_id !== estimate.estimate_id)
          : prev.map((entry) =>
              entry.estimate_id === estimate.estimate_id ? { ...entry, status: newStatus } : entry,
            ),
      );

      toast.success(
        newStatus === "approved" ? "Estimate approved" : "Estimate rejected",
        newStatus === "approved"
          ? "The customer has been notified and the materials have been drawn from stock."
          : "The inspector has been notified so they can revise it.",
      );
      setPendingDecision(null);
    } catch (err) {
      toast.error("Could not update the estimate", errorMessage(err));
    } finally {
      setActioningId(null);
    }
  }

  const decisionCustomer = pendingDecision
    ? formatName(
        pendingDecision.estimate.client_first_name,
        pendingDecision.estimate.client_last_name,
        "this customer",
      )
    : "";

  return (
    <main className="estimates-page">
      <AdminPageHeader
        eyebrow="Review queue"
        title="Estimates"
        subtitle="Review the estimates inspectors have submitted, then approve or reject them."
        chips={[{ label: "In view", value: loading ? "—" : estimates.length }]}
      />

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
        <SkeletonRows rows={3} height={132} />
      ) : error ? (
        <Banner
          title="Could not load estimates"
          detail={error}
          onRetry={() => loadEstimates(filter, page)}
        />
      ) : estimates.length === 0 ? (
        <EmptyState
          title={filter === "submitted" ? "Nothing waiting for review" : "No estimates here"}
          message={
            filter === "submitted"
              ? "When an inspector submits an estimate it will appear here for approval."
              : "Try a different filter, or create an estimate from an order."
          }
          action={
            <Link className="ui-button ui-button--primary" href="/admin/cost-estimate/select">
              Create an estimate
            </Link>
          }
        />
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

      {pagination && !loading && !error ? (
        <Pagination info={pagination} onPageChange={setPage} label="estimates" busy={loading} />
      ) : null}

      <ConfirmDialog
        open={pendingDecision !== null}
        onCancel={() => setPendingDecision(null)}
        onConfirm={confirmDecision}
        busy={actioningId !== null}
        destructive={pendingDecision?.status === "rejected"}
        title={pendingDecision?.status === "approved" ? "Approve this estimate?" : "Reject this estimate?"}
        description={
          pendingDecision?.status === "approved"
            ? `${decisionCustomer} will be notified that the estimate is ready to review, and the materials it was priced with will be drawn from stock.`
            : `${decisionCustomer} will not see this estimate, and the inspector who wrote it will be asked to revise it.`
        }
        confirmLabel={pendingDecision?.status === "approved" ? "Approve" : "Reject"}
      />
    </main>
  );
}
