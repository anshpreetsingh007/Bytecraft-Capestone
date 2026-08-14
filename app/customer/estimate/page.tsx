"use client";

import { useEffect, useState } from "react";
import RoofLine from "../components/RoofLine";
import { useAuth } from "../../../Context/AuthContext";

interface Estimate {
  estimate_id: number;
  order_id: number;
  details: string;
  estimate_date: string;
  status: string;
  client_first_name: string | null;
  client_last_name: string | null;
  inspector_first_name: string | null;
  inspector_last_name: string | null;
}

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

export default function EstimatePage() {
  const { userId } = useAuth();

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEstimates() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/estimates/client/${userId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch estimates");
        }

        const data = await res.json();

        if (!cancelled) {
          setEstimates(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch estimates"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEstimates();

    return () => {
      cancelled = true;
    };
  }, [userId]);

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
              Couldn&apos;t load estimates ({error}). The
              estimate service may not be running — try again
              shortly.
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

                      </div>
                    </div>
                  ))}

                </div>
              </>
            )}

        </div>
      </section>
    </>
  );
}