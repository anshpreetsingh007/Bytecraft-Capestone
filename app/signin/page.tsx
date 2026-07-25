"use client";

import Link from "next/link";
import "../auth-form.css";

export default function SignInPage() {
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


        <form>

          <div className="auth-field">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
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
            />

          </div>


          <button
            type="submit"
            className="auth-submit"
          >
            Sign In
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