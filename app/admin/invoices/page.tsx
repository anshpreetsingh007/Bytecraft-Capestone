"use client";

import "./invoice.css";

export default function InvoicePage(){

return (

<main style={{
padding:"40px",
background:"#EAECF0",
minHeight:"100vh"
}}>


<h1>
Invoice Generation
</h1>


<div style={{
background:"white",
padding:"25px",
borderRadius:"16px",
maxWidth:"500px"
}}>


<p>
Customer: John Smith
</p>


<p>
Service: Roof Repair
</p>


<p>
Materials: $1200
</p>


<p>
Labour: $1300
</p>


<h2>
Total: $2500
</h2>


<button className="invoice-button">
    Generate Invoice
</button>


</div>


</main>

);

}