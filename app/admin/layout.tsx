"use client";

import "../globals.css";
import AdminSidebar from "../../components/admin-sidebar";
import NotificationBell from "../../components/notificationBell";
import { RoleGuard } from "../../components/RoleGuard";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div>

      <AdminSidebar />

      <main style={{ marginLeft: "260px" }}>
        {children}
      </main>

    </div>

  );
}