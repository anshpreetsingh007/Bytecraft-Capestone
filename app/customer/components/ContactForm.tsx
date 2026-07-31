"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../../Context/AuthContext";

export default function ContactForm() {
  const { currentUser, role, userId, firstName, lastName } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // inspection_request.client_id is a real foreign key to the client table,
  // so we need an actual signed-in client — not just "someone is logged in."
  const isSignedInClient = !!currentUser && role === "client" && userId !== null;

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!isSignedInClient) return; // the gate below should prevent this, but just in case

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const phone = (formData.get("phone") as string) || "";
    const address = (formData.get("address") as string) || "";
    const service = (formData.get("service") as string) || "";
    const message = (formData.get("message") as string) || "";

    // inspection_request only has a single `details` text column — fold the
    // extra form fields into it, the same convention used by the cost
    // estimate creation flow for its own structured-text fields.
    const details = [
      service && `Service requested: ${service}`,
      address && `Property address: ${address}`,
      phone && `Contact phone: ${phone}`,
      message && `Details: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/inspection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: userId, details }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      setSubmitted(true);
      form.reset();
    } catch (err) {
      console.error("Failed to submit quote request:", err);
      setError("Something went wrong submitting your request. Please try again, or give us a call.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSignedInClient) {
    return (
      <div className="bg-[#FBF3EC] border border-[#E8D9C5] text-[#5B4632] px-[18px] py-6 rounded-[3px] text-[0.95rem]">
        <p className="mb-4">
          Please sign in or create an account to request a free quote — this lets us keep you updated on your
          request and estimate.
        </p>
        <div className="flex gap-4">
          <Link href="/signin" className="underline font-semibold">
            Sign In
          </Link>
          <Link href="/signup" className="underline font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {submitted && (
        <div className="bg-[#EDF3EE] border border-[#B7CDBB] text-[#2F5233] px-[18px] py-4 rounded-[3px] mb-6 text-[0.95rem]">
          Thanks — your request has been received. We&apos;ll be in touch within one business day.
        </div>
      )}
      {error && (
        <div className="bg-[#FBEAEA] border border-[#E3B8B8] text-[#7A2E2E] px-[18px] py-4 rounded-[3px] mb-6 text-[0.95rem]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full name" htmlFor="name">
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={firstName && lastName ? `${firstName} ${lastName}` : ""}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input type="tel" id="phone" name="phone" required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email" full>
            <input
              type="email"
              id="email"
              name="email"
              required
              defaultValue={currentUser?.email ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Property address" htmlFor="address" full>
            <input type="text" id="address" name="address" placeholder="Street, city, state" className={inputClass} />
          </Field>
          <Field label="What do you need?" htmlFor="service" full>
            <select id="service" name="service" className={inputClass} defaultValue="">
              <option value="">Select a service</option>
              <option>Roof Replacement</option>
              <option>Roof Repair / Leak</option>
              <option>Roof Inspection</option>
              <option>Storm Damage Restoration</option>
              <option>Gutter Installation</option>
              <option>Commercial Roofing</option>
              <option>Not sure</option>
            </select>
          </Field>
          <Field label="Tell us about the job" htmlFor="message" full>
            <textarea
              id="message"
              name="message"
              placeholder="Roof age, visible damage, timeline — whatever you know."
              className={`${inputClass} min-h-[120px] resize-y`}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Request Free Quote"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "font-body text-[0.98rem] px-3.5 py-3 border border-line rounded-[3px] bg-white text-foreground w-full focus:outline-none focus:border-navy";

function Field({
  label,
  htmlFor,
  full = false,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 mb-5 ${full ? "sm:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className="font-mono text-[0.74rem] uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}