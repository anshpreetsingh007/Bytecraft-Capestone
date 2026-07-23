"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import { Logo } from "../../components/Logo";
import "../auth-form.css";


export default function SignInPage() {
  return (
    <main className="signin-container">
      <div className="signin-card">

        <img
          src="/images/markit-logo-white.jpg"
          alt="Markit Roofing"
          className="logo"
        />

        <h1>Sign In</h1>

        <p>Welcome back! Please sign in to continue.</p>

        <input
          type="email"
          placeholder="Email"
        />

        <input
          type="password"
          placeholder="Password"
        />

        <button>
          Sign In
        </button>

        <p>
          Don't have an account?{" "}
          <Link href="/signup">
            Sign up
          </Link>
        </p>

      </div>
    </main>
  );
}