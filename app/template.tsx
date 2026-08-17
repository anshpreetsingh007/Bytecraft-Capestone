"use client";

import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      setMounted(true);
      return;
    }

    // Tiny delay so the browser has time to paint the initial state
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  return (
    <div
      className="page-transition-wrap"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0) scale(1)" : "translateY(18px) scale(0.995)",
        transition: mounted
          ? "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
          : "none",
      }}
    >
      {children}
    </div>
  );
}
