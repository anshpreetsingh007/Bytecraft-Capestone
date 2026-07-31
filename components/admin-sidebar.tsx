"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  Calculator,
  FileText,
  ClipboardList,
  Users,
  Wrench,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../Context/AuthContext";
import "./admin-sidebar.css";

function LadderIcon() {
  return (
    <div className="ladder-icon">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logOut } = useAuth();

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  const links = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },

    {
      name: "Estimates",
      href: "/admin/estimates",
      icon: Calculator,
    },
   
    {
      name: "Reports",
      href: "/admin/reports",
      icon: ClipboardList,
    },
    
  ];

  return (
    <>

      <button
        className="sidebar-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={28} /> : <LadderIcon />}
      </button>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${open ? "show" : ""}`}>
        <h2>MARKIT ROOFING</h2>
        <p className="role">Admin</p>

        <nav>
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={active ? "active" : ""}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <button className="logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}