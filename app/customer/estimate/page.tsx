"use client";

import { useEffect, useState } from "react";
import RoofLine from "../components/RoofLine";

interface Estimate {
  estimate_id: number;
  order_id: number;
  details: string;
  estimate_date: string;
  status: string;
  first_name: string;
  last_name: string;
  inspector_first_name: string;
  inspector_last_name: string;
}

const statusStyles: Record<string, string> = {
  approved: "bg-[#EDF3EE] text-[#2F5233] border-[#B7CDBB]",
  rejected: "bg-[#FBEAEA] text-[#8A2C2C] border-[#E7C2C2]",
  pending: "bg-[#FFF3E5] text-[#8A5A1E] border-[#F0D6AE]",
  submitted: "bg-[#FFF3E5] text-[#8A5A1E] border-[#F0D6AE]",
};

function statusClass(status: string) {
  return statusStyles[status?.toLowerCase()] ?? "bg-paper-dim text-ink-soft border-line";
}

export default function EstimatePage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEstimates() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("http://localhost:3007/api/estimates");
        if (!res.ok) throw new Error("Failed to fetch estimates");
        const data = await res.json();
        if (!cancelled) setEstimates(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch estimates"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEstimates();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">
            View Estimate
          </span>
          <h1 className="text-white text-[2rem] sm:text-[2.9rem] max-w-[20ch]">
            Track your cost estimate
          </h1>
          <p className="text-navy-soft max-w-[50ch] mt-4 mb-0">
            Estimates submitted after your inspection show up here once an
            inspector has entered them.
          </p>
        </div>
      </section>

      <RoofLine />

      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          {loading && (
            <p className="text-ink-soft">Loading estimates…</p>
          )}

          {!loading && error && (
            <div className="bg-[#FBEAEA] border border-[#E7C2C2] text-[#8A2C2C] px-[18px] py-4 rounded-[3px] text-[0.95rem]">
              Couldn&apos;t load estimates ({error}). The estimate service
              may not be running — try again shortly.
            </div>
          )}

          {!loading && !error && estimates.length === 0 && (
            <div className="bg-paper-dim border border-line px-[18px] py-4 rounded-[3px] text-[0.95rem] text-ink-soft">
              No estimates yet. Once an inspector submits a cost estimate for
              your inspection, it will appear here.
            </div>
          )}

          {!loading && !error && estimates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {estimates.map((estimate) => (
                <div
                  key={estimate.estimate_id}
                  className="bg-white border border-line rounded-[3px] p-7"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[1.05rem] mb-0">
                      {estimate.first_name} {estimate.last_name}
                    </h3>
                    <span
                      className={`font-mono text-[0.72rem] uppercase tracking-wider border px-2.5 py-1 rounded-[3px] ${statusClass(
                        estimate.status
                      )}`}
                    >
                      {estimate.status}
                    </span>
                  </div>
                  <p className="text-ink-soft text-[0.92rem] mb-2">
                    {estimate.details}
                  </p>
                  <p className="text-ink-soft text-[0.85rem] mb-0">
                    Inspector: {estimate.inspector_first_name}{" "}
                    {estimate.inspector_last_name}
                  </p>
                  <p className="text-ink-soft text-[0.85rem] mb-0">
                    Date: {new Date(estimate.estimate_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
