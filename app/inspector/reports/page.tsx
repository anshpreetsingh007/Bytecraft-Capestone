"use client";

import "../styles/inspector.css"


export default function ReportsPage() {

  return (

    <section className="reports-content">

      <h1>
        Inspection Reports
      </h1>


      <p>
        View completed inspection reports here.
      </p>



      <div className="report-card">

        <h2>
          Roof Inspection Report
        </h2>


        <p>
          Customer: John Smith
        </p>


        <p>
          Status: Completed
        </p>


        <button>
          View Report
        </button>


      </div>


    </section>

  );
}