"use client";

import { useState } from "react";
import "../styles/inspector.css";

export default function CostEstimatePage() {
  const [estimateDate, setEstimateDate] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleGenerateEstimate() {
    setError("");

    const material = Number(materialCost);
    const labour = Number(labourCost);

    if (!estimateDate) {
      setError("Please select an estimate date.");
      return;
    }

    if (!materialCost || !labourCost) {
      setError("Please enter both material and labour costs.");
      return;
    }

    if (
      Number.isNaN(material) ||
      Number.isNaN(labour)
    ) {
      setError("Please enter valid dollar amounts.");
      return;
    }

    if (material < 0 || labour < 0) {
      setError("Costs cannot be negative.");
      return;
    }

    const total = material + labour;

    console.log({
      estimateDate,
      materialCost: material,
      labourCost: labour,
      total,
      notes,
    });
  }

  return (
    <main className="estimate-page">
      <section className="estimate-content">
        <div className="estimate-heading">
          <h1>Cost Estimate</h1>

          <p>
            Create an estimate for the inspection.
          </p>
        </div>

        <div className="estimate-card">
          {error && (
            <p
              className="estimate-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Date */}

          <label htmlFor="estimateDate">
            Estimate Date
          </label>

          <div className="date-input-wrapper">
            <input
              id="estimateDate"
              name="estimateDate"
              type="date"
              value={estimateDate}
              onChange={(event) =>
                setEstimateDate(event.target.value)
              }
            />
          </div>

          {/* Material Cost */}

          <label htmlFor="materialCost">
            Material Cost
          </label>

          <div className="currency-input">
            <span
              className="currency-symbol"
              aria-hidden="true"
            >
              $
            </span>

            <input
              id="materialCost"
              name="materialCost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={materialCost}
              onChange={(event) =>
                setMaterialCost(event.target.value)
              }
            />
          </div>

          {/* Labour Cost */}

          <label htmlFor="labourCost">
            Labour Cost
          </label>

          <div className="currency-input">
            <span
              className="currency-symbol"
              aria-hidden="true"
            >
              $
            </span>

            <input
              id="labourCost"
              name="labourCost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={labourCost}
              onChange={(event) =>
                setLabourCost(event.target.value)
              }
            />
          </div>

          {/* Notes */}

          <label htmlFor="notes">
            Additional Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            placeholder="Enter notes"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />

          <button
            type="button"
            onClick={handleGenerateEstimate}
          >
            Generate Estimate
          </button>
        </div>
      </section>
    </main>
  );
}