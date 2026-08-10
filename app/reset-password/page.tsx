"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { AuthLogo } from "../../components/AuthLogo";
import { AuthHeroPanel } from "../../components/AuthHeroPanel";
import { PasswordInput } from "../../components/PasswordInput";
import { ThemeToggle } from "../../components/ThemeToggle";
import "../../styles/auth.css";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [checkingCode, setCheckingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setCheckingCode(false);
      setCodeValid(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setCodeValid(true);
      })
      .catch(() => {
        setCodeValid(false);
      })
      .finally(() => {
        setCheckingCode(false);
      });
  }, [oobCode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Fill in both fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!oobCode) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setTimeout(() => router.push("/signin"), 2500);
    } catch (err) {
      setError("Something went wrong. The link may have expired — request a new one.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthHeroPanel
        headline="Almost there."
        subtext="Set a new password to get back into your account."
      />

      <div className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-form-inner">
          <div className="auth-logo-wrap">
            <AuthLogo panel="form" />
          </div>

          {checkingCode && <p className="auth-form-subtitle">Checking your reset link...</p>}

          {!checkingCode && !codeValid && (
            <>
              <h1 className="auth-form-title">Link expired</h1>
              <p className="auth-form-subtitle">
                This password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="auth-submit"
                style={{ display: "block", textAlign: "center", textDecoration: "none" }}
              >
                Request a new link
              </Link>
            </>
          )}

          {!checkingCode && codeValid && !success && (
            <>
              <h1 className="auth-form-title">Set a new password</h1>
              <p className="auth-form-subtitle">Resetting password for {email}.</p>

              {error && (
                <div className="auth-error" role="alert" aria-live="assertive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="password">New password</label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
                  {submitting ? "Saving..." : "Save new password"}
                </button>
              </form>
            </>
          )}

          {success && (
            <>
              <h1 className="auth-form-title">Password updated</h1>
              <div className="auth-success" role="status" aria-live="polite">
                Redirecting you to sign in...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
