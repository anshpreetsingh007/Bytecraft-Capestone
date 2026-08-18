"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, UserPlus } from "lucide-react";
import { AdminPageHeader } from "../../../components/AdminPageHeader";
import { api, errorMessage, pageInfo, query, rows, ApiError } from "@/lib/api";
import {
  Banner,
  ConfirmDialog,
  EmptyState,
  Modal,
  Pagination,
  SkeletonRows,
  StatusPill,
  useToast,
  type PageInfo,
} from "../../../components/ui";
import "./inspection-requests.css";

interface InspectionRequestWithDetails {
  request_id: number;
  client_id: number;
  inspector_id: number | null;
  status: string;
  details: string;
  scheduled_date: string | null;
  duration_minutes: number;
  site_address: string | null;
  contact_phone: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
  existing_order_id: number | null;
}

interface Inspector {
  inspector_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface ScheduleCheck {
  available: boolean;
  blocking: { message: string }[];
  warnings: { message: string }[];
}

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const DURATIONS = [30, 45, 60, 90, 120, 180, 240];

function formatName(first: string | null, last: string | null, fallback: string): string {
  if (!first && !last) return fallback;
  return `${first ?? ""} ${last ?? ""}`.trim();
}

/**
 * Appointments are stored as real instants now, so they carry a time of day.
 * They used to be a bare DATE, which is why this only ever showed a date.
 */
function formatAppointment(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** `datetime-local` wants local wall-clock text, not an ISO instant. */
function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultSlot(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return toLocalInputValue(tomorrow);
}

export default function InspectionRequestsPage() {
  const toast = useToast();

  const [requests, setRequests] = useState<InspectionRequestWithDetails[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [convertTarget, setConvertTarget] = useState<InspectionRequestWithDetails | null>(null);
  const [converting, setConverting] = useState(false);

  // Booking dialog
  const [bookingFor, setBookingFor] = useState<InspectionRequestWithDetails | null>(null);
  const [bookingInspectorId, setBookingInspectorId] = useState("");
  const [bookingSlot, setBookingSlot] = useState(defaultSlot());
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingCheck, setBookingCheck] = useState<ScheduleCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);

  const loadRequests = useCallback(async (selectedFilter: string, requestedPage: number) => {
    setError(null);
    try {
      const payload = await api.get<InspectionRequestWithDetails[]>(
        `/api/inspection-requests${query({
          status: selectedFilter === "all" ? null : selectedFilter,
          page: requestedPage,
          limit: 25,
        })}`,
      );
      setRequests(rows(payload));
      setPagination(pageInfo(payload));
    } catch (err) {
      setError(errorMessage(err, "Could not load inspection requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadRequests(filter, page);
  }, [filter, page, loadRequests]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    api
      .get<Inspector[]>("/api/inspectors")
      .then((payload) => setInspectors(rows(payload)))
      .catch((err) => toast.error("Could not load the inspector list", errorMessage(err)));
    // The toast helpers are stable for the lifetime of the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inspectorName = useCallback(
    (id: number | string) => {
      const found = inspectors.find((entry) => entry.inspector_id === Number(id));
      return found ? `${found.first_name} ${found.last_name}` : `Inspector #${id}`;
    },
    [inspectors],
  );

  /* --- Convert to order ------------------------------------------------- */

  async function confirmConvert() {
    if (!convertTarget) return;
    setConverting(true);
    try {
      const order = await api.post<{ order_id: number }>(
        `/api/orders/from-request/${convertTarget.request_id}`,
      );
      setRequests((prev) =>
        prev.map((entry) =>
          entry.request_id === convertTarget.request_id
            ? { ...entry, existing_order_id: order.order_id }
            : entry,
        ),
      );
      toast.success("Order created", `Order #${order.order_id} is ready for an estimate.`);
      setConvertTarget(null);
    } catch (err) {
      // A 409 means somebody else already converted it, so refresh rather
      // than leaving a stale "Convert" button on screen.
      if (err instanceof ApiError && err.isConflict) {
        toast.info("Already converted", "Someone else turned this request into an order.");
        loadRequests(filter, page);
        setConvertTarget(null);
      } else {
        toast.error("Could not convert the request", errorMessage(err));
      }
    } finally {
      setConverting(false);
    }
  }

  /* --- Booking ----------------------------------------------------------- */

  function openBooking(request: InspectionRequestWithDetails) {
    setBookingFor(request);
    setBookingInspectorId(request.inspector_id ? String(request.inspector_id) : "");
    setBookingSlot(
      request.scheduled_date ? toLocalInputValue(new Date(request.scheduled_date)) : defaultSlot(),
    );
    setBookingDuration(request.duration_minutes || 60);
    setBookingCheck(null);
  }

  /**
   * Checks the slot before anything is saved, so a clash is visible while the
   * admin still has the form open rather than as an error after submitting.
   */
  const runCheck = useCallback(async () => {
    if (!bookingFor || !bookingInspectorId || !bookingSlot) {
      setBookingCheck(null);
      return;
    }

    setChecking(true);
    try {
      const result = await api.post<ScheduleCheck>(
        `/api/inspectors/${bookingInspectorId}/schedule/check`,
        {
          scheduled_date: new Date(bookingSlot).toISOString(),
          duration_minutes: bookingDuration,
          request_id: bookingFor.request_id,
        },
      );
      setBookingCheck(result);
    } catch {
      // A failed pre-check must not block booking; the server checks again.
      setBookingCheck(null);
    } finally {
      setChecking(false);
    }
  }, [bookingFor, bookingInspectorId, bookingSlot, bookingDuration]);

  useEffect(() => {
    // Debounced so dragging through the time picker does not fire a request
    // per keystroke.
    const timer = setTimeout(runCheck, 350);
    return () => clearTimeout(timer);
  }, [runCheck]);

  async function submitBooking() {
    if (!bookingFor || !bookingInspectorId) return;

    setBooking(true);
    try {
      await api.patch(`/api/inspection-requests/${bookingFor.request_id}/schedule`, {
        inspector_id: Number(bookingInspectorId),
        scheduled_date: new Date(bookingSlot).toISOString(),
        duration_minutes: bookingDuration,
      });

      toast.success(
        "Inspection booked",
        `${inspectorName(bookingInspectorId)} has been assigned and the customer has been told.`,
      );
      setBookingFor(null);
      loadRequests(filter, page);
    } catch (err) {
      toast.error("Could not book that slot", errorMessage(err));
    } finally {
      setBooking(false);
    }
  }

  const blocked = (bookingCheck?.blocking.length ?? 0) > 0;

  const headerChips = useMemo(
    () => [
      { label: "In view", value: loading ? "—" : (pagination?.total ?? requests.length) },
      { label: "Inspectors", value: inspectors.length },
    ],
    [loading, pagination, requests.length, inspectors.length],
  );

  return (
    <main className="requests-page">
      <AdminPageHeader
        eyebrow="Intake"
        title="Inspection Requests"
        subtitle="Review what has come in, book an inspector at a real date and time, and convert requests into orders so estimates can be created."
        chips={headerChips}
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
        <Banner
          title="Could not load inspection requests"
          detail={error}
          onRetry={() => loadRequests(filter, page)}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No requests yet" : `No ${filter.replace("_", " ")} requests`}
          message={
            filter === "all"
              ? "Requests submitted from the customer site, or by the chatbot, will land here."
              : "Try a different filter to see the rest of the queue."
          }
        />
      ) : (
        <div className="request-list">
          {requests.map((request) => {
            const appointment = formatAppointment(request.scheduled_date);
            const closed = request.status === "completed" || request.status === "cancelled";

            return (
              <div className="request-card" key={request.request_id}>
                <div className="request-card-header">
                  <h2>{formatName(request.client_first_name, request.client_last_name, "Unknown client")}</h2>
                  <StatusPill status={request.status} />
                </div>

                <p className="muted">
                  Inspector:{" "}
                  {formatName(request.inspector_first_name, request.inspector_last_name, "Unassigned")}
                </p>

                <p className="muted">
                  {appointment ? `Booked for ${appointment}` : "Not booked yet"}
                  {appointment ? ` (${request.duration_minutes} min)` : ""}
                </p>

                {request.site_address ? <p className="muted">Site: {request.site_address}</p> : null}

                <p className="request-details">{request.details}</p>

                <div className="request-actions">
                  {request.existing_order_id ? (
                    <span className="pill pill-converted">Order #{request.existing_order_id}</span>
                  ) : (
                    <button
                      className="btn-convert"
                      type="button"
                      onClick={() => setConvertTarget(request)}
                      disabled={request.status === "cancelled"}
                    >
                      Convert to Order
                    </button>
                  )}

                  {!closed ? (
                    <button className="btn-assign" type="button" onClick={() => openBooking(request)}>
                      {request.scheduled_date ? (
                        <>
                          <CalendarClock size={15} aria-hidden="true" /> Reschedule
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} aria-hidden="true" /> Assign &amp; book
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination && !loading && !error ? (
        <Pagination info={pagination} onPageChange={setPage} label="requests" busy={loading} />
      ) : null}

      <ConfirmDialog
        open={convertTarget !== null}
        onCancel={() => setConvertTarget(null)}
        onConfirm={confirmConvert}
        busy={converting}
        title="Convert this request into an order?"
        description={
          convertTarget
            ? `This creates an order for ${formatName(
                convertTarget.client_first_name,
                convertTarget.client_last_name,
                "this customer",
              )}, which is what an estimate gets attached to. It cannot be undone.`
            : undefined
        }
        confirmLabel="Create order"
      />

      <Modal
        open={bookingFor !== null}
        onClose={() => (booking ? undefined : setBookingFor(null))}
        title={bookingFor?.scheduled_date ? "Reschedule inspection" : "Assign and book"}
        description={
          bookingFor
            ? `Request #${bookingFor.request_id} for ${formatName(
                bookingFor.client_first_name,
                bookingFor.client_last_name,
                "this customer",
              )}.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => setBookingFor(null)}
              disabled={booking}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ui-button ui-button--primary"
              onClick={submitBooking}
              disabled={booking || checking || blocked || !bookingInspectorId || !bookingSlot}
            >
              {booking ? "Booking..." : "Confirm booking"}
            </button>
          </>
        }
      >
        <div className="booking-form">
          <label className="booking-field">
            <span>Inspector</span>
            <select
              value={bookingInspectorId}
              onChange={(event) => setBookingInspectorId(event.target.value)}
            >
              <option value="">Choose an inspector</option>
              {inspectors.map((inspector) => (
                <option key={inspector.inspector_id} value={inspector.inspector_id}>
                  {inspector.first_name} {inspector.last_name}
                </option>
              ))}
            </select>
          </label>

          <label className="booking-field">
            <span>Date and time</span>
            <input
              type="datetime-local"
              value={bookingSlot}
              onChange={(event) => setBookingSlot(event.target.value)}
            />
          </label>

          <label className="booking-field">
            <span>Expected duration</span>
            <select
              value={bookingDuration}
              onChange={(event) => setBookingDuration(Number(event.target.value))}
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          {/* Live feedback on the slot. A double booking blocks the button;
              working hours and time off are only warnings, because an admin
              may knowingly book an emergency call-out on a Saturday. */}
          <div aria-live="polite">
            {checking ? (
              <p className="booking-hint">Checking that slot...</p>
            ) : blocked ? (
              <Banner
                title="That inspector is already booked"
                detail={bookingCheck?.blocking.map((entry) => entry.message).join(" ")}
              />
            ) : bookingCheck && bookingCheck.warnings.length > 0 ? (
              <Banner
                variant="warning"
                title="Outside their normal hours"
                detail={bookingCheck.warnings.map((entry) => entry.message).join(" ")}
              />
            ) : bookingCheck?.available ? (
              <Banner variant="success" title="That slot is free" />
            ) : null}
          </div>
        </div>
      </Modal>
    </main>
  );
}
