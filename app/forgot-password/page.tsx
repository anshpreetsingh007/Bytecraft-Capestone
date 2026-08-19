"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../Context/AuthContext";
import { AuthLogo } from "../../components/AuthLogo";
import { AuthHeroPanel } from "../../components/AuthHeroPanel";
import { ThemeToggle } from "../../components/ThemeToggle";
import "../styles/auth.css";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not send the password reset email. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthHeroPanel
        headline="Locked out happens."
        subtext="We'll send a link to get you back into your account."
        imageSrc="/images/roofing.jpg"
      />

      <div className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-form-inner">
          <Link href="/signin" className="auth-back-link">
            <span aria-hidden="true">←</span> Back to sign in
          </Link>

          <div className="auth-logo-wrap">
            <AuthLogo panel="form" />
          </div>

          <h1 className="auth-form-title">Forgot password</h1>
          <p className="auth-form-subtitle">
            Enter the email on your account and we&apos;ll send a link to reset it.
          </p>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {success ? (
            <div className="auth-success" role="status" aria-live="polite">
              Check your email for a password reset link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "forgot-email-error" : undefined}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? "Sending reset link…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}