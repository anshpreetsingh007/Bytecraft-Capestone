"use client";

import { useCallback, useEffect, useState } from "react";
import RoofLine from "../components/RoofLine";
import { useAuth } from "../../../Context/AuthContext";
import { api, errorMessage, rows } from "@/lib/api";
import { ConfirmDialog, useToast } from "../../../components/ui";

interface Estimate {
  estimate_id: number;
  order_id: number;
  details: string;
  estimate_date: string;
  status: string;
  total_amount: string | number | null;
  client_response: "pending" | "accepted" | "declined";
  client_responded_at: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
}

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function formatName(
  first: string | null,
  last: string | null,
  fallback: string
): string {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || fallback;
}

const statusStyles: Record<string, string> = {
  approved:
    "bg-[#EDF3EE] text-[#2F5233] border-[#B7CDBB]",
  rejected:
    "bg-[#FBEAEA] text-[#8A2C2C] border-[#E7C2C2]",
  pending:
    "bg-[#FFF3E5] text-[#8A5A1E] border-[#F0D6AE]",
  submitted:
    "bg-[#FFF3E5] text-[#8A5A1E] border-[#F0D6AE]",
};

function statusClass(status: string) {
  return (
    statusStyles[status?.toLowerCase()] ??
    "bg-paper-dim text-ink-soft border-line"
  );
}

interface PendingResponse {
  estimate: Estimate;
  response: "accepted" | "declined";
}

export default function EstimatePage() {
  const { userId } = useAuth();
  const toast = useToast();

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingResponse | null>(null);
  const [responding, setResponding] = useState(false);

  const fetchEstimates = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await api.get<Estimate[]>(`/api/estimates/client/${userId}?limit=50`);
      setEstimates(rows(payload));
    } catch (err) {
      setError(errorMessage(err, "We couldn't load your estimates."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  /**
   * Accepting or declining.
   *
   * This was the gap in the whole flow: an admin could approve an estimate and
   * the customer could read it, but there was no way for them to actually
   * agree to the work. Accepting is what moves the job forward.
   */
  async function submitResponse() {
    if (!pending) return;
    const { estimate, response } = pending;

    setResponding(true);
    try {
      const updated = await api.patch<Estimate>(`/api/estimates/${estimate.estimate_id}/response`, {
        response,
      });

      setEstimates((current) =>
        current.map((entry) =>
          entry.estimate_id === estimate.estimate_id ? { ...entry, ...updated } : entry,
        ),
      );

      toast.success(
        response === "accepted" ? "Estimate accepted" : "Estimate declined",
        response === "accepted"
          ? "Thanks — we'll be in touch to book the work in."
          : "No problem. Someone will follow up if you'd like to talk it through.",
      );
      setPending(null);
    } catch (err) {
      toast.error("We couldn't record that", errorMessage(err));
    } finally {
      setResponding(false);
    }
  }

  return (
    <>
      {/* =========================
          HERO
      ========================= */}

      <section className="bg-navy pt-[72px] pb-16">
        <div className="max-w-[1120px] mx-auto px-7">

          <span
            className="
              block
              mb-3
              text-xs
              font-bold
              uppercase
              tracking-[0.14em]
              !text-white
            "
          >
            View Estimate
          </span>

          <h1
            className="
              !text-white
              font-bold
              text-[2.2rem]
              sm:text-[3rem]
              max-w-[20ch]
              leading-[1.08]
              mb-0
            "
          >
            Track your cost estimate
          </h1>

          <p
            className="
              !text-white/90
              max-w-[50ch]
              mt-5
              mb-0
              leading-relaxed
            "
          >
            Estimates submitted after your inspection show up
            here once an inspector has entered them.
          </p>

        </div>
      </section>

      <RoofLine />

      {/* =========================
          ESTIMATES
      ========================= */}

      <section className="bg-background py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">

          {/* LOADING */}

          {loading && (
            <div className="py-8">
              <p className="text-ink-soft mb-0">
                Loading estimates…
              </p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              className="
                bg-[#FBEAEA]
                border
                border-[#E7C2C2]
                text-[#8A2C2C]
                px-5
                py-4
                rounded-lg
                text-[0.95rem]
              "
            >
              {error} Please try again shortly, or call the office if it keeps
              happening.
            </div>
          )}

          {/* EMPTY STATE */}

          {!loading &&
            !error &&
            estimates.length === 0 && (
              <div
                className="
                  bg-paper-dim
                  border
                  border-line
                  px-6
                  py-6
                  rounded-xl
                "
              >
                <h2 className="text-foreground font-bold text-[1.15rem] mb-2">
                  No estimates yet
                </h2>

                <p className="text-ink-soft text-[0.95rem] mb-0">
                  Once an inspector submits a cost estimate
                  for your inspection, it will appear here.
                </p>
              </div>
            )}

          {/* ESTIMATE CARDS */}

          {!loading &&
            !error &&
            estimates.length > 0 && (
              <>
                <div className="mb-8">
                  <span
                    className="
                      block
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-navy
                      dark:text-white
                      mb-2
                    "
                  >
                    Your Estimates
                  </span>

                  <h2 className="text-foreground font-bold text-[1.7rem] sm:text-[2rem] mb-2">
                    Roofing cost estimates
                  </h2>

                  <p className="text-ink-soft max-w-[55ch] mb-0">
                    Review estimates submitted by your
                    inspector and keep track of their current
                    status.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {estimates.map((estimate) => (
                    <div
                      key={estimate.estimate_id}
                      className="
                        bg-background
                        border
                        border-line
                        rounded-xl
                        p-7
                        shadow-sm
                      "
                    >
                      {/* CARD HEADER */}

                      <div className="flex items-start justify-between gap-4 mb-4">

                        <h3 className="text-foreground font-bold text-[1.1rem] mb-0">
                          Estimate #{estimate.estimate_id}
                        </h3>

                        <span
                          className={`
                            text-[0.72rem]
                            font-semibold
                            uppercase
                            tracking-wider
                            border
                            px-2.5
                            py-1
                            rounded-md
                            ${statusClass(estimate.status)}
                          `}
                        >
                          {estimate.status}
                        </span>

                      </div>

                      {/* DETAILS */}

                      <p className="text-ink-soft text-[0.95rem] leading-relaxed mb-5">
                        {estimate.details}
                      </p>

                      {/* META INFORMATION */}

                      <div className="border-t border-line pt-4 space-y-2">

                        <div className="flex flex-wrap gap-1 text-[0.88rem]">
                          <span className="text-foreground font-semibold">
                            Inspector:
                          </span>

                          <span className="text-ink-soft">
                            {formatName(
                              estimate.inspector_first_name,
                              estimate.inspector_last_name,
                              "Not recorded"
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[0.88rem]">
                          <span className="text-foreground font-semibold">
                            Date:
                          </span>

                          <span className="text-ink-soft">
                            {new Date(
                              estimate.estimate_date
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {estimate.total_amount !== null &&
                          estimate.total_amount !== undefined && (
                            <div className="flex flex-wrap gap-1 text-[0.88rem]">
                              <span className="text-foreground font-semibold">
                                Total:
                              </span>

                              <span className="text-ink-soft font-semibold">
                                {currency.format(Number(estimate.total_amount))}
                              </span>
                            </div>
                          )}

                      </div>

                      {/* YOUR DECISION

                          An approved estimate is one we are ready to stand
                          behind. Accepting it here is what tells us to book
                          the work in — nothing happens until you do. */}

                      {estimate.client_response === "pending" ? (
                        <div className="border-t border-line pt-4 mt-4">
                          <p className="text-ink-soft text-[0.88rem] mb-3">
                            Happy with this quote? Accepting lets us schedule the
                            work. You can still pay in cash or arrange financing
                            with us over the phone.
                          </p>

                          <div className="flex flex-wrap gap-2.5">
                            <button
                              type="button"
                              className="ui-button ui-button--primary"
                              onClick={() =>
                                setPending({ estimate, response: "accepted" })
                              }
                            >
                              Accept estimate
                            </button>

                            <button
                              type="button"
                              className="ui-button ui-button--secondary"
                              onClick={() =>
                                setPending({ estimate, response: "declined" })
                              }
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-line pt-4 mt-4">
                          <p className="text-ink-soft text-[0.88rem] mb-0">
                            You {estimate.client_response} this estimate
                            {estimate.client_responded_at
                              ? ` on ${new Date(
                                  estimate.client_responded_at
                                ).toLocaleDateString()}`
                              : ""}
                            .
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                </div>
              </>
            )}

        </div>
      </section>

      <ConfirmDialog
        open={pending !== null}
        onCancel={() => setPending(null)}
        onConfirm={submitResponse}
        busy={responding}
        destructive={pending?.response === "declined"}
        title={
          pending?.response === "accepted"
            ? "Accept this estimate?"
            : "Decline this estimate?"
        }
        description={
          pending?.response === "accepted"
            ? `You're agreeing to the work quoted on estimate #${pending?.estimate.estimate_id}. We'll call you to arrange a date and to sort out payment or financing. Nothing is charged here.`
            : `We'll mark estimate #${pending?.estimate.estimate_id} as declined. If you'd like it revised, someone will follow up with you.`
        }
        confirmLabel={pending?.response === "accepted" ? "Yes, accept" : "Decline"}
      />
    </>
  );
}