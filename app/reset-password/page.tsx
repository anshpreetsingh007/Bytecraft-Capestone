"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../Context/AuthContext";
import "../auth-form.css";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "We could not send the password reset email.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="forgot-password-title"
      >
        <Link href="/signin" className="auth-back">
          <span aria-hidden="true">←</span>
          Back to sign in
        </Link>

        <div className="logo-container">
          <img
            src="/images/markit-roofing-white.jpg"
            alt="Markit Roofing"
            className="auth-logo"
          />
        </div>

        <h1
          id="forgot-password-title"
          className="auth-title"
        >
          Forgot Password
        </h1>

        <p className="auth-subtitle">
          Enter your email address and we will send you
          a link to reset your password.
        </p>

        {error && (
          <div
            className="auth-error"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="auth-success"
            role="status"
            aria-live="polite"
          >
            Check your email for a password reset link.
            The message may take a few minutes to arrive.
          </div>
        )}

        {!success && (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="reset-email">
                Email
              </label>

              <input
                id="reset-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting
                ? "Sending reset link…"
                : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remembered your password?{" "}
          <Link href="/signin">
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}