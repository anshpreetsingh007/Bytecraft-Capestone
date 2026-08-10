"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import { AuthLogo } from "../../components/AuthLogo";
import { AuthHeroPanel } from "../../components/AuthHeroPanel";
import { PasswordInput } from "../../components/PasswordInput";
import { ThemeToggle } from "../../components/ThemeToggle";
import "../styles/auth.css";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { logIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await logIn(email, password);
      router.push("/redirecting");
    } catch (err) {
      setError("Incorrect email or password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthHeroPanel
        headline="Everything roofing, in one place."
        subtext="From booking to inspection to job tracking — all in sync, all in real time."
        // Files in /public are served from the site root, not a relative
        // path — "../public/images/..." would 404. Fixed to "/images/...".
        imageSrc="/images/roofing.jpg"
      />

      <div className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-form-inner">
          <div className="auth-logo-wrap">
            <AuthLogo panel="form" />
          </div>

          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-subtitle">Sign in to pick up where you left off.</p>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            </div>

            <Link href="/forgot-password" className="auth-forgot-link">
              Forgot password?
            </Link>

            <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            New customer? <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
