"use client";
// app/inspector/layout.tsx

import "../globals.css";
import { LayoutDashboard, ClipboardList, User, DollarSign } from "lucide-react";
import { DashboardNav } from "../../components/DashboardNav";
import { RoleGuard } from "../../components/RoleGuard";

const inspectorNavItems = [
  { label: "Dashboard", href: "/inspector/dashboard", icon: LayoutDashboard },
  { label: "Inspections", href: "/inspector/inspections", icon: ClipboardList },
  { label: "Cost Estimate", href: "/inspector/cost-estimate", icon: DollarSign },
  { label: "Profile", href: "/inspector/profile", icon: User },
];

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="min-h-screen bg-[#EAECF0]">
        <DashboardNav roleLabel="Inspector" navItems={inspectorNavItems} />
        <main className="p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}