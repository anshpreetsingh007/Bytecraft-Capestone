"use client";

import "../globals.css";
import AdminSidebar from "../../components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#EAECF0]">
      <AdminSidebar />
      <main className="admin-main flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}