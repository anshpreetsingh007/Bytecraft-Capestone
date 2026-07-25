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


        {/* Customer Information */}

        <section className="inspection-section">

          <h2>
            Customer Information
          </h2>


          <div className="form-group">
            <label>
              Customer Name
            </label>

            <input 
              type="text"
              placeholder="Enter customer name"
            />
          </div>


          <div className="form-group">
            <label>
              Property Address
            </label>

            <input
              type="text"
              placeholder="Enter property address"
            />
          </div>


          <div className="form-group">
            <label>
              Contact Number
            </label>

            <input
              type="text"
              placeholder="Enter phone number"
            />
          </div>

        </section>



        {/* Inspection Checklist */}

        <section className="inspection-section">

          <h2>
            Inspection Checklist
          </h2>


          <div className="check-item">

            <label>
              Roof Condition
            </label>

            <select>
              <option>
                Select condition
              </option>

              <option>
                Good
              </option>

              <option>
                Needs Repair
              </option>

              <option>
                Critical
              </option>

            </select>

          </div>



          <div className="check-item">

            <label>
              Leaks Found
            </label>

            <select>

              <option>
                Select option
              </option>

              <option>
                Yes
              </option>

              <option>
                No
              </option>

            </select>

          </div>



          <div className="check-item">

            <label>
              Roof Material
            </label>

            <input
              type="text"
              placeholder="Example: Asphalt shingles"
            />

          </div>


        </section>




        {/* Notes */}

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