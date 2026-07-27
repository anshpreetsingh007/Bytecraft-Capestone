"use client";

import Link from "next/link";
import InspectorSidebar from "@/components/InspectorSidebar";
import "./inspections.css";


const assignedInspections = [
  {
    id: 1,
    customer: "John Smith",
    address: "123 Calgary Avenue",
    service: "Roof Repair",
    date: "July 30, 2026",
    time: "10:00 AM",
    issue: "Roof leaking after heavy rainfall"
  },
  {
    id: 2,
    customer: "Sarah Johnson",
    address: "456 Edmonton Street",
    service: "General Inspection",
    date: "August 2, 2026",
    time: "1:30 PM",
    issue: "Routine roof inspection"
  }
];


export default function InspectionsPage() {


  return (

    <main className="inspection-page">


      <InspectorSidebar />


      <section className="inspection-content">


        <h1>
          Assigned Inspections
        </h1>


        <p className="subtitle">
          View inspections assigned to you.
        </p>



        <div className="inspection-grid">


          {assignedInspections.map((inspection)=>(


            <div 
              className="inspection-card"
              key={inspection.id}
            >


              <h2>
                {inspection.customer}
              </h2>


              <p>
                <strong>
                  Address:
                </strong>{" "}
                {inspection.address}
              </p>


              <p>
                <strong>
                  Service:
                </strong>{" "}
                {inspection.service}
              </p>


              <p>
                <strong>
                  Date:
                </strong>{" "}
                {inspection.date}
              </p>



              <Link
                href="/inspector/inspection"
                className="inspection-button"
              >
                Start Inspection
              </Link>


            </div>


          ))}


        </div>


      </section>


    </main>

  );
}