"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Logo from "./Logo";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../Context/AuthContext";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
const links = [
  { href: "/customer", label: "Home" },
  { href: "/customer/services", label: "Services" },
  { href: "/customer/about", label: "About" },
  { href: "/customer/contact", label: "Contact" },
  { href: "/customer/estimate", label: "View Estimate" },
  // Customers could see an estimate but had no way to find out what was
  // happening with the inspection itself.
  { href: "/customer/jobs", label: "My Jobs" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { logOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    await logOut();
    router.push("/signin");
  }

  useEffect(() => {
    if (!accountOpen) return;
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!confirmingLogout) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmingLogout(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmingLogout]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-line">
      <div className="max-w-[1120px] mx-auto px-6 h-[72px] flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[0.95rem] font-medium py-1 whitespace-nowrap ${
                  active ? "text-foreground" : "text-ink-soft hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-copper" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/customer/contact"
            className="bg-navy text-white hover:bg-copper-fill px-5 py-2.5 rounded-[3px] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Get a Free Quote
          </Link>

          <ThemeToggle />

          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label="Account menu"
              className="flex items-center gap-1.5 p-2 rounded-full text-ink-soft hover:text-foreground hover:bg-paper-dim transition-colors"
            >
              <User size={20} />
              <ChevronDown size={14} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-lg border border-line bg-background shadow-lg py-1.5 overflow-hidden"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    setConfirmingLogout(true);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-[#B91C1C] dark:text-red-400 hover:bg-paper-dim transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 text-foreground"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-background px-6 py-5">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 py-2.5 rounded-md text-[0.95rem] font-medium ${
                    active ? "text-foreground bg-paper-dim" : "text-ink-soft hover:bg-paper-dim"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-line">
            <Link
              href="/customer/contact"
              className="text-center bg-navy text-white px-5 py-2.5 rounded-[3px] text-sm font-semibold"
            >
              Get a Free Quote
            </Link>

            <div className="flex items-center justify-between px-1 pt-1">
              <button
                onClick={() => setConfirmingLogout(true)}
                className="flex items-center gap-2 text-sm font-medium text-[#B91C1C] dark:text-red-400 px-2 py-2"
              >
                <LogOut size={16} />
                Sign out
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {confirmingLogout && mounted && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirmingLogout(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl"
          >
            <h2 id="signout-confirm-title" className="text-lg font-bold text-foreground mb-2">
              Sign out?
            </h2>
            <p className="text-sm text-ink-soft mb-6">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmingLogout(false)}
                className="px-4 py-2 rounded text-sm font-semibold text-ink-soft hover:bg-paper-dim transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirmingLogout(false);
                  await handleLogout();
                }}
                className="px-4 py-2 rounded text-sm font-semibold bg-[#B91C1C] text-white hover:bg-[#991B1B] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
