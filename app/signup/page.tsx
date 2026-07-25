"use client";

import Link from "next/link";
import "../auth-form.css";

export default function SignUpPage() {
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
              placeholder="Create a password"
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
            />

          </div>



          <button
            type="submit"
            className="auth-submit"
          >
            Create Account
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
