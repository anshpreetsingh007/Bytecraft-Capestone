"use client";

/**
 * The four states every data view needs: loading, empty, error, and a status
 * label. Each page used to hand-roll these, or skip them -- an empty table
 * looked identical to a failed request.
 */
import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Info, RefreshCw } from "lucide-react";
import "./ui.css";

/* --- Error / info banner -------------------------------------------------- */

export function Banner({
  variant = "error",
  title,
  detail,
  onRetry,
  retryLabel = "Try again",
}: {
  variant?: "error" | "warning" | "info" | "success";
  title: string;
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const Icon = variant === "info" || variant === "success" ? Info : AlertTriangle;

  return (
    <div className={`ui-banner ui-banner--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <Icon size={18} className="ui-banner__icon" aria-hidden="true" />
      <div className="ui-banner__body">
        <div className="ui-banner__title">{title}</div>
        {detail ? <div className="ui-banner__detail">{detail}</div> : null}
      </div>
      {onRetry ? (
        <button type="button" className="ui-banner__action" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/* --- Empty state ---------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__icon" aria-hidden="true">
        {icon ?? <Inbox size={22} />}
      </div>
      <div className="ui-empty__title">{title}</div>
      {message ? <p className="ui-empty__message">{message}</p> : null}
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </div>
  );
}

/* --- Skeletons ------------------------------------------------------------ */

export function Skeleton({ height = 16, width = "100%", radius = 8 }: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="ui-skeleton"
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** A stand-in for a list while it loads, so the layout does not jump. */
export function SkeletonRows({ rows = 4, height = 64 }: { rows?: number; height?: number }) {
  return (
    <div className="ui-skeleton-rows" role="status" aria-live="polite">
      <span className="ui-sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={height} radius={12} />
      ))}
    </div>
  );
}

/* --- Pagination ----------------------------------------------------------- */

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function Pagination({
  info,
  onPageChange,
  label = "results",
  busy = false,
}: {
  info: PageInfo;
  onPageChange: (page: number) => void;
  label?: string;
  busy?: boolean;
}) {
  // Nothing to page through, so showing controls would be noise.
  if (info.total <= info.limit && info.page === 1) return null;

  const first = info.total === 0 ? 0 : (info.page - 1) * info.limit + 1;
  const last = Math.min(info.page * info.limit, info.total);

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <span aria-live="polite">
        Showing {first}&ndash;{last} of {info.total} {label}
      </span>
      <div className="ui-pagination__controls">
        <button
          type="button"
          className="ui-pagination__button"
          onClick={() => onPageChange(info.page - 1)}
          disabled={busy || info.page <= 1}
        >
          Previous
        </button>
        <span className="ui-pagination__page">
          Page {info.page} of {info.totalPages}
        </span>
        <button
          type="button"
          className="ui-pagination__button"
          onClick={() => onPageChange(info.page + 1)}
          disabled={busy || !info.hasMore}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

/* --- Status pill ---------------------------------------------------------- */

type PillTone = "success" | "warning" | "danger" | "info" | "neutral";

/**
 * One place that decides what colour a status is, so 'approved' does not end
 * up green on one page and grey on another.
 */
const TONES: Record<string, PillTone> = {
  // Inspection requests
  pending: "warning",
  assigned: "info",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
  // Estimates
  draft: "neutral",
  submitted: "warning",
  approved: "success",
  rejected: "danger",
  // Customer response
  accepted: "success",
  declined: "danger",
  // Orders
  active: "info",
  estimated: "info",
  scheduled: "info",
  // Job reports
  reviewed: "success",
  // Inventory
  low: "danger",
  ok: "success",
};

export function statusTone(status: string | null | undefined): PillTone {
  if (!status) return "neutral";
  return TONES[status.toLowerCase().trim()] ?? "neutral";
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

export function StatusPill({ status, tone }: { status: string | null | undefined; tone?: PillTone }) {
  const resolved = tone ?? statusTone(status);
  return (
    <span className={`ui-pill ui-pill--${resolved}`}>
      <span className="ui-pill__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

/* --- Refresh button ------------------------------------------------------- */

export function RefreshButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return (
    <button type="button" className="ui-button ui-button--secondary" onClick={onClick} disabled={busy}>
      <RefreshCw size={15} aria-hidden="true" style={busy ? { animation: "spin 1s linear infinite" } : undefined} />
      {busy ? "Refreshing" : "Refresh"}
    </button>
  );
}
