"use client";

import "../globals.css";
import AdminSidebar from "../../components/admin-sidebar";
import NotificationBell from "../../components/notificationBell";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div>

      <AdminSidebar />
      <NotificationBell />

      <main style={{ marginLeft: "260px" }}>
        {children}
      </main>

    </div>

  );
}
