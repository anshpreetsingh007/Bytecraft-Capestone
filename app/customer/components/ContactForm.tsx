"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../../Context/AuthContext";


const NAME_ALLOWED = /[^a-zA-Z\s'-]/g;
const PHONE_ALLOWED = /[^0-9]/g;

function handleNameInput(e: React.FormEvent<HTMLInputElement>) {
  const input = e.currentTarget;
  const cleaned = input.value.replace(NAME_ALLOWED, "");
  if (cleaned !== input.value) input.value = cleaned;
}

function handlePhoneInput(e: React.FormEvent<HTMLInputElement>) {
  const input = e.currentTarget;
  const cleaned = input.value.replace(PHONE_ALLOWED, "");
  if (cleaned !== input.value) input.value = cleaned;
}

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  service?: string;
};

export default function ContactForm() {
  const { currentUser, role, userId, firstName, lastName } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  // inspection_request.client_id is a real foreign key to the client table,
  // so we need an actual signed-in client — not just "someone is logged in."
  const isSignedInClient = !!currentUser && role === "client" && userId !== null;

  function clearFieldError(field: keyof FormErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(formData: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!(formData.get("name") as string)?.trim()) {
      errors.name = "Please enter your name.";
    }
    if (!(formData.get("phone") as string)?.trim()) {
      errors.phone = "Please enter your phone number.";
    }
    if (!(formData.get("email") as string)?.trim()) {
      errors.email = "Please enter your email.";
    }
    if (!(formData.get("address") as string)?.trim()) {
      errors.address = "Please enter your property address.";
    }
    if (!(formData.get("service") as string)?.trim()) {
      errors.service = "Please let us know what you need.";
    }
    return errors;
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (!isSignedInClient) return; // the gate below should prevent this, but just in case

    setIsSubmitting(true);
    setError(null);

    const phone = (formData.get("phone") as string) || "";
    const address = (formData.get("address") as string) || "";
    const service = (formData.get("service") as string) || "";
    const message = (formData.get("message") as string) || "";

    // The address and phone have their own columns now, so only the parts
    // with nowhere else to go are folded into `details`.
    const details = [
      service && `Service requested: ${service}`,
      message && `Details: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (details.trim().length < 10) {
      setError("Please tell us a little about what you need, so we know what to quote for.");
      setIsSubmitting(false);
      return;
    }

    try {
      // client_id comes from the verified token server-side; sending it was
      // how anyone could file requests under someone else's account.
      await api.post("/api/inspection-requests", {
        details,
        site_address: address || null,
        contact_phone: phone || null,
      });

      setSubmitted(true);
      form.reset();
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Something went wrong submitting your request. Please try again, or give us a call.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSignedInClient) {
    return (
      <div className="bg-[#FBF3EC] dark:bg-[#2a1f14] border border-[#E8D9C5] dark:border-[#5B4632] text-[#5B4632] dark:text-[#f0d4b8] px-[18px] py-6 rounded-[3px] text-[0.95rem]">
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
        <div className="bg-[#EDF3EE] dark:bg-[#132a17] border border-[#B7CDBB] dark:border-[#2F5233] text-[#2F5233] dark:text-[#8fe0b0] px-[18px] py-4 rounded-[3px] mb-6 text-[0.95rem]">
          Thanks — your request has been received. We&apos;ll be in touch within one business day.
        </div>
      )}
      {error && (
        <div className="bg-[#FBEAEA] dark:bg-[#2a1313] border border-[#E3B8B8] dark:border-[#7A2E2E] text-[#7A2E2E] dark:text-[#f87171] px-[18px] py-4 rounded-[3px] mb-6 text-[0.95rem]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full name" htmlFor="name" error={fieldErrors.name}>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={firstName && lastName ? `${firstName} ${lastName}` : ""}
              onInput={(e) => { handleNameInput(e); clearFieldError("name"); }}
              pattern="[A-Za-z\s'-]*"
              title="Letters only, please — no numbers or symbols."
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" htmlFor="phone" error={fieldErrors.phone}>
            <input
              type="tel"
              id="phone"
              name="phone"
              onInput={(e) => { handlePhoneInput(e); clearFieldError("phone"); }}
              inputMode="numeric"
              pattern="[0-9]*"
              title="Numbers only, please."
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Email" htmlFor="email" full error={fieldErrors.email}>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={currentUser?.email ?? ""}
              onChange={() => clearFieldError("email")}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Property address" htmlFor="address" full error={fieldErrors.address}>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Street, city, state"
              onChange={() => clearFieldError("address")}
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={fieldErrors.address ? "address-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="What do you need?" htmlFor="service" full error={fieldErrors.service}>
            <select
              id="service"
              name="service"
              defaultValue=""
              onChange={() => clearFieldError("service")}
              aria-invalid={Boolean(fieldErrors.service)}
              aria-describedby={fieldErrors.service ? "service-error" : undefined}
              className={inputClass}
            >
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
          className="inline-flex items-center bg-copper-fill hover:bg-copper-fill-hover text-white font-semibold px-[26px] py-3.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {isSubmitting ? "Submitting…" : "Request Free Quote"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "font-body text-[0.98rem] px-3.5 py-3 border border-line rounded-[3px] bg-background text-foreground w-full focus:outline-none focus:border-navy";

function Field({
  label,
  htmlFor,
  full = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 mb-5 ${full ? "sm:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className="text-[0.74rem] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-[0.82rem] font-medium text-[#7A2E2E] dark:text-[#F87171] m-0">
          {error}
        </p>
      )}
    </div>
  );
}
