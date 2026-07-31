"use client";

import "../globals.css";
import AdminSidebar from "../../components/admin-sidebar";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminSidebar />

      <main className="admin-main-content">
        <div className="admin-page-shell">{children}</div>
      </main>
    </div>
  );
}