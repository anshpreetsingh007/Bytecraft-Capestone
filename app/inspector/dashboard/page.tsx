"use client";

import Link from "next/link";
import "../styles/inspector.css";
import { useAuth } from "../../../Context/AuthContext";

export default function InspectorDashboard() {
  const { firstName } = useAuth();
  return (
    <main className="inspector-layout">
      <section className="dashboard-content">
       <h1 className="dashboard-title">
  Welcome back, {firstName || "Inspector"}!
</h1>

        <p className="dashboard-subtitle">
          Manage your assigned inspections and reports.
        </p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Assigned Inspections</h2>

            <p>
              View customer inspections assigned to you.
            </p>

            <Link
              href="/inspector/inspections"
              className="dashboard-button"
            >
              View Inspections
            </Link>
          </div>

          <div className="dashboard-card">
            <h2>Create Inspection Report</h2>

            <p>
              Complete a roof inspection report.
            </p>

            <Link
              href="/inspector/inspection"
              className="dashboard-button"
            >
              Start Report
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}