"use client";
import { ReactNode } from "react";
import { AuthProvider } from "../Context/AuthContext";
import { ThemeProvider } from "../components/ThemeProvider";
import { ToastProvider } from "../components/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Toasts sit outside AuthProvider so a sign-in failure can still be
          reported through them. */}
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
