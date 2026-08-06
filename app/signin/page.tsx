"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import "../auth-form.css";

export default function SignInPage() {
  const { logIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await logIn(email, password);
      router.push("/redirecting");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sign in. Check your email and password.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="signin-title"
      >
        <div className="logo-container">
          <img
            src="/images/markit-roofing-white.jpg"
            alt="Markit Roofing"
            className="auth-logo"
          />
        </div>

        <h1 id="signin-title" className="auth-title">
          Sign In
        </h1>

        <p className="auth-subtitle">
          Welcome back. Sign in to continue.
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

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="auth-field">
            <label htmlFor="signin-email">
              Email
            </label>

            <input
              id="signin-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signin-password">
              Password
            </label>

            <div className="password-wrapper">
              <input
                id="signin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                aria-invalid={Boolean(error)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-pressed={showPassword}
                aria-controls="signin-password"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <Link
  href="/forgot-password"
  className="forgot-password-link"
>
  Forgot password?
</Link>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/signup"
          className="signup-link">
            Sign Up
          </Link>
        </p>
      </section>
    </main>
  );
}