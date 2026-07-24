"use client";
import Link from "next/link";
import { Package, AlertTriangle, Calculator, ClipboardList } from "lucide-react";
import { mockInventory } from "../admin/mockdata/mockInventory";
import { getStockStatus } from "../admin/types/inventory";

const recentActivity = [
  { id: "1", text: "Estimate submitted for Dana Whitfield — $10,400.00", time: "12 min ago" },
  { id: "2", text: "Ridge Cap Shingles marked Out of Stock", time: "1 hour ago" },
  { id: "3", text: "Added 40 units of Metal Roofing Panels", time: "3 hours ago" },
  { id: "4", text: "Estimate submitted for Marcus Ferreira — $7,120.00", time: "Yesterday" },
];

export default function AdminHomePage() {
  const totalItems = mockInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = mockInventory.filter((item) => {
    const status = getStockStatus(item);
    return status === "Low Stock" || status === "Out of Stock";
  }).length;

  return (
    <div className="flex-1 min-w-0">
      {/* Header Section */}
      <div className="bg-[#233d4d] p-[26px_24px_22px] rounded-b-[16px] mb-5">
        <h1 className="text-[21px] font-extrabold text-white m-0">Admin Dashboard</h1>
        <p className="text-[12px] font-medium text-white/65 mt-[3px] mb-0">Inventory and estimate overview</p>
      </div>

      <div className="px-6 pb-6">
        {/* Stat Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#233d4d] rounded-[10px] p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <Package size={17} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Total Stock</p>
              <p className="text-[19px] font-extrabold text-black m-0">{totalItems.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#fe7f2d] rounded-[10px] p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <AlertTriangle size={17} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Low / Out of Stock</p>
              <p className="text-[19px] font-extrabold text-black m-0">{lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white border border-[#233d4d]/12 border-t-[3px] border-t-[#233d4d] rounded-[10px] p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <ClipboardList size={17} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#233d4d]/60 m-0">Items Tracked</p>
              <p className="text-[19px] font-extrabold text-black m-0">{mockInventory.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Heading */}
        <h2 className="text-[15px] font-bold text-black mb-2.5 mt-0">Quick Actions</h2>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <Link href="/admin/inventory" className="bg-white border-2 border-[#233d4d]/12 rounded-xl p-4 flex items-center gap-3 hover:border-[#233d4d]/30 transition-all">
            <div className="w-10 h-10 rounded-[9px] bg-[#233d4d] flex items-center justify-center text-white flex-shrink-0">
              <Package size={19} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-black m-0">Inventory</p>
              <p className="text-[11px] text-[#233d4d]/60 m-0">View, add, edit stock</p>
            </div>
          </Link>

          <Link href="/admin/cost-estimate" className="bg-white border-2 border-[#233d4d]/12 rounded-xl p-4 flex items-center gap-3 hover:border-[#fe7f2d]/50 transition-all">
            <div className="w-10 h-10 rounded-[9px] bg-[#fe7f2d] flex items-center justify-center text-white flex-shrink-0">
              <Calculator size={19} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-black m-0">Create Estimate</p>
              <p className="text-[11px] text-[#233d4d]/60 m-0">Material &amp; labor cost</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <h2 className="text-[15px] font-bold text-black mb-2.5 mt-0">Recent Activity</h2>
        <div className="bg-white border border-[#233d4d]/12 rounded-xl overflow-hidden">
          {recentActivity.map((item, index) => (
            <div 
              key={item.id} 
              className={`p-3 text-[13px] flex items-center justify-between ${
                index !== recentActivity.length - 1 ? 'border-b border-[#233d4d]/10' : ''
              }`}
            >
              <span className="text-[#233d4d] font-medium">{item.text}</span>
              <span className="text-[11px] text-[#233d4d]/60">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}