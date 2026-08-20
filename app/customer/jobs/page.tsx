"use client";

/**
 * Customer job tracking.
 *
 * A customer could submit an inspection request and then had no way of
 * finding out what happened to it — not whether it had been picked up, who was
 * coming, or when. Everything on this page is scoped to the signed-in
 * customer by the server; the ids in the URL are not trusted.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../Context/AuthContext";
import { api, errorMessage, rows } from "@/lib/api";
import { Banner, EmptyState, SkeletonRows, StatusPill } from "../../../components/ui";
import "./jobs.css";

interface InspectionRequest {
  request_id: number;
  status: string;
  details: string;
  scheduled_date: string | null;
  duration_minutes: number;
  site_address: string | null;
  created_at: string;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
}

/** What each status means, in the customer's terms rather than ours. */
const STATUS_EXPLANATION: Record<string, string> = {
  pending: "We've got your request and we're finding an inspector for you.",
  assigned: "An inspector has been assigned. We'll confirm the time with you.",
  in_progress: "Your inspection is underway.",
  completed: "The inspection is done. Any estimate will appear under View Estimate.",
  cancelled: "This request was cancelled. Get in touch if that wasn't expected.",
};

function formatAppointment(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerJobsPage() {
  const { currentUser, role, userId, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await api.get<InspectionRequest[]>(
        `/api/inspection-requests/client/${userId}?limit=50`,
      );
      setRequests(rows(payload));
    } catch (err) {
      setError(errorMessage(err, "We couldn't load your inspections."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const signedInCustomer = Boolean(currentUser) && role === "client";

  return (
    <>
      <section className="bg-navy pt-[72px] pb-16">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="block mb-3 text-xs font-bold uppercase tracking-[0.14em] !text-white">
            Your account
          </span>
          <h1 className="!text-white font-bold text-[2.2rem] sm:text-[3rem] max-w-[20ch] leading-tight">
            My jobs
          </h1>
          <p className="!text-white/85 mt-4 max-w-[52ch] text-[1.02rem] leading-relaxed">
            Every inspection you&rsquo;ve asked us for, and where each one has got to.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1120px] mx-auto px-7">
          {authLoading ? (
            <SkeletonRows rows={2} height={120} />
          ) : !signedInCustomer ? (
            <EmptyState
              title="Sign in to see your jobs"
              message="Your inspections and their status are tied to your account."
              action={
                <Link className="ui-button ui-button--primary" href="/signin">
                  Sign in
                </Link>
              }
            />
          ) : loading ? (
            <SkeletonRows rows={3} height={140} />
          ) : error ? (
            <Banner title="We couldn't load your inspections" detail={error} onRetry={load} />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No inspections yet"
              message="Request a free inspection and we'll come and take a look at your roof."
              action={
                // The free-quote form on the contact page is the one that
                // actually files a request.
                <Link className="ui-button ui-button--primary" href="/customer/contact">
                  Request a free inspection
                </Link>
              }
            />
          ) : (
            <ol className="cust-job-list">
              {requests.map((request) => {
                const appointment = formatAppointment(request.scheduled_date);
                const inspector = [request.inspector_first_name, request.inspector_last_name]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li className="cust-job-card" key={request.request_id}>
                    <header className="cust-job-head">
                      <div>
                        <h2>Inspection #{request.request_id}</h2>
                        <p className="cust-job-sub">
                          Requested{" "}
                          {new Date(request.created_at).toLocaleDateString("en-CA", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <StatusPill status={request.status} />
                    </header>

                    <p className="cust-job-explain">
                      {STATUS_EXPLANATION[request.status] ?? "We're working on this one."}
                    </p>

                    <dl className="cust-job-meta">
                      <div>
                        <dt>Appointment</dt>
                        <dd>{appointment ?? "Not booked yet"}</dd>
                      </div>
                      <div>
                        <dt>Inspector</dt>
                        <dd>{inspector || "Not assigned yet"}</dd>
                      </div>
                      {request.site_address ? (
                        <div>
                          <dt>Property</dt>
                          <dd>{request.site_address}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <p className="cust-job-details">{request.details}</p>

                    {request.status === "completed" ? (
                      <Link className="ui-button ui-button--secondary" href="/customer/estimate">
                        View your estimate
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
