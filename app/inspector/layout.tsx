"use client";
import "../inspector/styles/inspector.css"

import { DashboardNav, type NavItem } from "../../components/DashboardNav";
import { RoleGuard } from "../../components/RoleGuard";

const inspectorNavItems: NavItem[] = [];

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
