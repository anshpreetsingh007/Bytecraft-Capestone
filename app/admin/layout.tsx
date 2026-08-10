"use client";
import "../globals.css";
import { LayoutDashboard, Package, Calculator, FileText, BarChart3 } from "lucide-react";
import { DashboardNav } from "../../components/DashboardNav";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Estimate", href: "/admin/cost-estimate", icon: Calculator },
  { label: "Inspections", href: "/admin/inspection-requests", icon: FileText },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <DashboardNav roleLabel="Admin" navItems={adminNavItems} />
      <main className="p-6">{children}</main>
    </div>
  );
}
