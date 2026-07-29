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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await logIn(email, password);
      // RoleGuard/redirecting page route by role — send everyone through
      // there so the role lookup decides the final destination.
      router.push("/redirecting");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">

      <div className="auth-card">

        <div className="logo-container">
          <img
           src="/images/markit-roofing-white.jpg"
            alt="Markit Roofing"
            className="auth-logo"
          />
        </div>


        <h1 className="auth-title">
          Sign In
        </h1>


        <p className="auth-subtitle">
          Welcome back! Please sign in to continue.
        </p>

        {error && (
          <p style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="auth-field">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>


          <div className="auth-field">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>


          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting ? "Signing In…" : "Sign In"}
          </button>


        </form>


        <p className="auth-switch">
          Don't have an account?{" "}
          <Link href="/signup">
            Sign Up
          </Link>
        </p>


      </div>

    </main>
  );
}
