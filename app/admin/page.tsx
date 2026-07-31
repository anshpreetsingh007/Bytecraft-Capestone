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
    <div className="min-h-screen bg-[#eff3f7] px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="bg-[#233d4d] px-6 py-7 pl-16 sm:px-8 sm:py-8 sm:pl-20 rounded-[18px] mb-6 shadow-sm">
          <h1 className="text-[22px] font-extrabold text-white m-0">Admin Dashboard</h1>
          <p className="text-[12px] font-medium text-white/65 mt-1 mb-0">Inventory and estimate overview</p>
        </div>

        <div className="mx-auto w-full max-w-5xl px-1 sm:px-0">
        {/* Stat Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#233d4d] rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <Package size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Total Stock</p>
              <p className="text-[20px] font-extrabold text-black m-0">{loading ? "..." : totalItems.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#fe7f2d] rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Low / Out of Stock</p>
              <p className="text-[20px] font-extrabold text-black m-0">{loading ? "..." : lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#233d4d] rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Items Tracked</p>
              <p className="text-[20px] font-extrabold text-black m-0">{loading ? "..." : inventory.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Heading */}
        <h2 className="text-[15px] font-bold text-black mb-3 mt-0">Quick Actions</h2>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Link href="/admin/inventory" className="bg-white border-2 border-[#233d4d]/12 rounded-xl p-4 flex items-center gap-3.5 hover:border-[#233d4d]/30 transition-all">
            <div className="w-11 h-11 rounded-[10px] bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-black m-0">Inventory</p>
              <p className="text-[11px] text-[#233d4d]/60 m-0">View, add, edit stock</p>
            </div>
          </Link>

          <Link href="/admin/cost-estimate/select" className="bg-white border-2 border-[#233d4d]/12 rounded-xl p-4 flex items-center gap-3.5 hover:border-[#fe7f2d]/50 transition-all">
            <div className="w-11 h-11 rounded-[10px] bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-black m-0">Create Estimate</p>
              <p className="text-[11px] text-[#233d4d]/60 m-0">Select inspection &amp; calculate</p>
            </div>
          </Link>
        </div>

        <h2 className="text-[15px] font-bold text-black mb-3 mt-0">Recent Estimates</h2>
        <div className="bg-white border border-[#233d4d]/12 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="p-4 text-[13px] text-gray-500">Loading...</div>
          ) : recentEstimates.length === 0 ? (
             <div className="p-4 text-[13px] text-gray-500">No recent estimates.</div>
          ) : (
            recentEstimates.map((item, index) => (
              <div 
                key={item.estimate_id} 
                className={`p-4 text-[13px] flex items-center justify-between ${
                  index !== recentEstimates.length - 1 ? 'border-b border-[#233d4d]/10' : ''
                }`}
              >
                <span className="text-[#233d4d] font-medium">
                  Estimate submitted for {item.first_name} {item.last_name} — {item.status}
                </span>
                <span className="text-[11px] text-[#233d4d]/60">
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
