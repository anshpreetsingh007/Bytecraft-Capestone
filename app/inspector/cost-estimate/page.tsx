"use client";

import { InspectorSidebar } from "@/components/InspectorSidebar";
import "./cost-estimate.css";


export default function CostEstimatePage() {

return (

<main className="estimate-page">

<InspectorSidebar />

<section className="estimate-content">

<h1>
Cost Estimate
</h1>

<p>
Create an estimate for the inspection.
</p>


<div className="estimate-card">


<label>
Material Cost
</label>

<input
type="number"
placeholder="Enter material cost"
/>



<label>
Labour Cost
</label>

<input
type="number"
placeholder="Enter labour cost"
/>



<label>
Additional Notes
</label>

<textarea
placeholder="Enter notes"
/>


<button>
Generate Estimate
</button>


</div>


</section>

</main>

);

}