"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const WHITE_LOGO = "/images/SuperMarkit_transparent.png"; 
const COLOR_LOGO = "/images/SuperMarkit_color.png";       

type AuthLogoProps = {
  panel: "hero" | "form";
};

export function AuthLogo({ panel }: AuthLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 160, height: 40 }} aria-hidden="true" />;
  }

  const src =
    panel === "hero"
      ? WHITE_LOGO
      : resolvedTheme === "dark"
      ? WHITE_LOGO
      : COLOR_LOGO;

  return (
    <Image
      src={src}
      alt="SuperMarkit"
      width={160}
      height={40}
      className="auth-logo-img"
      priority
    />
  );
}
