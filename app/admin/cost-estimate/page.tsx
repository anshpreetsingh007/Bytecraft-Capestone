"use client";

import { useState, useMemo } from "react";
const laborRatePerSqFt = 2.5; 
import { mockCustomerRequest } from "../mockdata/mockCustomerRequest";
import { MaterialType, EstimateResult } from "../types/estimate";
import "./cost-estimate.css";
import { materialRates } from "../mockdata/materialRates";

function calculateEstimate(
  length: number,
  width: number,
  height: number,
  materialId: MaterialType
): EstimateResult {
  const baseArea = length * width;

  const pitchAdjustedArea = height > 0 ? baseArea * (1 + height * 0.05) : baseArea;

  const squareFootage = Math.round(pitchAdjustedArea * 100) / 100;

  const material = materialRates.find((m) => m.id === materialId) ?? materialRates[0];
  const materialCost = Math.round(squareFootage * material.costPerSqFt * 100) / 100;
  const laborCost = Math.round(squareFootage * laborRatePerSqFt * 100) / 100;
  const total = Math.round((materialCost + laborCost) * 100) / 100;

  return { squareFootage, materialCost, laborCost, total };
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function CostEstimatePage() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [materialId, setMaterialId] = useState<MaterialType>("asphalt-shingle");
  const [submitted, setSubmitted] = useState(false);

  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;

  const result = useMemo(
    () => calculateEstimate(lengthNum, widthNum, heightNum, materialId),
    [lengthNum, widthNum, heightNum, materialId]
  );

  const hasValidInput = lengthNum > 0 && widthNum > 0;

  function handleSubmitEstimate() {
    setSubmitted(true);
  }

  return (
    <div className="estimate-page">
      <h1 className="page-title">Cost Estimate</h1>

      {/* --- Calculation section --- */}
      <section className="calc-card">
        <h2 className="section-title">Calculate Material &amp; Labor Cost</h2>
        <p className="section-subtitle">
          Enter the roof dimensions to calculate square footage and generate a cost estimate.
        </p>

        <div className="calc-grid">
          <div className="calc-field">
            <label htmlFor="length">Length (ft)</label>
            <input
              id="length"
              type="number"
              min="0"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="e.g. 40"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="width">Breadth / Width (ft)</label>
            <input
              id="width"
              type="number"
              min="0"
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="e.g. 25"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="height">Pitch / Height (ft, optional)</label>
            <input
              id="height"
              type="number"
              min="0"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 6"
            />
          </div>

          <div className="calc-field">
            <label htmlFor="material">Material</label>
            <select
              id="material"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value as MaterialType)}
            >
              {materialRates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} (${m.costPerSqFt.toFixed(2)}/sqft)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Live results --- */}
        <div className="calc-results">
          <div className="result-row">
            <span className="result-label">Square Footage</span>
            <span className="result-value">
              {hasValidInput ? `${result.squareFootage.toLocaleString()} sqft` : "—"}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Material Cost</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.materialCost) : "—"}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Labor Cost</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.laborCost) : "—"}
            </span>
          </div>
          <div className="result-row result-row-total">
            <span className="result-label">Total Estimate</span>
            <span className="result-value">
              {hasValidInput ? formatCurrency(result.total) : "—"}
            </span>
          </div>
        </div>
      </section>
      <section className="info-card">
        <h2 className="section-title">Customer Information</h2>

        <div className="info-grid">
          <div className="info-field">
            <span className="info-label">Name</span>
            <span className="info-value">{mockCustomerRequest.customerName}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Address</span>
            <span className="info-value">{mockCustomerRequest.address}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Phone</span>
            <span className="info-value">{mockCustomerRequest.phone}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Email</span>
            <span className="info-value">{mockCustomerRequest.email}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Request Date</span>
            <span className="info-value">
              {new Date(mockCustomerRequest.requestDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="info-field info-field-wide">
            <span className="info-label">Notes</span>
            <span className="info-value">{mockCustomerRequest.notes}</span>
          </div>
        </div>
      </section>

      {submitted && (
        <div className="submit-banner">
          Estimate submitted for {mockCustomerRequest.customerName} — total{" "}
          {formatCurrency(result.total)}.
        </div>
      )}

      <div className="estimate-actions">
        <button className="btn-secondary" onClick={() => setSubmitted(false)} type="button">
          Reset
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmitEstimate}
          disabled={!hasValidInput}
          type="button"
        >
          Submit Estimate
        </button>
      </div>
    </div>
  );
}