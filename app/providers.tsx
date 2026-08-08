"use client";
import { ReactNode } from "react";
import { AuthProvider } from "../Context/AuthContext";
import { ThemeProvider } from "../components/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
