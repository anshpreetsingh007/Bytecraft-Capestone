"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";

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
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { logOut } = useAuth();

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  return (
    <>
      <header className="topnav">
        <div className="topnav-brand-group">
          <span className="topnav-brand">
            MARKIT
          </span>

          <span className="topnav-role">
            {roleLabel}
          </span>
        </div>

        {/* DESKTOP NAV */}
        <nav
          className="topnav-links"
          aria-label={`${roleLabel} navigation`}
        >
          {navItems.map(
            ({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`topnav-link ${
                  isActive(href)
                    ? "topnav-link-active"
                    : ""
                }`}
              >
                <Icon
                  size={18}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </Link>
            )
          )}
        </nav>

        {/* DESKTOP LOGOUT */}
        <button
          type="button"
          className="topnav-logout"
          onClick={() =>
            setShowLogoutConfirm(true)
          }
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>

        {/* MOBILE HAMBURGER */}
        <button
          type="button"
          className="topnav-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={26} aria-hidden="true" />
        </button>
      </header>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="topnav-brand-group">
                <span className="topnav-brand">
                  MARKIT
                </span>

                <span className="topnav-role">
                  {roleLabel}
                </span>
              </div>

              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={26} aria-hidden="true" />
              </button>
            </div>

            <nav
              className="mobile-menu-links"
              aria-label={`${roleLabel} mobile navigation`}
            >
              {navItems.map(
                ({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className={`mobile-menu-link ${
                      isActive(href)
                        ? "mobile-menu-link-active"
                        : ""
                    }`}
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                    />

                    <span>{label}</span>
                  </Link>
                )
              )}
            </nav>

            <button
              type="button"
              className="mobile-menu-logout"
              onClick={() => {
                setMobileOpen(false);
                setShowLogoutConfirm(true);
              }}
            >
              <LogOut size={20} aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div
            className="logout-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <h2 id="logout-title">
              Log out?
            </h2>

            <p>
              Are you sure you want to log out of your account?
            </p>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="logout-confirm-button"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}