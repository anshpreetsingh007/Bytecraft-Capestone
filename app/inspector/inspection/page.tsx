"use client";

import "./inspection.css";

export default function InspectionPage() {

  return (
    <main className="inspection-page">

      <div className="inspection-card">

        <h1>
          Inspection Report
        </h1>

        <p className="subtitle">
          Complete the inspection details below.
        </p>


        <section className="inspection-section">

          <h2>
            Customer Information
          </h2>


          <div className="customer-summary">

            <p>
              <strong>Name:</strong> John Smith
            </p>

            <p>
              <strong>Address:</strong> 123 Calgary Avenue
            </p>

            <p>
              <strong>Issue:</strong> Roof leaking after rainfall
            </p>

          </div>

        </section>



        <section className="inspection-section">

          <h2>
            Inspection Checklist
          </h2>


          <label>
            Roof Condition
          </label>

          <select>
            <option>Select condition</option>
            <option>Good</option>
            <option>Needs Repair</option>
            <option>Critical</option>
          </select>


          <label>
            Leaks Found
          </label>

          <select>
            <option>Select option</option>
            <option>Yes</option>
            <option>No</option>
          </select>



          <label>
            Roof Material
          </label>

          <input
            type="text"
            placeholder="Example: Asphalt shingles"
          />


        </section>



        <section className="inspection-section">

          <h2>
            Additional Notes
          </h2>

          <textarea
            placeholder="Enter inspection notes..."
          />

        </section>



        <button className="submit-button">
          Submit Inspection
        </button>


      </div>

    </main>
  );
}
