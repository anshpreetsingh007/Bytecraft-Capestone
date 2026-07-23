"use client";

import Link from "next/link";

export default function Signup() {
  return (
    <main className="login-page">
      <div className="login-card">
        
        <h1>Create Account</h1>
        <p>Register for Markit Roofing</p>

        <input
          type="text"
          placeholder="Full Name"
        />

        <input
          type="email"
          placeholder="Email"
        />

        <input
          type="password"
          placeholder="Password"
        />

        <input
          type="password"
          placeholder="Confirm Password"
        />

        

        <button>
          Sign Up
        </button>


        <p>
          Already have an account?{" "}
          <Link href="/signin">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}