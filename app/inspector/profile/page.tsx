"use client";

import { InspectorSidebar } from "@/components/InspectorSidebar";


export default function ProfilePage(){

return (

<main className="profile-page">

<InspectorSidebar />


<section>

<h1>
Inspector Profile
</h1>


<div className="profile-card">

<p>
Name: Inspector User
</p>

<p>
Role: Inspector
</p>

<p>
Email: inspector@markit.com
</p>


</div>


</section>


</main>

);

}