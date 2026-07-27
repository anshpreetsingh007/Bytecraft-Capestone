"use client";

import "./reports.css";

export default function ReportsPage() {

  return (

    <main className="reports-page">

      <h1>
        Reports Dashboard
      </h1>


      <div className="reports-grid">


        <div className="report-card">

          <h2>
            Inspection Overview
          </h2>

          <p>
            Total Inspections: 35
          </p>

          <p>
            Completed: 28
          </p>

          <p>
            Pending: 7
          </p>

        </div>



        <div className="report-card">

          <h2>
            Revenue Overview
          </h2>

          <p>
            Monthly Revenue: $25,000
          </p>

        </div>



        <div className="report-card">

          <h2>
            Inspector Activity
          </h2>

          <p>
            Active Inspectors: 6
          </p>

          <p>
            Average Inspections: 12/month
          </p>

        </div>


      </div>


    </main>

  );

}