"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Calculator,
  ClipboardList,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
} from "lucide-react";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { api, errorMessage, rows } from "@/lib/api";
import { Banner } from "../../components/ui";

/** Maps an estimate status onto a pill class + icon so the list scans at a glance. */
function statusMeta(status: string) {
  const key = (status || "").toLowerCase();
  if (key === "approved") return { cls: "pill-approved", Icon: CheckCircle2 };
  if (key === "rejected") return { cls: "pill-rejected", Icon: XCircle };
  if (key === "submitted") return { cls: "pill-submitted", Icon: Clock3 };
  return { cls: "pill-draft", Icon: FileText };
}

function fullName(first?: string | null, last?: string | null) {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || "Unnamed client";
}

export default function AdminHomePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentEstimates, setRecentEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Only the first few estimates are shown, so ask for that many rather
      // than pulling the whole table and slicing it in the browser.
      const [inventoryPayload, estimatePayload] = await Promise.all([
        api.get<any[]>("/api/inventory?limit=100"),
        api.get<any[]>("/api/estimates?limit=4"),
      ]);

      setInventory(rows(inventoryPayload));
      setRecentEstimates(rows(estimatePayload));
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load the dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = inventory.filter((item) => {
    return item.quantity <= (item.reorderThreshold || 0);
  }).length;

  // Share of tracked items that are comfortably in stock. Derived from data
  // already on the page — no extra request.
  const healthyPct =
    inventory.length > 0
      ? Math.round(((inventory.length - lowStockCount) / inventory.length) * 100)
      : 0;

  const dash = "—";

  return (
    <div className="dashboard-page">
      {loadError ? (
        <Banner title="Could not load the dashboard" detail={loadError} onRetry={fetchData} />
      ) : null}

      <AdminPageHeader
        eyebrow="Live overview"
        title="Admin Dashboard"
        subtitle="Stock levels, open estimates and everything waiting on you — at a glance."
        chips={[
          {
            label: "Stock health",
            value: loading ? dash : `${healthyPct}%`,
          },
          {
            label: "Estimates",
            value: loading ? dash : recentEstimates.length,
          },
        ]}
      />

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="adm-stat-grid">
        <article className="adm-stat">
          <Package size={104} className="adm-stat-ghost" aria-hidden="true" />
          <div className="adm-stat-row">
            <div className="adm-icon">
              <Package size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="adm-stat-label">Total Stock</p>
              <p className="adm-stat-value">{loading ? dash : totalItems.toLocaleString()}</p>
            </div>
          </div>
          <p className="adm-stat-foot">
            <ArrowUpRight size={14} aria-hidden="true" />
            Units across {loading ? dash : inventory.length} tracked items
          </p>
        </article>

        <article className={`adm-stat ${lowStockCount > 0 ? "adm-stat-accent" : ""}`}>
          <AlertTriangle size={104} className="adm-stat-ghost" aria-hidden="true" />
          <div className="adm-stat-row">
            <div className={`adm-icon ${lowStockCount > 0 ? "adm-icon-accent" : ""}`}>
              <AlertTriangle size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="adm-stat-label">Low / Out of Stock</p>
              <p className="adm-stat-value">{loading ? dash : lowStockCount}</p>
            </div>
          </div>
          <p className="adm-stat-foot">
            {lowStockCount > 0 ? "Items at or below reorder threshold" : "Everything above its reorder point"}
          </p>
        </article>

        <article className="adm-stat">
          <ClipboardList size={104} className="adm-stat-ghost" aria-hidden="true" />
          <div className="adm-stat-row">
            <div className="adm-icon">
              <ClipboardList size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="adm-stat-label">Items Tracked</p>
              <p className="adm-stat-value">{loading ? dash : inventory.length}</p>
            </div>
          </div>
          <div
            className="adm-meter"
            role="img"
            aria-label={`${healthyPct}% of tracked items are in stock`}
          >
            <div
              className={`adm-meter-fill ${lowStockCount === 0 ? "adm-meter-fill-ok" : ""}`}
              style={{ width: `${loading ? 0 : healthyPct}%` }}
            />
          </div>
        </article>
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="adm-section-head">
        <h2>Quick Actions</h2>
        <hr className="adm-section-line" />
      </div>

      <div className="adm-action-grid">
        <Link href="/admin/inventory" className="adm-action">
          <div className="adm-icon">
            <Package size={21} aria-hidden="true" />
          </div>
          <div className="adm-action-body">
            <p className="adm-action-title">Inventory</p>
            <p className="adm-action-sub">View, add and edit stock</p>
          </div>
          <ArrowRight size={18} className="adm-action-arrow" aria-hidden="true" />
        </Link>

        <Link href="/admin/cost-estimate/select" className="adm-action">
          <div className="adm-icon adm-icon-accent">
            <Calculator size={21} aria-hidden="true" />
          </div>
          <div className="adm-action-body">
            <p className="adm-action-title">Create Estimate</p>
            <p className="adm-action-sub">Select an inspection &amp; calculate</p>
          </div>
          <ArrowRight size={18} className="adm-action-arrow" aria-hidden="true" />
        </Link>
      </div>

      {/* ── Recent estimates ──────────────────────────────────── */}
      <div className="adm-section-head">
        <h2>Recent Estimates</h2>
        <hr className="adm-section-line" />
        {!loading && recentEstimates.length > 0 && (
          <span className="adm-section-count">{recentEstimates.length}</span>
        )}
      </div>

      <div className="adm-panel adm-feed">
        {loading ? (
          <div className="adm-feed-empty">Loading…</div>
        ) : recentEstimates.length === 0 ? (
          <div className="adm-feed-empty">No recent estimates.</div>
        ) : (
          recentEstimates.map((item) => {
            const { cls, Icon } = statusMeta(item.status);
            return (
              <div className="adm-feed-row" key={item.estimate_id}>
                <div className="adm-icon adm-icon-sm">
                  <Icon size={16} aria-hidden="true" />
                </div>

                <div className="adm-feed-body">
                  <p className="adm-feed-title">
                    Estimate for {fullName(item.first_name, item.last_name)}
                  </p>
                  <p className="adm-feed-meta">
                    {new Date(item.estimate_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span className={`pill ${cls}`}>{item.status}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
