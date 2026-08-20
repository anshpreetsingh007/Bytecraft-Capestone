"use client";

/**
 * Inspector job reports.
 *
 * The `report` table and every financial report that reads from it already
 * existed, but nothing in the product ever wrote a row -- so "material waste",
 * "profit" and per-inspector performance were all reading an empty table. This
 * is the screen that fills it: when a job is done, the inspector writes up what
 * they found, what it cost, and sends it for sign-off.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import { api, errorMessage, pageInfo, query, rows } from "@/lib/api";
import {
  Banner,
  EmptyState,
  Modal,
  Pagination,
  SkeletonRows,
  StatusPill,
  useToast,
  type PageInfo,
} from "../../../components/ui";
import "../styles/inspector.css";
import "./inspector-reports.css";

interface JobReport {
  report_id: number;
  order_id: number;
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
}

interface OrderOption {
  order_id: number;
  client_first_name: string | null;
  client_last_name: string | null;
  request_details: string | null;
}

interface FormState {
  order_id: string;
  title: string;
  findings: string;
  recommendations: string;
  material_used_cost: string;
  material_waste_cost: string;
  labour_hours: string;
  profit: string;
}

const EMPTY_FORM: FormState = {
  order_id: "",
  title: "",
  findings: "",
  recommendations: "",
  material_used_cost: "",
  material_waste_cost: "",
  labour_hours: "",
  profit: "",
};

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function money(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return currency.format(Number(value));
}

/** Numbers with an optional single decimal point. */
function filterDecimal(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function InspectorReportsPage() {
  const toast = useToast();
  const { userId } = useAuth();

  const [reports, setReports] = useState<JobReport[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async (requestedPage: number) => {
    setError(null);
    try {
      const payload = await api.get<JobReport[]>(
        `/api/job-reports${query({ page: requestedPage, limit: 20 })}`,
      );
      setReports(rows(payload));
      setPagination(pageInfo(payload));
    } catch (err) {
      setError(errorMessage(err, "Could not load your job reports."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(page);
  }, [page, load]);

  /**
   * Orders the inspector could still file against. Loaded lazily when the
   * form opens, because most visits to this page are just to read.
   *
   * Filed against `status=scheduled` only, which is right for a new report —
   * but a report being edited is filed against its own order, and that order
   * has almost always moved past "scheduled" by then (that's usually *why*
   * there's a report). Without `pinned`, the Job dropdown's value wouldn't
   * match any of its options and would render as if nothing were selected.
   */
  const loadOrders = useCallback(async (pinned?: OrderOption) => {
    try {
      const payload = await api.get<OrderOption[]>("/api/orders?status=scheduled&limit=100");
      const fetched = rows(payload);
      const orders =
        pinned && !fetched.some((order) => order.order_id === pinned.order_id)
          ? [pinned, ...fetched]
          : fetched;
      setOrders(orders);
    } catch (err) {
      setFormError(errorMessage(err, "Could not load the list of jobs."));
    }
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
    loadOrders();
  }

  function openEdit(report: JobReport) {
    setEditingId(report.report_id);
    setForm({
      order_id: String(report.order_id),
      title: report.title,
      findings: report.findings ?? "",
      recommendations: report.recommendations ?? "",
      material_used_cost: report.material_used_cost === null ? "" : String(report.material_used_cost),
      material_waste_cost: report.material_waste_cost === null ? "" : String(report.material_waste_cost),
      labour_hours: report.labour_hours === null ? "" : String(report.labour_hours),
      profit: report.profit === null ? "" : String(report.profit),
    });
    setFormError(null);
    setFormOpen(true);
    loadOrders({
      order_id: report.order_id,
      client_first_name: report.client_first_name,
      client_last_name: report.client_last_name,
      request_details: null,
    });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(status: "draft" | "submitted") {
    if (!form.order_id) {
      setFormError("Pick the job this report is for.");
      return;
    }
    if (form.title.trim().length < 3) {
      setFormError("Give the report a title so it can be found later.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      order_id: Number(form.order_id),
      inspector_id: userId,
      title: form.title.trim(),
      findings: form.findings.trim() || null,
      recommendations: form.recommendations.trim() || null,
      material_used_cost: numberOrNull(form.material_used_cost),
      material_waste_cost: numberOrNull(form.material_waste_cost),
      labour_hours: numberOrNull(form.labour_hours),
      profit: numberOrNull(form.profit),
      status,
    };

    try {
      if (editingId) {
        await api.put(`/api/job-reports/${editingId}`, payload);
      } else {
        await api.post("/api/job-reports", payload);
      }

      toast.success(
        status === "submitted" ? "Report submitted" : "Draft saved",
        status === "submitted"
          ? "An admin will review it and close the job out."
          : "You can come back and finish it later.",
      );

      setFormOpen(false);
      load(page);
    } catch (err) {
      // Kept open so nothing typed is lost.
      setFormError(errorMessage(err, "Could not save that report."));
    } finally {
      setSaving(false);
    }
  }

  const orderLabel = useMemo(
    () => (order: OrderOption) => {
      const name = [order.client_first_name, order.client_last_name].filter(Boolean).join(" ");
      return `Order #${order.order_id}${name ? ` — ${name}` : ""}`;
    },
    [],
  );

  return (
    <div className="insp-reports">
      <header className="insp-reports-head">
        <div>
          <p className="insp-eyebrow">Close-out</p>
          <h1>Job Reports</h1>
          <p className="insp-sub">
            Write up a finished job: what you found, what it used, and what it made. An admin signs
            it off and the job is closed.
          </p>
        </div>
        <button type="button" className="ui-button ui-button--primary" onClick={openNew}>
          <Plus size={16} aria-hidden="true" />
          New report
        </button>
      </header>

      {loading ? (
        <SkeletonRows rows={3} height={120} />
      ) : error ? (
        <Banner title="Could not load your reports" detail={error} onRetry={() => load(page)} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No job reports yet"
          message="When you finish a job, file a report here so it gets signed off and counted."
          action={
            <button type="button" className="ui-button ui-button--primary" onClick={openNew}>
              Write your first report
            </button>
          }
        />
      ) : (
        <div className="insp-report-list">
          {reports.map((report) => {
            const customer =
              [report.client_first_name, report.client_last_name].filter(Boolean).join(" ") ||
              "Unknown customer";

            return (
              <article className="insp-report-card" key={report.report_id}>
                <header>
                  <div>
                    <h2>{report.title}</h2>
                    <p className="insp-muted">
                      Order #{report.order_id} &middot; {customer} &middot;{" "}
                      {new Date(report.report_date).toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <StatusPill status={report.status} />
                </header>

                {report.findings ? <p className="insp-report-findings">{report.findings}</p> : null}

                <dl className="insp-report-figures">
                  <div>
                    <dt>Materials</dt>
                    <dd>{money(report.material_used_cost)}</dd>
                  </div>
                  <div>
                    <dt>Waste</dt>
                    <dd>{money(report.material_waste_cost)}</dd>
                  </div>
                  <div>
                    <dt>Hours</dt>
                    <dd>{report.labour_hours ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Profit</dt>
                    <dd>{money(report.profit)}</dd>
                  </div>
                </dl>

                {/* A reviewed report is read-only, so there is nothing to offer. */}
                {report.status !== "reviewed" ? (
                  <div className="insp-report-actions">
                    <button
                      type="button"
                      className="ui-button ui-button--secondary"
                      onClick={() => openEdit(report)}
                    >
                      {report.status === "draft" ? "Continue draft" : "Edit"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {pagination && !loading && !error ? (
        <Pagination info={pagination} onPageChange={setPage} label="reports" busy={loading} />
      ) : null}

      <Modal
        open={formOpen}
        onClose={() => (saving ? undefined : setFormOpen(false))}
        title={editingId ? "Edit job report" : "New job report"}
        description="Costs are optional while it is a draft, but the financial reports only count what you fill in here."
        footer={
          <>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => save("draft")}
              disabled={saving}
            >
              Save draft
            </button>
            <button
              type="button"
              className="ui-button ui-button--primary"
              onClick={() => save("submitted")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Submit for review"}
            </button>
          </>
        }
      >
        <div className="insp-form">
          {formError ? <Banner title="Check the form" detail={formError} /> : null}

          <label className="insp-field">
            <span>Job</span>
            <select
              value={form.order_id}
              onChange={(event) => update("order_id", event.target.value)}
              disabled={editingId !== null}
            >
              <option value="">Choose the job this covers</option>
              {orders.map((order) => (
                <option key={order.order_id} value={order.order_id}>
                  {orderLabel(order)}
                </option>
              ))}
            </select>
          </label>

          <label className="insp-field">
            <span>Title</span>
            <input
              type="text"
              maxLength={150}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Shingle replacement, south slope"
            />
          </label>

          <label className="insp-field">
            <span>What you found</span>
            <textarea
              rows={4}
              maxLength={5000}
              value={form.findings}
              onChange={(event) => update("findings", event.target.value)}
              placeholder="Condition of the roof, what was done, anything the customer should know."
            />
          </label>

          <label className="insp-field">
            <span>Recommendations</span>
            <textarea
              rows={3}
              maxLength={5000}
              value={form.recommendations}
              onChange={(event) => update("recommendations", event.target.value)}
              placeholder="Follow-up work, or what to watch for next season."
            />
          </label>

          <div className="insp-field-row">
            <label className="insp-field">
              <span>Materials used ($)</span>
              <input
                inputMode="decimal"
                value={form.material_used_cost}
                onChange={(event) => update("material_used_cost", filterDecimal(event.target.value))}
              />
            </label>

            <label className="insp-field">
              <span>Waste ($)</span>
              <input
                inputMode="decimal"
                value={form.material_waste_cost}
                onChange={(event) => update("material_waste_cost", filterDecimal(event.target.value))}
              />
            </label>
          </div>

          <div className="insp-field-row">
            <label className="insp-field">
              <span>Labour hours</span>
              <input
                inputMode="decimal"
                value={form.labour_hours}
                onChange={(event) => update("labour_hours", filterDecimal(event.target.value))}
              />
            </label>

            <label className="insp-field">
              <span>Profit ($)</span>
              <input
                inputMode="decimal"
                value={form.profit}
                onChange={(event) => update("profit", filterDecimal(event.target.value))}
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
