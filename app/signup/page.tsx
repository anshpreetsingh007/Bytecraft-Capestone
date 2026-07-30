"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import "../auth-form.css";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, { firstName, lastName });
      router.push("/redirecting");
    } catch (err: any) {
      setError(err?.message || "Failed to create account.");
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
          Create Account
        </h1>


        <p className="auth-subtitle">
          Create an account to book inspections.
        </p>

        {error && (
          <p style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="auth-field">
            <label htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <div className="auth-field">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting ? "Creating Account…" : "Create Account"}
          </button>


        </form>

        <p className="auth-switch">

          Already have an account?{" "}

          <Link href="/signin">
            Sign In
          </Link>

        </p>


      </div>

    </main>
  );
}
