"use client";
import "../globals.css";
import "./admin-theme.css";
import {
  LayoutDashboard,
  Package,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  FileText,
  BarChart3,
  ScrollText,
  Shield,
} from "lucide-react";
import { DashboardNav } from "../../components/DashboardNav";
import { RoleGuard } from "../../components/RoleGuard";
import { useAuth } from "../../Context/AuthContext";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Inspections", href: "/admin/inspection-requests", icon: FileText },
  // The approve/reject queue for estimates inspectors have submitted. This
  // was previously reachable only by typing the URL, which left submitted
  // estimates with no way of being actioned.
  { label: "Estimates", href: "/admin/estimates", icon: ClipboardCheck },
  { label: "New Estimate", href: "/admin/cost-estimate", icon: Calculator },
  // Where a finished job gets signed off. Until a job report is reviewed, none
  // of that work reaches the financial reports.
  { label: "Job Reports", href: "/admin/job-reports", icon: ClipboardList },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  const navItems = [...adminNavItems];
  if (role === "super_admin") {
    navItems.push(
      { label: "Super Admin", href: "/admin/superadmin", icon: Shield },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
    );
  }

  return (
    <RoleGuard allowedRoles={["admin", "super_admin"]}>
      <div className="min-h-screen bg-bg">
        <DashboardNav roleLabel={role === "super_admin" ? "Super Admin" : "Admin"} navItems={navItems} />
        {/* `adm` is the hook every rule in admin-theme.css hangs off — it is
            scoped that way so the shared styles outrank the per-page
            stylesheets regardless of CSS chunk order. */}
        <main className="adm">{children}</main>
      </div>
    </RoleGuard>
  );
}
