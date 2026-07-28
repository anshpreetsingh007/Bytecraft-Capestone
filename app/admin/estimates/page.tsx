"use client";

import { useEffect, useState } from "react";
import "./estimates.css";

export default function EstimatesPage() {
    const [estimates, setEstimates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEstimates();
    }, []);

    async function fetchEstimates() {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3007/api/estimates");
            if (!res.ok) throw new Error("Failed to fetch estimates");
            const data = await res.json();
            setEstimates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(estimateId: number) {
        try {
            const res = await fetch(`http://localhost:3007/api/estimates/${estimateId}/approve`, {
                method: "PATCH"
            });
            if (!res.ok) throw new Error("Failed to approve estimate");
            // Refresh list
            fetchEstimates();
        } catch (err: any) {
            alert(err.message);
        }
    }

    if (loading) return <main className="estimates-page p-6">Loading...</main>;
    if (error) return <main className="estimates-page p-6 text-red-500">Error: {error}</main>;

    const pendingEstimates = estimates.filter(e => e.status === "pending" || e.status === "submitted");

    return (
        <main className="estimates-page">
            <h1>Pending Estimates</h1>
            <p>Review inspection estimates waiting for approval.</p>

            <div className="estimate-list">
                {pendingEstimates.length === 0 ? (
                    <p className="text-gray-500">No pending estimates.</p>
                ) : (
                    pendingEstimates.map((estimate) => (
                        <div className="estimate-card" key={estimate.estimate_id}>
                            <h2>{estimate.first_name} {estimate.last_name}</h2>
                            <p>Inspector: {estimate.inspector_first_name} {estimate.inspector_last_name}</p>
                            <p>Details: {estimate.details}</p>
                            <p>Date: {new Date(estimate.estimate_date).toLocaleDateString()}</p>
                            <span>{estimate.status}</span>
                            
                            <button onClick={() => handleApprove(estimate.estimate_id)}>
                                Approve
                            </button>
                        </div>
                    ))
                )}
            </div>

            <h2 className="mt-8 mb-4 text-xl font-bold">Approved / Past Estimates</h2>
            <div className="estimate-list opacity-75">
                {estimates.filter(e => e.status !== "pending" && e.status !== "submitted").map((estimate) => (
                    <div className="estimate-card" key={estimate.estimate_id}>
                        <h2>{estimate.first_name} {estimate.last_name}</h2>
                        <p>Inspector: {estimate.inspector_first_name} {estimate.inspector_last_name}</p>
                        <p>Details: {estimate.details}</p>
                        <p>Date: {new Date(estimate.estimate_date).toLocaleDateString()}</p>
                        <span className="text-green-600 font-bold">{estimate.status}</span>
                    </div>
                ))}
            </div>
        </main>
    );
}