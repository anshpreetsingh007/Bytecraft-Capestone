"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="topnav-theme-toggle" aria-label="Toggle Theme" disabled>
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isDarkNav = pathname?.startsWith("/admin") || pathname?.startsWith("/inspector") || pathname?.startsWith("/superadmin");

  return (
    <button
      className={`flex items-center justify-center p-2 rounded-full transition-colors ${
        isDarkNav
          ? "text-white/80 hover:bg-white/10"
          : "text-foreground hover:bg-black/5 dark:hover:bg-white/10"
      }`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
      title="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
