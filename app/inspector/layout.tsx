"use client";

import "../globals.css";

import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
} from "lucide-react";

import { DashboardNav } from "../../components/DashboardNav";
import { RoleGuard } from "../../components/RoleGuard";

const inspectorNavItems = [
  {
    label: "Dashboard",
    href: "/inspector/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Inspections",
    href: "/inspector/inspections",
    icon: ClipboardList,
  },
  {
    label: "Cost Estimate",
    href: "/inspector/cost-estimate",
    icon: DollarSign,
  },
];

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["inspector"]}>
      <div className="inspector-shell">
        <DashboardNav
          roleLabel="Inspector"
          navItems={inspectorNavItems}
        />

        <main className="inspector-main">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}