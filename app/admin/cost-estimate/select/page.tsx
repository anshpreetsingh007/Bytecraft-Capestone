"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InspectionRequest {
    request_id: number;
    client_id: number;
    status: string;
    details: string;
    scheduled_date: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
}

export default function SelectInspectionPage() {
    const [requests, setRequests] = useState<InspectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch("http://localhost:3007/api/inspection-requests");
                if (!res.ok) throw new Error("Failed to fetch inspection requests");
                const data = await res.json();
                setRequests(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchRequests();
    }, []);

    if (loading) return <div className="p-6">Loading inspection requests...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="flex-1 min-w-0 p-6">
            <h1 className="text-[21px] font-extrabold text-black mb-2">Select Inspection Request</h1>
            <p className="text-[14px] text-gray-600 mb-6">Choose an inspection request to create a cost estimate for.</p>

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <p className="text-gray-500">No pending inspection requests.</p>
                ) : (
                    requests.map(req => (
                        <div key={req.request_id} className="bg-white border border-[#233d4d]/12 rounded-xl p-4 flex justify-between items-center hover:border-[#233d4d]/30 transition-all">
                            <div>
                                <h3 className="font-bold text-[16px] m-0">{req.first_name} {req.last_name}</h3>
                                <p className="text-[12px] text-gray-500 m-0">Address: {req.address}</p>
                                <p className="text-[12px] text-gray-500 m-0">Date: {new Date(req.scheduled_date).toLocaleDateString()}</p>
                                <p className="text-[13px] mt-1 text-gray-700">Details: {req.details}</p>
                            </div>
                            <button
                                onClick={() => router.push(`/admin/cost-estimate?requestId=${req.request_id}`)}
                                className="bg-[#fe7f2d] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e06d20] transition-colors"
                            >
                                Select
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
