"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, LucideIcon } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import "./dashboard-nav.css";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function DashboardNav({
  roleLabel,
  navItems,
}: {
  roleLabel: string;
  navItems: NavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <header className="topnav">
        <div className="topnav-brand-group">
          <span className="topnav-brand">MARKIT</span>
          <span className="topnav-role">{roleLabel}</span>
        </div>

        <nav className="topnav-links">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`topnav-link ${isActive(href) ? "topnav-link-active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <button className="topnav-logout" onClick={handleLogout} type="button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <button
          className="topnav-hamburger"
          onClick={() => setMobileOpen(true)}
          type="button"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {mobileOpen && (
        <div className="mobile-overlay">
          <div className="mobile-overlay-header">
            <div className="topnav-brand-group">
              <span className="topnav-brand">MARKIT</span>
              <span className="topnav-role">{roleLabel}</span>
            </div>
            <button
              className="mobile-overlay-close"
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close menu"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="mobile-overlay-links">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`mobile-overlay-link ${isActive(href) ? "mobile-overlay-link-active" : ""}`}
              >
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <button
            className="mobile-overlay-logout"
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
            type="button"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );
}
