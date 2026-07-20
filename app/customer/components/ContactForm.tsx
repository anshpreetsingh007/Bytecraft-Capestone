"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    // No backend is wired up yet. In production, replace this block with
    // a fetch() call to your form endpoint (e.g. Formspree, Netlify Forms,
    // or your own API route under app/api/).
    setSubmitted(true);
    form.reset();
  }

  return (
    <div>
      {submitted && (
        <div className="bg-[#EDF3EE] border border-[#B7CDBB] text-[#2F5233] px-[18px] py-4 rounded-[3px] mb-6 text-[0.95rem]">
          Thanks — your request has been received. We&apos;ll be in touch within one business day.
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full name" htmlFor="name">
            <input type="text" id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <input type="tel" id="phone" name="phone" required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email" full>
            <input type="email" id="email" name="email" required className={inputClass} />
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
          className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors"
        >
          Request Free Quote
        </button>
        <p className="text-[0.85rem] text-ink-soft mt-2">
          This form doesn&apos;t send email yet — connect it to a form
          backend (e.g. Formspree or Netlify Forms) or an API route before
          going live.
        </p>
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
      <label
        htmlFor={htmlFor}
        className="font-mono text-[0.74rem] uppercase tracking-wider text-ink-soft"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
