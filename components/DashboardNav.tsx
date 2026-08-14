"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../Context/AuthContext";
import "./dashboard-nav.css";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
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

  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href;
    }
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  }

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  return (
    <>
      <header className="topnav">
        {/* LEFT BRAND */}
        <div className="topnav-brand-group">
          {/* White/orange transparent logo — matches the auth pages' logic:
              this topnav is dark navy (per the dashboard screenshots), so
              the same dark-background-safe file used there is correct here
              too. If your topnav background is ever changed to something
              light, swap to the navy/orange version instead. */}
          <Image
            src="/images/SuperMarkit_transparent.png"
            alt="SuperMarkit"
            width={28}
            height={28}
            style={{ display: "block", flexShrink: 0 }}
            priority
          />
          <span className="topnav-brand">
            SUPERMARKIT
          </span>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="topnav-links"
          aria-label={`${roleLabel} navigation`}
        >
          {navItems.map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`topnav-link ${
                  isActive(item)
                    ? "topnav-link-active"
                    : ""
                }`}
              >
                <item.icon
                  size={18}
                  aria-hidden="true"
                />

                <span>{item.label}</span>
              </Link>
            )
          )}
        </nav>

        {/* RIGHT SIDE */}
        <span className="topnav-role topnav-role-right">
          {roleLabel}
        </span>

        <ThemeToggle />

        {/* ONLY ONE DESKTOP LOGOUT BUTTON */}
        <button
          type="button"
          className="topnav-logout"
          onClick={() =>
            setShowLogoutConfirm(true)
          }
        >
          <LogOut
            size={18}
            aria-hidden="true"
          />

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
          <Menu
            size={26}
            aria-hidden="true"
          />
        </button>
      </header>

      {/* =========================
          MOBILE MENU
      ========================= */}

      {mobileOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">

            <div className="mobile-menu-header">
              <div className="mobile-brand-group">
                <Image
                  src="/images/SuperMarkit_transparent.png"
                  alt="SuperMarkit"
                  width={24}
                  height={24}
                  style={{ display: "block", flexShrink: 0 }}
                />
                <span className="topnav-brand">
                  SUPERMARKIT
                </span>

                <span className="topnav-role">
                  {roleLabel}
                </span>
              </div>

              <button
                type="button"
                className="mobile-menu-close"
                onClick={() =>
                  setMobileOpen(false)
                }
                aria-label="Close navigation menu"
              >
                <X
                  size={26}
                  aria-hidden="true"
                />
              </button>
            </div>

            <nav
              className="mobile-menu-links"
              aria-label={`${roleLabel} mobile navigation`}
            >
              {navItems.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className={`mobile-menu-link ${
                      isActive(item)
                        ? "mobile-menu-link-active"
                        : ""
                    }`}
                  >
                    <item.icon
                      size={20}
                      aria-hidden="true"
                    />

                    <span>{item.label}</span>
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
              <LogOut
                size={20}
                aria-hidden="true"
              />

              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================
          LOGOUT CONFIRMATION
      ========================= */}

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div
            className="logout-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <h2 id="logout-title">
              Log out?
            </h2>

            <p id="logout-description">
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
