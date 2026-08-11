"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertTriangle, Calculator, ClipboardList } from "lucide-react";

export default function AdminHomePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentEstimates, setRecentEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, estRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/estimates")
        ]);
        
        if (invRes.ok) {
          const invData = await invRes.json();
          setInventory(invData);
        }
        
        if (estRes.ok) {
          const estData = await estRes.json();
          setRecentEstimates(estData.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = inventory.filter((item) => {
    return item.quantity <= (item.reorderThreshold || 0);
  }).length;

  return (
    <div className="min-h-screen bg-bg px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="bg-navy px-6 py-7 pl-16 sm:px-8 sm:py-8 sm:pl-20 rounded-[18px] mb-6 shadow-sm">
          <h1 className="text-[22px] font-extrabold text-white m-0">Admin Dashboard</h1>
          <p className="text-[12px] font-medium text-white/65 mt-1 mb-0">Inventory and estimate overview</p>
        </div>

        <div className="mx-auto w-full max-w-5xl px-1 sm:px-0">
        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-surface border border-border border-t-[3px] border-t-navy rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white flex-shrink-0">
              <Package size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted m-0">Total Stock</p>
              <p className="text-[20px] font-extrabold text-ink m-0">{loading ? "..." : totalItems.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-surface border border-border border-t-[3px] border-t-accent rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted m-0">Low / Out of Stock</p>
              <p className="text-[20px] font-extrabold text-ink m-0">{loading ? "..." : lowStockCount}</p>
            </div>
          </div>

          <div className="bg-surface border border-border border-t-[3px] border-t-navy rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white flex-shrink-0">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted m-0">Items Tracked</p>
              <p className="text-[20px] font-extrabold text-ink m-0">{loading ? "..." : inventory.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Heading */}
        <h2 className="text-[15px] font-bold text-ink mb-3 mt-0">Quick Actions</h2>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Link href="/admin/inventory" className="bg-surface border-2 border-border rounded-xl p-4 flex items-center gap-3.5 hover:border-navy transition-all">
            <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center text-white flex-shrink-0">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink m-0">Inventory</p>
              <p className="text-[11px] text-muted m-0">View, add, edit stock</p>
            </div>
          </Link>

          <Link href="/admin/cost-estimate/select" className="bg-surface border-2 border-border rounded-xl p-4 flex items-center gap-3.5 hover:border-accent transition-all">
            <div className="w-11 h-11 rounded-[10px] bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink m-0">Create Estimate</p>
              <p className="text-[11px] text-muted m-0">Select inspection &amp; calculate</p>
            </div>
          </Link>
        </div>

        <h2 className="text-[15px] font-bold text-ink mb-3 mt-0">Recent Estimates</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="p-4 text-[13px] text-muted">Loading...</div>
          ) : recentEstimates.length === 0 ? (
             <div className="p-4 text-[13px] text-muted">No recent estimates.</div>
          ) : (
            recentEstimates.map((item, index) => (
              <div 
                key={item.estimate_id} 
                className={`p-4 text-[13px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
                  index !== recentEstimates.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="text-ink font-medium">
                  Estimate submitted for {item.first_name} {item.last_name} — {item.status}
                </span>
                <span className="text-[11px] text-muted">
                  {new Date(item.estimate_date).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
