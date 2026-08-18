"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { api, errorMessage, pageInfo, query, rows } from "@/lib/api";
import {
  Banner,
  ConfirmDialog,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusPill,
  useToast,
  type PageInfo,
} from "../../../components/ui";
import "../admin-shared.css";
import "./job-reports.css";

interface JobReport {
  report_id: number;
  order_id: number;
  inspector_id: number;
  title: string;
  findings: string | null;
  recommendations: string | null;
  material_used_cost: string | number | null;
  material_waste_cost: string | number | null;
  labour_hours: string | number | null;
  profit: string | number | null;
  report_date: string;
  status: string;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
}

const FILTERS = [
  { label: "Awaiting review", value: "submitted" },
  { label: "All", value: "all" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Drafts", value: "draft" },
];

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function money(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return currency.format(Number(value));
}

function name(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

export default function AdminJobReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<JobReport[]>([]);
  const [filter, setFilter] = useState("submitted");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<JobReport | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async (selectedFilter: string, requestedPage: number) => {
    setError(null);
    try {
      const payload = await api.get<JobReport[]>(
        `/api/job-reports${query({
          status: selectedFilter === "all" ? null : selectedFilter,
          page: requestedPage,
          limit: 25,
        })}`,
      );
      setReports(rows(payload));
      setPagination(pageInfo(payload));
    } catch (err) {
      setError(errorMessage(err, "Could not load job reports."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(filter, page);
  }, [filter, page, load]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  async function confirmReview() {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await api.patch(`/api/job-reports/${reviewTarget.report_id}/review`);
      toast.success(
        "Report signed off",
        `Order #${reviewTarget.order_id} has been closed and the figures now count towards your reports.`,
      );
      setReviewTarget(null);
      load(filter, page);
    } catch (err) {
      toast.error("Could not sign off that report", errorMessage(err));
    } finally {
      setReviewing(false);
    }
  }

  return (
    <main className="job-reports-page">
      <AdminPageHeader
        eyebrow="Close-out"
        title="Job Reports"
        subtitle="What inspectors filed when they finished a job: materials used, waste, hours and profit. Signing one off closes the order and feeds the financial reports."
        chips={[{ label: "In view", value: loading ? "—" : (pagination?.total ?? reports.length) }]}
      />

      <div className="request-filters">
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            className={filter === entry.value ? "active" : ""}
            onClick={() => setFilter(entry.value)}
            aria-pressed={filter === entry.value}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows rows={3} height={150} />
      ) : error ? (
        <Banner title="Could not load job reports" detail={error} onRetry={() => load(filter, page)} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={22} />}
          title={filter === "submitted" ? "Nothing waiting for sign-off" : "No job reports here"}
          message="Inspectors file a report when they finish a job. Until one exists for an order, none of that work shows up in the financial reports."
        />
      ) : (
        <div className="job-report-list">
          {reports.map((report) => (
            <article className="job-report-card" key={report.report_id}>
              <header className="job-report-head">
                <div>
                  <h2>{report.title}</h2>
                  <p className="muted">
                    Order #{report.order_id} &middot;{" "}
                    {name(report.client_first_name, report.client_last_name, "Unknown customer")} &middot;{" "}
                    {name(report.inspector_first_name, report.inspector_last_name, "Unknown inspector")}
                  </p>
                </div>
                <StatusPill status={report.status} />
              </header>

              {report.findings ? (
                <div className="job-report-section">
                  <h3>Findings</h3>
                  <p>{report.findings}</p>
                </div>
              ) : null}

              {report.recommendations ? (
                <div className="job-report-section">
                  <h3>Recommendations</h3>
                  <p>{report.recommendations}</p>
                </div>
              ) : null}

              <dl className="job-report-figures">
                <div>
                  <dt>Materials used</dt>
                  <dd>{money(report.material_used_cost)}</dd>
                </div>
                <div>
                  <dt>Waste</dt>
                  <dd>{money(report.material_waste_cost)}</dd>
                </div>
                <div>
                  <dt>Labour hours</dt>
                  <dd>{report.labour_hours ?? "—"}</dd>
                </div>
                <div>
                  <dt>Profit</dt>
                  <dd>{money(report.profit)}</dd>
                </div>
                <div>
                  <dt>Filed</dt>
                  <dd>{new Date(report.report_date).toLocaleDateString("en-CA")}</dd>
                </div>
              </dl>

              {report.status === "submitted" ? (
                <div className="job-report-actions">
                  <button
                    type="button"
                    className="ui-button ui-button--primary"
                    onClick={() => setReviewTarget(report)}
                  >
                    Sign off &amp; close order
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {pagination && !loading && !error ? (
        <Pagination info={pagination} onPageChange={setPage} label="reports" busy={loading} />
      ) : null}

      <ConfirmDialog
        open={reviewTarget !== null}
        onCancel={() => setReviewTarget(null)}
        onConfirm={confirmReview}
        busy={reviewing}
        title="Sign this report off?"
        description={
          reviewTarget
            ? `Order #${reviewTarget.order_id} will be marked completed and the report becomes read-only. Its figures start counting towards the financial reports.`
            : undefined
        }
        confirmLabel="Sign off"
      />
    </main>
  );
}
