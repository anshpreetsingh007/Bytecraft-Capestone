"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-line">
      <div className="max-w-[1120px] mx-auto px-7 h-[76px] flex items-center justify-between">
        <Logo />

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2"
        >
          <span className="block w-[22px] h-0.5 bg-foreground my-1.5" />
          <span className="block w-[22px] h-0.5 bg-foreground my-1.5" />
          <span className="block w-[22px] h-0.5 bg-foreground my-1.5" />
        </button>

        <nav
          className={`
            flex-col items-start gap-4 px-7 py-5 absolute top-[76px] left-0 right-0 bg-background border-b border-line
            md:static md:flex md:flex-row md:items-center md:gap-8 md:p-0 md:border-0 md:bg-transparent
            ${open ? "flex" : "hidden md:flex"}
          `}
        >
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`relative text-[0.95rem] font-medium py-1 ${
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
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="bg-navy text-white px-5 py-2.5 rounded-[3px] text-sm font-semibold hover:bg-copper transition-colors"
          >
            Get a Free Quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
