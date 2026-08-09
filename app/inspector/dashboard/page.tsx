"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileText } from "lucide-react";
import "../styles/inspector.css";
import { useAuth } from "../../../Context/AuthContext";

export default function InspectorDashboard() {
  const { firstName } = useAuth();

  return (
    <main className="inspector-layout">
     <section className="dashboard-content">

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, {firstName || "Inspector"}
          </h1>

          <p className="dashboard-subtitle">
            Here's a quick overview of your assigned inspections
          </p>
        </div>

        <div
          className="dashboard-roof-image"
          aria-hidden="true"
        />
      </div>


      <div className="dashboard-actions">

    <div className="dashboard-action">

      <div className="dashboard-action-icon">
        <ClipboardList
          size={24}
          aria-hidden="true"
        />
      </div>

      <div className="dashboard-action-content">
        <h2>Assigned Inspections</h2>

        <p>
          Review customer inspections that have
          been assigned to you.
        </p>

        <Link
          href="/inspector/inspections"
          className="dashboard-action-link"
        >
          View Inspections
          <ArrowRight
            size={18}
            aria-hidden="true"
          />
        </Link>
      </div>

    </div>


    <div className="dashboard-action">

      <div className="dashboard-action-icon">
        <FileText
          size={24}
          aria-hidden="true"
        />
      </div>

      <div className="dashboard-action-content">
        <h2>Create Inspection Report</h2>

        <p>
          Document the results of a completed
          roof inspection.
        </p>

        <Link
          href="/inspector/inspection"
          className="dashboard-action-link"
        >
          Start Report
          <ArrowRight
            size={18}
            aria-hidden="true"
          />
        </Link>
      </div>

    </div>

  </div>

</section>
    </main>
  );
}