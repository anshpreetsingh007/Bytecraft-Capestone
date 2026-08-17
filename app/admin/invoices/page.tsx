"use client";

import { AdminPageHeader } from "../../../components/AdminPageHeader";
import "../admin-shared.css";

export default function InvoicePage() {
  return (
    <main className="invoice-page">
      <AdminPageHeader
        eyebrow="Billing"
        title="Invoice Generation"
        subtitle="Preview and generate a customer invoice."
      />

      <div className="invoice-card">
        <div className="invoice-details">
          <p>Customer: John Smith</p>
          <p>Service: Roof Repair</p>
          <p>Materials: $1200</p>
          <p>Labour: $1300</p>
        </div>

        <div className="invoice-total">Total: $2500</div>

        <button className="invoice-button">Generate Invoice</button>
      </div>
    </main>
  );
}
