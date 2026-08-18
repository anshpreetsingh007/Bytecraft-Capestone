"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import "./reports.css";
import {
  ReportOverview,
  ReportPeriod,
  FinancialReportEntry,
  InspectorPerformance,
  EstimateReport,
  JobsReport,
} from "../types/report";
import { api, errorMessage } from "@/lib/api";
import { Banner, SkeletonRows } from "../../../components/ui";

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
  const [jobs, setJobs] = useState<JobsReport | null>(null);

  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (selectedPeriod: ReportPeriod) => {
    setError(null);
    try {
      const [overviewData, financialData, inspectorData, estimateData, jobsData] = await Promise.all([
        api.get<ReportOverview>("/api/reports/overview"),
        api.get<FinancialReportEntry[]>(`/api/reports/financial?period=${selectedPeriod}`),
        api.get<InspectorPerformance[]>("/api/reports/inspectors"),
        api.get<EstimateReport>("/api/reports/estimates"),
        // Replaces /api/reports/invoices: the pipeline of priced, accepted and
        // finished work, since the business does not invoice through the app.
        api.get<JobsReport>("/api/reports/jobs"),
      ]);

      setOverview(overviewData);
      setFinancial(financialData);
      setInspectors(inspectorData);
      setEstimates(estimateData);
      setJobs(jobsData);
    } catch (err) {
      setError(errorMessage(err, "Could not load report data."));
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
      setFinancial(await api.get<FinancialReportEntry[]>(`/api/reports/financial?period=${newPeriod}`));
    } catch (err) {
      setError(errorMessage(err, "Could not reload the financial trend."));
    }
  };

  if (loading) {
    return (
      <main className="reports-page">
        <AdminPageHeader
          eyebrow="Business intelligence"
          title="Reports"
          subtitle="Material wastage, profit, and activity across the business."
        />
        <SkeletonRows rows={4} height={120} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="reports-page">
        <AdminPageHeader
          eyebrow="Business intelligence"
          title="Reports"
          subtitle="Material wastage, profit, and activity across the business."
        />
        <Banner title="Could not load reports" detail={error} onRetry={() => loadAll(period)} />
      </main>
    );
  }

  return (
    <main className="reports-page">
      <AdminPageHeader
        eyebrow="Business intelligence"
        title="Reports"
        subtitle="Material wastage, profit, and activity across the business."
        chips={
          overview
            ? [
                { label: "Inspections", value: overview.inspections.total },
                { label: "This month", value: currency.format(overview.revenue.thisMonth) },
              ]
            : undefined
        }
      />

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
        <div className="report-section-header adm-section-head">
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
        <div className="report-section-header adm-section-head">
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
              Cleared internal review:{" "}
              <span className={`pill ${estimates.approvalRate >= 60 ? "pill-good" : estimates.approvalRate >= 30 ? "pill-warn" : "pill-bad"}`}>
                {estimates.approvalRate}%
              </span>
            </p>
            <p>
              Accepted by the customer:{" "}
              <span className={`pill ${estimates.acceptanceRate >= 60 ? "pill-good" : estimates.acceptanceRate >= 30 ? "pill-warn" : "pill-bad"}`}>
                {estimates.acceptanceRate}%
              </span>
            </p>
            {Object.entries(estimates.byStatus).map(([status, count]) => (
              <p key={status} style={{ textTransform: "capitalize" }}>
                {status}: <strong>{count}</strong>
              </p>
            ))}
          </div>
        )}

        {jobs && (
          <div className="report-card">
            <h2>Work Pipeline</h2>
            <p>
              Waiting on internal review: <strong>{jobs.summary.awaitingReview}</strong>
            </p>
            <p>
              Sent, waiting on the customer: <strong>{jobs.summary.awaitingCustomer}</strong>{" "}
              ({currency.format(jobs.summary.pipelineValue)})
            </p>
            <p>
              Accepted: <strong>{jobs.summary.accepted}</strong>{" "}
              ({currency.format(jobs.summary.acceptedValue)})
            </p>
            <p>
              Declined: <strong>{jobs.summary.declined}</strong>{" "}
              {jobs.summary.declined > 0 && <span className="pill pill-warn">Worth reviewing</span>}
            </p>
          </div>
        )}
      </div>

      {/* ─── Accepted work with no job report yet ───── */}
      {jobs && jobs.awaitingJobReport.length > 0 && (
        <div className="report-section">
          <div className="report-section-header adm-section-head">
            <h2>Accepted work awaiting a job report</h2>
          </div>
          <p className="reports-hint">
            The customer has agreed to this work but no inspector has filed a report against it yet,
            so none of it is showing up in the financial figures above.
          </p>
          <table className="report-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th className="numeric">Value</th>
                <th>Accepted</th>
              </tr>
            </thead>
            <tbody>
              {jobs.awaitingJobReport.map((entry) => (
                <tr key={entry.orderId}>
                  <td>#{entry.orderId}</td>
                  <td>{entry.clientName ?? `Client #${entry.clientId}`}</td>
                  <td className="numeric">{currency.format(entry.value)}</td>
                  <td>
                    {entry.acceptedAt
                      ? new Date(entry.acceptedAt).toLocaleDateString("en-CA")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </main>
  );
}
