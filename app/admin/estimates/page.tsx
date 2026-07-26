"use client";

import "./estimates.css";


const estimates = [
  {
    id: 1,
    customer: "John Smith",
    inspector: "Mike Brown",
    amount: "$2500",
    status: "Pending"
  },
  {
    id: 2,
    customer: "Sarah Johnson",
    inspector: "Alex Lee",
    amount: "$1800",
    status: "Pending"
  }
];


export default function EstimatesPage(){

return (

<main className="estimates-page">

<h1>
Pending Estimates
</h1>


<p>
Review inspection estimates waiting for approval.
</p>



<div className="estimate-list">


{estimates.map((estimate)=>(

<div 
className="estimate-card"
key={estimate.id}
>

<h2>
{estimate.customer}
</h2>


<p>
Inspector: {estimate.inspector}
</p>


<p>
Amount: {estimate.amount}
</p>


<span>
{estimate.status}
</span>


<button>
Approve
</button>


</div>


))}


</div>


</main>

);

}