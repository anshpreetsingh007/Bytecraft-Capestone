"use client";

import "./request-inspection.css";

export default function RequestInspectionPage() {
  return (
    <main className="request-page">

      <div className="request-card">

        <h1>Request Inspection</h1>

        <p className="subtitle">
          Fill out the form below to schedule a roofing inspection.
        </p>

        <form>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>Property Address</label>
            <input
              type="text"
              placeholder="Enter the property address"
            />
          </div>

          <div className="form-group">
            <label>Roof Type</label>

            <select>
              <option>Asphalt Shingles</option>
              <option>Metal Roofing</option>
              <option>Flat Roof</option>
              <option>Tile Roof</option>
              <option>Other</option>
            </select>

          </div>

          <div className="form-group">
            <label>Preferred Inspection Date</label>
            <input type="date" />
          </div>

          <div className="form-group">
            <label>Describe the Issue</label>

            <textarea
              rows={5}
              placeholder="Describe any leaks, damage, or concerns..."
            ></textarea>

          </div>

          <button type="submit">
            Submit Inspection Request
          </button>

        </form>

      </div>

    </main>
  );
}