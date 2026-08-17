"use client";

import { AdminPageHeader } from "../../../components/AdminPageHeader";
import "../admin-shared.css";

export default function AssignmentPage() {

  return (

    <main className="assignment-page">

      <AdminPageHeader
        eyebrow="Scheduling"
        title="Inspector Assignment"
        subtitle="Assign inspections to available inspectors."
      />


      <div className="assignment-card">

        <h2>
          Pending Inspections
        </h2>


        <div className="assignment-item">

          Customer: John Smith
          <br />

          Address: 123 Main Street

          <select>
            <option>
              Select Inspector
            </option>

            <option>
              Alex Johnson
            </option>

            <option>
              Sarah Smith
            </option>

          </select>


          <button>
            Assign
          </button>


        </div>


      </div>


    </main>

  );

}
