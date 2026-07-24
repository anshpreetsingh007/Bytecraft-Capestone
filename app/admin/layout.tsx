"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Calculator, 
  LayoutDashboard, 
  LogOut 
} from "lucide-react";
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex min-h-screen font-sans bg-[#eaecf0]">
      <div className="w-[170px] flex-shrink-0 bg-[#233d4d] p-[22px_14px] flex flex-col justify-between sticky top-0 h-screen">
        <div>
          <div className="text-white text-[15px] font-extrabold tracking-[0.04em] mb-6 px-1.5">
            MARKIT ROOFING
          </div>
          <div className="flex flex-col gap-0.5">
            <Link 
              href="/admin" 
              className={`flex items-center gap-2.5 p-[9px_8px] text-[13px] rounded-md transition-colors ${
                isActive("/admin") 
                  ? "text-[#fe7f2d] bg-[#fe7f2d]/[0.14] border-l-[3px] border-[#fe7f2d]" 
                  : "text-white/65 hover:text-white"
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link 
              href="/admin/inventory" 
              className={`flex items-center gap-2.5 p-[9px_8px] text-[13px] rounded-md transition-colors ${
                isActive("/admin/inventory") 
                  ? "text-[#fe7f2d] bg-[#fe7f2d]/[0.14] border-l-[3px] border-[#fe7f2d]" 
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Package size={18} />
              Inventory
            </Link>

            <Link 
              href="/admin/cost-estimate" 
              className={`flex items-center gap-2.5 p-[9px_8px] text-[13px] rounded-md transition-colors ${
                isActive("/admin/cost-estimate") 
                  ? "text-[#fe7f2d] bg-[#fe7f2d]/[0.14] border-l-[3px] border-[#fe7f2d]" 
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Calculator size={18} />
              Estimate
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-3.5 mt-2 border-t border-white/12 text-[13px] text-[#ff8a7a] cursor-pointer hover:opacity-80 transition-opacity">
          <LogOut size={18} />
          Logout
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}