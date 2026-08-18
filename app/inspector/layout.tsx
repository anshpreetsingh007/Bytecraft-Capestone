"use client";
import "../inspector/styles/inspector.css"

import { ClipboardList, LayoutDashboard } from "lucide-react";

import { DashboardNav, type NavItem } from "../../components/DashboardNav";
import { RoleGuard } from "../../components/RoleGuard";

// The inspector shell previously rendered a navigation bar with nothing in it,
// so the only way around was the browser back button.
const inspectorNavItems: NavItem[] = [
  { label: "My Jobs", href: "/inspector/dashboard", icon: LayoutDashboard },
  { label: "Job Reports", href: "/inspector/reports", icon: ClipboardList },
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
