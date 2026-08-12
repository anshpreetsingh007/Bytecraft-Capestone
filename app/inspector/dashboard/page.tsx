"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

import "../styles/inspector.css";
import { useAuth } from "../../../Context/AuthContext";

/* ------------------------------------------------------------------ *
 * Types — mirror the API payloads exactly.
 * InspectionRequestWithDetails: submission-service model.ts
 * CostEstimateWithNames:        estimate-service model.ts
 * ------------------------------------------------------------------ */

interface InspectionRequest {
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

interface CostEstimate {
  estimate_id: number;
  order_id: number;
  inspector_id: number;
  details: string;
  estimate_date: string;
  status: string;
  client_first_name: string | null;
  client_last_name: string | null;
}

/* ------------------------------------------------------------------ *
 * Status model
 *
 * The DB column is a free-form VARCHAR(30), so treat anything unexpected
 * as a passive state rather than assuming the set is closed.
 * Inspector-owned transitions are only ever forward:
 *   assigned -> in_progress -> completed
 * 'pending' can appear if an admin assigned the inspector without moving
 * the status on, so it's treated as startable too.
 * ------------------------------------------------------------------ */

type NextAction = { label: string; nextStatus: string; icon: typeof PlayCircle };

const NEXT_ACTION: Record<string, NextAction> = {
  pending: { label: "Start", nextStatus: "in_progress", icon: PlayCircle },
  assigned: { label: "Start", nextStatus: "in_progress", icon: PlayCircle },
  in_progress: { label: "Mark complete", nextStatus: "completed", icon: CheckCircle2 },
};

const STATUS_PILL: Record<string, string> = {
  pending: "pill-warning",
  assigned: "pill-info",
  in_progress: "pill-info",
  completed: "pill-success",
  cancelled: "pill-neutral",
};

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function formatName(first: string | null, last: string | null, fallback: string): string {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || fallback;
}

/* Dates arrive as 'YYYY-MM-DD' (pg DATE) or a full ISO timestamp. Parsing
   'YYYY-MM-DD' with `new Date()` treats it as UTC midnight, which renders as
   the previous day for anyone west of UTC. Split the plain form manually so a
   job scheduled for the 3rd never displays as the 2nd. */
function parseApiDate(value: string): Date | null {
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) {
    return new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(value: string): string {
  const date = parseApiDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* Relative day label for the schedule column. Returns null when the date is
   far enough out that the absolute date is more useful on its own. */
function relativeDay(value: string): string | null {
  const date = parseApiDate(value);
  if (!date) return null;
  const days = Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days <= 7) return `In ${days} days`;
  return null;
}

/* The estimate `details` column is written by the cost-estimate page as:
   "Square Footage: N, Material Cost: $X, Labor Cost: $Y, Total: $Z"
   Pull the total back out for display. Deliberately tolerant — if the format
   ever changes this returns null and the UI simply omits the figure rather
   than rendering "$NaN". */
function extractTotal(details: string): string | null {
  const match = /Total:\s*(\$[\d,]+(?:\.\d{2})?)/i.exec(details ?? "");
  return match ? match[1] : null;
}

/* ------------------------------------------------------------------ */

export default function InspectorDashboard() {
  const { firstName, userId } = useAuth();

  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [estimates, setEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // request_id currently being PATCHed — drives the per-row spinner and
  // guards against double submits.
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Guards against a slow earlier fetch resolving after a newer one and
  // overwriting fresh state.
  const requestSeq = useRef(0);

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) return;

      const seq = ++requestSeq.current;
      setLoadError(null);

      // Settled, not all: a failing estimates widget shouldn't blank out the
      // inspection list, which is the part the inspector actually works from.
      const [requestsResult, estimatesResult] = await Promise.allSettled([
        fetch(`/api/inspection-requests/inspector/${userId}`, { signal }),
        fetch(`/api/estimates/inspector/${userId}?limit=5`, { signal }),
      ]);

      if (signal?.aborted || seq !== requestSeq.current) return;

      try {
        if (requestsResult.status === "rejected") throw requestsResult.reason;
        if (!requestsResult.value.ok) {
          throw new Error(`Server returned ${requestsResult.value.status}`);
        }
        const data: unknown = await requestsResult.value.json();
        if (seq !== requestSeq.current) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load assigned inspections:", err);
        setLoadError("Couldn't load your assigned inspections.");
      }

      // Estimates are supplementary — on failure show an empty widget rather
      // than failing the whole page.
      try {
        if (estimatesResult.status === "fulfilled" && estimatesResult.value.ok) {
          const data: unknown = await estimatesResult.value.json();
          if (seq !== requestSeq.current) return;
          setEstimates(Array.isArray(data) ? data : []);
        } else {
          setEstimates([]);
        }
      } catch {
        setEstimates([]);
      }

      if (seq === requestSeq.current) setLoading(false);
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [userId, loadData]);

  /* Optimistic status change. Repaint immediately, roll the row back to its
     previous value if the PATCH fails. */
  async function changeStatus(request: InspectionRequest, nextStatus: string) {
    if (pendingId !== null) return;

    const previousStatus = request.status;
    setPendingId(request.request_id);
    setActionError(null);

    setRequests((current) =>
      current.map((r) =>
        r.request_id === request.request_id ? { ...r, status: nextStatus } : r
      )
    );

    try {
      const res = await fetch(`/api/inspection-requests/${request.request_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      // Trust the server's echo over the optimistic guess.
      const updated: Partial<InspectionRequest> = await res.json();
      if (updated && typeof updated.status === "string") {
        setRequests((current) =>
          current.map((r) =>
            r.request_id === request.request_id ? { ...r, status: updated.status as string } : r
          )
        );
      }

      setAnnouncement(
        `${formatName(request.client_first_name, request.client_last_name, "Inspection")} marked ${statusLabel(nextStatus).toLowerCase()}.`
      );
    } catch (err) {
      console.error("Failed to update inspection status:", err);
      setRequests((current) =>
        current.map((r) =>
          r.request_id === request.request_id ? { ...r, status: previousStatus } : r
        )
      );
      setActionError("Couldn't update that inspection. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  /* Derived counts and ordering. Active work first, then by soonest
     scheduled date; undated rows sink to the bottom of their group. */
  const { active, counts } = useMemo(() => {
    const isDone = (s: string) => s === "completed" || s === "cancelled";

    // An unparseable date is treated the same as no date: sorted to the
    // bottom rather than poisoning the comparator with NaN.
    const scheduledTime = (r: InspectionRequest): number | null => {
      if (!r.scheduled_date) return null;
      const parsed = parseApiDate(r.scheduled_date);
      return parsed ? parsed.getTime() : null;
    };

    const activeRequests = requests
      .filter((r) => !isDone(r.status))
      .sort((a, b) => {
        const aTime = scheduledTime(a);
        const bTime = scheduledTime(b);
        if (aTime === null && bTime === null) return b.request_id - a.request_id;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return aTime - bTime;
      });

    return {
      active: activeRequests,
      counts: {
        active: activeRequests.length,
        inProgress: requests.filter((r) => r.status === "in_progress").length,
        completed: requests.filter((r) => r.status === "completed").length,
      },
    };
  }, [requests]);

  const greetingName = firstName?.trim() || "Inspector";

  return (
    <section className="dashboard-content">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {greetingName}</h1>
          <p className="dashboard-subtitle">
            Here&apos;s a quick overview of your assigned inspections
          </p>
        </div>

        <button
          type="button"
          className="dash-refresh"
          onClick={() => loadData()}
          disabled={loading || pendingId !== null}
        >
          <RefreshCw size={16} aria-hidden="true" className={loading ? "spin" : undefined} />
          Refresh
        </button>
      </header>

      {/* Screen-reader announcements for optimistic status changes. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {actionError && (
        <div className="dash-banner dash-banner-error" role="alert">
          {actionError}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : loadError ? (
        <div className="dash-banner dash-banner-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="dash-banner-action" onClick={() => loadData()}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="dash-stats">
            <StatCard
              icon={<ClipboardList size={18} aria-hidden="true" />}
              label="Open inspections"
              value={counts.active}
              tone="navy"
            />
            <StatCard
              icon={<PlayCircle size={18} aria-hidden="true" />}
              label="In progress"
              value={counts.inProgress}
              tone="accent"
            />
            <StatCard
              icon={<CheckCircle2 size={18} aria-hidden="true" />}
              label="Completed"
              value={counts.completed}
              tone="navy"
            />
          </div>

          <div className="dash-panel">
            <div className="dash-panel-head">
              <h2>Your open inspections</h2>
              <Link href="/inspector/inspections" className="dash-panel-link">
                View all
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {active.length === 0 ? (
              <p className="dash-empty">
                {requests.length === 0
                  ? "No inspections are assigned to you yet. They'll appear here once an admin assigns one."
                  : "You're all caught up — no open inspections right now."}
              </p>
            ) : (
              <ul className="dash-list">
                {active.map((request) => {
                  const action = NEXT_ACTION[request.status];
                  const ActionIcon = action?.icon;
                  const isPending = pendingId === request.request_id;
                  const relative = request.scheduled_date
                    ? relativeDay(request.scheduled_date)
                    : null;
                  const isOverdue = relative?.includes("overdue") ?? false;

                  return (
                    <li className="dash-row" key={request.request_id}>
                      <div className="dash-row-main">
                        <div className="dash-row-title">
                          <span className="dash-row-name">
                            {formatName(
                              request.client_first_name,
                              request.client_last_name,
                              "Unknown client"
                            )}
                          </span>
                          <span
                            className={`dash-pill ${STATUS_PILL[request.status] ?? "pill-neutral"}`}
                          >
                            {statusLabel(request.status)}
                          </span>
                        </div>

                        <p className="dash-row-meta">
                          <CalendarClock size={13} aria-hidden="true" />
                          {request.scheduled_date ? (
                            <>
                              {formatDate(request.scheduled_date)}
                              {relative && (
                                <span className={isOverdue ? "dash-overdue" : "dash-relative"}>
                                  {relative}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="dash-relative">Not yet scheduled</span>
                          )}
                        </p>

                        {request.details && (
                          <p className="dash-row-details">{request.details}</p>
                        )}
                      </div>

                      <div className="dash-row-actions">
                        {request.existing_order_id && (
                          <Link
                            href={`/inspector/cost-estimate?orderId=${request.existing_order_id}`}
                            className="dash-btn dash-btn-ghost"
                          >
                            <Calculator size={15} aria-hidden="true" />
                            Estimate
                          </Link>
                        )}

                        {action && (
                          <button
                            type="button"
                            className="dash-btn dash-btn-primary"
                            onClick={() => changeStatus(request, action.nextStatus)}
                            disabled={pendingId !== null}
                            aria-busy={isPending}
                          >
                            {ActionIcon && <ActionIcon size={15} aria-hidden="true" />}
                            {isPending ? "Saving…" : action.label}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="dash-panel">
            <div className="dash-panel-head">
              <h2>Your recent estimates</h2>
              <Link href="/inspector/cost-estimate" className="dash-panel-link">
                New estimate
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {estimates.length === 0 ? (
              <p className="dash-empty">
                You haven&apos;t submitted any cost estimates yet.
              </p>
            ) : (
              <ul className="dash-list">
                {estimates.map((estimate) => {
                  const total = extractTotal(estimate.details);
                  return (
                    <li className="dash-row" key={estimate.estimate_id}>
                      <div className="dash-row-main">
                        <div className="dash-row-title">
                          <span className="dash-row-name">
                            {formatName(
                              estimate.client_first_name,
                              estimate.client_last_name,
                              `Order #${estimate.order_id}`
                            )}
                          </span>
                          <span
                            className={`dash-pill ${
                              STATUS_PILL[estimate.status] ??
                              (estimate.status === "approved"
                                ? "pill-success"
                                : estimate.status === "rejected"
                                  ? "pill-danger"
                                  : estimate.status === "submitted"
                                    ? "pill-warning"
                                    : "pill-neutral")
                            }`}
                          >
                            {statusLabel(estimate.status)}
                          </span>
                        </div>
                        <p className="dash-row-meta">
                          {formatDate(estimate.estimate_date)}
                          {total && <span className="dash-total">{total}</span>}
                        </p>
                      </div>

                      <div className="dash-row-actions">
                        <Link
                          href={`/inspector/cost-estimate?orderId=${estimate.order_id}&estimateId=${estimate.estimate_id}`}
                          className="dash-btn dash-btn-ghost"
                        >
                          Open
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "navy" | "accent";
}) {
  return (
    <div className="dash-stat">
      <span className={`dash-stat-icon dash-stat-icon-${tone}`}>{icon}</span>
      <div>
        <p className="dash-stat-label">{label}</p>
        <p className="dash-stat-value">{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="dash-stats">
        {[0, 1, 2].map((i) => (
          <div className="dash-stat" key={i}>
            <span className="dash-skeleton dash-skeleton-icon" />
            <div style={{ flex: 1 }}>
              <span className="dash-skeleton dash-skeleton-line short" />
              <span className="dash-skeleton dash-skeleton-line tiny" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <span className="dash-skeleton dash-skeleton-line heading" />
        </div>
        <ul className="dash-list">
          {[0, 1, 2].map((i) => (
            <li className="dash-row" key={i}>
              <div className="dash-row-main">
                <span className="dash-skeleton dash-skeleton-line medium" />
                <span className="dash-skeleton dash-skeleton-line short" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
