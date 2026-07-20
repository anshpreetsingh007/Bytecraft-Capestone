"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../Context/AuthContext.tsx";
import {
  User,
  Home,
  DollarSign,
  ClipboardList,
  FileText,
  LogOut,
  Bell,
} from "lucide-react";
import "./inspector-sidebar.css";

const navItems = [
  { label: "Profile", href: "/inspector/profile", icon: User },
  { label: "Home", href: "/inspector/dashboard", icon: Home },
  { label: "Cost Estimate", href: "/inspector/cost-estimate", icon: DollarSign },
  { label: "Reports", href: "/inspector/reports", icon: ClipboardList },
  { label: "Inspections", href: "/inspector/inspections", icon: FileText },
];

export function InspectorSidebar() {
  const pathname = usePathname();
  const { currentUser, logOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          {/* Simple abstract mark in the two brand darks — swap for your
              real logo file whenever you have one exported. */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="2" width="6" height="24" rx="1.5" fill="var(--color-accent)" />
            <rect x="14" y="8" width="6" height="18" rx="1.5" fill="var(--color-surface)" />
          </svg>
        </div>
        <button className="sidebar-bell" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>

      <p className="sidebar-username">{currentUser?.email?.split("@")[0] ?? "Inspector"}</p>

      <nav className="sidebar-nav">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
