"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import "../auth-form.css";

// RoleGuard sends users here in two situations:
//   1. They're logged in but visited a page their role doesn't have access to.
//   2. They're authenticated with Firebase but have no matching Postgres
//      record yet (role is null) — e.g. registration hasn't finished, or
//      auth-service was unreachable when we tried to resolve them.
export default function RedirectingPage() {
  const { currentUser, role, loading, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.replace("/signin");
      return;
    }

    switch (role) {
      case "super_admin":
      case "admin":
        router.replace("/admin");
        break;
      case "inspector":
        router.replace("/inspector");
        break;
      case "client":
        // No dedicated client portal yet — send them to the public site for now.
        router.replace("/customer");
        break;
      default:
        // role is null: we couldn't resolve this account to a Postgres record.
        // Leave them on this page with an explanation rather than bouncing
        // them in a redirect loop.
        break;
    }
  }, [currentUser, role, loading, router]);

  if (!loading && currentUser && !role) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">We couldn&apos;t find your account</h1>
          <p className="auth-subtitle">
            You&apos;re signed in, but we couldn&apos;t match your account to a profile.
            This can happen right after signing up, or if something went wrong.
            Try refreshing the page, or sign out and sign back in.
          </p>
          <button className="auth-submit" onClick={() => window.location.reload()}>
            Try again
          </button>
          <p className="auth-switch">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                logOut();
              }}
            >
              Sign out
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-subtitle">Redirecting…</p>
      </div>
    </main>
  );
}
