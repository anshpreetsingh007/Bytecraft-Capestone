"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderWithDetails {
    order_id: number;
    client_id: number;
    request_id: number | null;
    order_date: string;
    status: string;
    client_first_name: string | null;
    client_last_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    client_address: string | null;
    request_details: string | null;
    request_scheduled_date: string | null;
    inspector_id: number | null;
    inspector_first_name: string | null;
    inspector_last_name: string | null;
}

function formatName(first: string | null, last: string | null, fallback: string): string {
    if (!first && !last) return fallback;
    return `${first ?? ""} ${last ?? ""}`.trim();
}

export default function SelectInspectionPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch("/api/orders?needsEstimate=true");
                if (!res.ok) throw new Error("Failed to fetch orders");
                const data = await res.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    if (loading) return <div className="p-6">Loading orders...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="flex-1 min-w-0 p-6">
            <h1 className="text-[21px] font-extrabold text-ink mb-2">Select an Order</h1>
            <p className="text-[14px] text-muted mb-6">
                Choose an order to create a cost estimate for. Only orders that don&apos;t already have an estimate
                are shown here — an inspection request has to be converted into an order first.
            </p>

            <div className="grid gap-4">
                {orders.length === 0 ? (
                    <p className="text-muted">
                        No orders currently need an estimate.{" "}
                        <Link href="/admin/inspection-requests" className="text-accent underline font-semibold">
                            Convert an inspection request to an order
                        </Link>{" "}
                        first.
                    </p>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.order_id}
                            className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center hover:border-navy transition-all"
                        >
                            <div>
                                <h3 className="font-bold text-[16px] text-ink m-0">
                                    Order #{order.order_id} — {formatName(order.client_first_name, order.client_last_name, "Unknown client")}
                                </h3>
                                <p className="text-[12px] text-muted m-0">Address: {order.client_address || "—"}</p>
                                <p className="text-[12px] text-muted m-0">
                                    Scheduled: {order.request_scheduled_date ? new Date(order.request_scheduled_date).toLocaleDateString() : "Not yet scheduled"}
                                </p>
                                <p className="text-[12px] text-muted m-0">
                                    Inspector: {formatName(order.inspector_first_name, order.inspector_last_name, "Unassigned")}
                                </p>
                                {order.request_details && (
                                    <p className="text-[13px] mt-1 text-muted">Details: {order.request_details}</p>
                                )}
                            </div>
                            <button
                                onClick={() => router.push(`/admin/cost-estimate?orderId=${order.order_id}`)}
                                className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
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
