"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Same two files already verified for the auth pages — no reason to
// maintain a separate "markit-logo-white.png" asset for the header when
// this is the same brand and the same problem (wrong logo for the theme).
const COLOR_LOGO = "/images/SuperMarkit_color.png";       // navy/orange — light backgrounds
const WHITE_LOGO = "/images/SuperMarkit_transparent.png"; // white/orange, transparent — dark backgrounds

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid a flash of the wrong logo before the theme resolves on the client.
  if (!mounted) {
    return <div style={{ width: 140, height: 34 }} aria-hidden="true" />;
  }

  const src = resolvedTheme === "dark" ? WHITE_LOGO : COLOR_LOGO;

  return (
    <Link href="/customer" className="flex items-center shrink-0" aria-label="Markit Roofing home">
      <Image src={src} alt="Markit Roofing" width={140} height={34} priority />
    </Link>
  );
}
