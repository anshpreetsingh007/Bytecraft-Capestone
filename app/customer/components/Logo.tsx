"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const COLOR_LOGO = "/images/SuperMarkit_color.png"; 
const WHITE_LOGO = "/images/SuperMarkit_transparent.png";

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 140, height: 34 }} aria-hidden="true" />;
  }

  const src = resolvedTheme === "dark" ? WHITE_LOGO : COLOR_LOGO;

  return (
    <Link href="/customer" className="flex items-center shrink-0" aria-label="Markit Roofing home">

      <Image
        src={src}
        alt="Markit Roofing"
        width={100}
        height={88}
        className="h-8"
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
    </Link>
  );
}
