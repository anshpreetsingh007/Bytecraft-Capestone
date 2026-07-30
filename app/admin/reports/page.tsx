"use client";

import { useEffect, useState, useCallback } from "react";
import "./reports.css";
import {
  ReportOverview,
  ReportPeriod,
  FinancialReportEntry,
  InspectorPerformance,
  EstimateReport,
  InvoiceReport,
} from "../types/report";

// TODO: move to NEXT_PUBLIC_REPORT_SERVICE_URL once the rest of the frontend
// adopts env-based service URLs (currently other pages hardcode localhost too).
const REPORT_SERVICE_URL = "";

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

function formatPeriodLabel(isoDate: string, period: ReportPeriod): string {
  const date = new Date(isoDate);
  if (period === "year") return date.getFullYear().toString();
  if (period === "quarter") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [financial, setFinancial] = useState<FinancialReportEntry[]>([]);
  const [inspectors, setInspectors] = useState<InspectorPerformance[]>([]);
  const [estimates, setEstimates] = useState<EstimateReport | null>(null);
  const [invoices, setInvoices] = useState<InvoiceReport | null>(null);

  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (selectedPeriod: ReportPeriod) => {
    setError(null);
    try {
      const [overviewRes, financialRes, inspectorsRes, estimatesRes, invoicesRes] =
        await Promise.all([
          fetch(`${REPORT_SERVICE_URL}/api/reports/overview`),
          fetch(`${REPORT_SERVICE_URL}/api/reports/financial?period=${selectedPeriod}`),
          fetch(`${REPORT_SERVICE_URL}/api/reports/inspectors`),
          fetch(`${REPORT_SERVICE_URL}/api/reports/estimates`),
          fetch(`${REPORT_SERVICE_URL}/api/reports/invoices`),
        ]);

      if (!overviewRes.ok || !financialRes.ok || !inspectorsRes.ok || !estimatesRes.ok || !invoicesRes.ok) {
        throw new Error("One or more report endpoints returned an error");
      }

      setOverview(await overviewRes.json());
      setFinancial(await financialRes.json());
      setInspectors(await inspectorsRes.json());
      setEstimates(await estimatesRes.json());
      setInvoices(await invoicesRes.json());
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Couldn't load report data. Is report-service running on port 3006?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: fetch everything once.
  useEffect(() => {
    loadAll(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the period selector changes, only re-fetch the financial trend
  // (the other sections don't depend on it) rather than reloading everything.
  const handlePeriodChange = async (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    try {
      const res = await fetch(`${REPORT_SERVICE_URL}/api/reports/financial?period=${newPeriod}`);
      if (!res.ok) throw new Error("Failed to fetch financial report");
      setFinancial(await res.json());
    } catch (err) {
      console.error("Failed to reload financial report:", err);
    }
  };

  if (loading) {
    return (
      <main className="reports-page">
        <h1>Reports Dashboard</h1>
        <p className="reports-status">Loading reports…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="reports-page">
        <h1>Reports Dashboard</h1>
        <p className="reports-status error">{error}</p>
      </main>
    );
  }

  return (
    <main className="reports-page">
      <h1>Reports Dashboard</h1>
      <p className="reports-subtitle">Material wastage, profit, and activity across the business</p>

      {/* ─── Overview cards ─────────────────────────── */}
      {overview && (
        <div className="reports-grid">
          <div className="report-card">
            <h2>Inspection Overview</h2>
            <p>Total Inspections: <strong>{overview.inspections.total}</strong></p>
            <p>Completed: <strong>{overview.inspections.completed}</strong></p>
            <p>Pending: <strong>{overview.inspections.pending}</strong></p>
            <p>In Progress: <strong>{overview.inspections.inProgress}</strong></p>
          </div>

          <div className="report-card">
            <h2>Revenue Overview</h2>
            <p>This Month: <strong>{currency.format(overview.revenue.thisMonth)}</strong></p>
            <p>Last Month: <strong>{currency.format(overview.revenue.lastMonth)}</strong></p>
            <p>All-Time Total: <strong>{currency.format(overview.revenue.total)}</strong></p>
          </div>

          <div className="report-card">
            <h2>Inspector Activity</h2>
            <p>Total Inspectors: <strong>{overview.inspectors.total}</strong></p>
            <p>Active (Last 30 Days): <strong>{overview.inspectors.activeLast30Days}</strong></p>
            <p>Avg Inspections/Inspector: <strong>{overview.inspectors.avgInspectionsPerInspector}</strong></p>
          </div>
        </div>
      )}

      {/* ─── Financial trend (material waste + profit) ─── */}
      <div className="report-section">
        <div className="report-section-header">
          <h2>Financial Trends — Material Waste &amp; Profit</h2>
          <div className="period-selector">
            {(["month", "quarter", "year"] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => handlePeriodChange(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}ly
              </button>
            ))}
          </div>
        </div>

        {financial.length === 0 ? (
          <p className="reports-empty">No report data for this period yet.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="numeric">Material Used</th>
                <th className="numeric">Material Waste</th>
                <th>Waste Share</th>
                <th className="numeric">Profit</th>
                <th className="numeric">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {financial.map((entry) => {
                const totalCost = entry.materialUsedCost + entry.materialWasteCost;
                const wastePct = totalCost > 0 ? (entry.materialWasteCost / totalCost) * 100 : 0;
                return (
                  <tr key={entry.period}>
                    <td>{formatPeriodLabel(entry.period, period)}</td>
                    <td className="numeric">{currency.format(entry.materialUsedCost)}</td>
                    <td className="numeric">{currency.format(entry.materialWasteCost)}</td>
                    <td style={{ minWidth: 100 }}>
                      <div className="cost-bar-track">
                        <div className="cost-bar-fill" style={{ width: `${wastePct.toFixed(1)}%` }} />
                      </div>
                    </td>
                    <td className="numeric">{currency.format(entry.profit)}</td>
                    <td className="numeric">{entry.jobsReported}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Inspector performance ──────────────────── */}
      <div className="report-section">
        <div className="report-section-header">
          <h2>Inspector Performance</h2>
        </div>

        {inspectors.length === 0 ? (
          <p className="reports-empty">No inspectors on file yet.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Inspector</th>
                <th className="numeric">Jobs Completed</th>
                <th className="numeric">Total Profit</th>
                <th className="numeric">Avg Material Waste</th>
                <th className="numeric">Inspections Assigned</th>
                <th className="numeric">Inspections Completed</th>
              </tr>
            </thead>
            <tbody>
              {inspectors.map((inspector) => (
                <tr key={inspector.inspectorId}>
                  <td>{inspector.name}</td>
                  <td className="numeric">{inspector.jobsCompleted}</td>
                  <td className="numeric">{currency.format(inspector.totalProfit)}</td>
                  <td className="numeric">{currency.format(inspector.avgMaterialWaste)}</td>
                  <td className="numeric">{inspector.inspectionsAssigned}</td>
                  <td className="numeric">{inspector.inspectionsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Estimates + Invoices side by side ──────── */}
      <div className="reports-grid">
        {estimates && (
          <div className="report-card">
            <h2>Estimate Approval Rate</h2>
            <p>Total Estimates: <strong>{estimates.total}</strong></p>
            <p>
              Approval Rate:{" "}
              <span className={`pill ${estimates.approvalRate >= 60 ? "pill-good" : estimates.approvalRate >= 30 ? "pill-warn" : "pill-bad"}`}>
                {estimates.approvalRate}%
              </span>
            </p>
            {Object.entries(estimates.byStatus).map(([status, count]) => (
              <p key={status} style={{ textTransform: "capitalize" }}>
                {status}: <strong>{count}</strong>
              </p>
            ))}
          </div>
        )}

        {invoices && (
          <div className="report-card">
            <h2>Invoices &amp; Outstanding Balance</h2>
            <p>Paid: <strong>{invoices.summary.paidCount}</strong> ({currency.format(invoices.summary.totalPaid)})</p>
            <p>Pending: <strong>{invoices.summary.pendingCount}</strong></p>
            <p>
              Overdue: <strong>{invoices.summary.overdueCount}</strong>{" "}
              {invoices.summary.overdueCount > 0 && <span className="pill pill-bad">Needs follow-up</span>}
            </p>
            <p>Total Outstanding: <strong>{currency.format(invoices.summary.totalOutstanding)}</strong></p>
          </div>
        )}
      </div>

      {/* ─── Overdue invoice list ────────────────────── */}
      {invoices && invoices.overdueInvoices.length > 0 && (
        <div className="report-section">
          <div className="report-section-header">
            <h2>Overdue Invoices</h2>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client ID</th>
                <th className="numeric">Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.overdueInvoices.map((invoice) => (
                <tr key={invoice.invoiceId}>
                  <td>#{invoice.invoiceId}</td>
                  <td>{invoice.clientId}</td>
                  <td className="numeric">{currency.format(invoice.totalAmount)}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString("en-CA")}</td>
                  <td><span className="pill pill-bad">{invoice.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
