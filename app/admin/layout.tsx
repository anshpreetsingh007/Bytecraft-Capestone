"use client";
import "../globals.css";
import { LayoutDashboard, Package, Calculator, FileText } from "lucide-react";
import { DashboardNav } from "../../components/DashboardNav";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Estimate", href: "/admin/cost-estimate", icon: Calculator },
  { label: "Inspections", href: "/admin/inspection-requests", icon: FileText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EAECF0]">
      <DashboardNav roleLabel="Admin" navItems={adminNavItems} />
      <main className="p-6">{children}</main>
    </div>
  );
}
