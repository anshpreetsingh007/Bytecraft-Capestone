"use client";
import { ReactNode } from "react";
import { AuthProvider } from "./Context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}