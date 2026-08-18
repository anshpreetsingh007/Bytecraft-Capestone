"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import { AdminPageHeader } from "../../../../components/AdminPageHeader";
import { api, errorMessage, rows } from "@/lib/api";
import { Banner, SkeletonRows } from "../../../../components/ui";

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

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = await api.get<OrderWithDetails[]>(
                "/api/orders?needsEstimate=true&limit=100",
            );
            setOrders(rows(payload));
        } catch (err) {
            setError(errorMessage(err, "Could not load orders."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const header = (
        <AdminPageHeader
            eyebrow="New estimate"
            title="Select an Order"
            subtitle="Choose an order to build a cost estimate for. Only orders without an estimate are listed — an inspection request has to be converted into an order first."
            chips={loading ? undefined : [{ label: "Awaiting", value: orders.length }]}
        />
    );

    if (loading) {
        return (
            <div className="cost-estimate-page">
                {header}
                <SkeletonRows rows={3} height={190} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="cost-estimate-page">
                {header}
                <Banner title="Could not load orders" detail={error} onRetry={fetchOrders} />
            </div>
        );
    }

    return (
        <div className="cost-estimate-page">
            {header}

            <div className="adm-section-head">
                <h2>Orders awaiting an estimate</h2>
                <hr className="adm-section-line" />
                {orders.length > 0 && <span className="adm-section-count">{orders.length}</span>}
            </div>

            {orders.length === 0 ? (
                <div className="adm-panel adm-feed">
                    <div className="adm-feed-empty">
                        No orders currently need an estimate.{" "}
                        <Link href="/admin/inspection-requests" className="adm-inline-link">
                            Convert an inspection request to an order
                        </Link>{" "}
                        first.
                    </div>
                </div>
            ) : (
                <div className="adm-order-grid">
                    {orders.map((order) => (
                        <article className="adm-order-card" key={order.order_id}>
                            <div className="adm-order-head">
                                <div className="adm-icon adm-icon-sm adm-icon-accent">
                                    <ClipboardList size={16} aria-hidden="true" />
                                </div>
                                <div className="adm-order-title-wrap">
                                    <h3 className="adm-order-title">
                                        {formatName(order.client_first_name, order.client_last_name, "Unknown client")}
                                    </h3>
                                    <span className="adm-order-id">Order #{order.order_id}</span>
                                </div>
                            </div>

                            <dl className="adm-order-meta">
                                <div>
                                    <dt>Address</dt>
                                    <dd>{order.client_address || "—"}</dd>
                                </div>
                                <div>
                                    <dt>Scheduled</dt>
                                    <dd>
                                        {order.request_scheduled_date
                                            ? new Date(order.request_scheduled_date).toLocaleDateString()
                                            : "Not yet scheduled"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Inspector</dt>
                                    <dd>{formatName(order.inspector_first_name, order.inspector_last_name, "Unassigned")}</dd>
                                </div>
                            </dl>

                            {order.request_details && (
                                <p className="adm-order-details">{order.request_details}</p>
                            )}

                            <button
                                type="button"
                                onClick={() => router.push(`/admin/cost-estimate?orderId=${order.order_id}`)}
                                className="btn-accent adm-order-cta"
                            >
                                Build estimate
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
