"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "../Context/AuthContext";

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const { currentUser, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace("/signin");
      return;
    }
    if (!role || !allowedRoles.includes(role)) {
      router.replace("/redirecting");
    }
  }, [currentUser, role, loading, allowedRoles, router]);

  if (!currentUser || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
