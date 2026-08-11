"use client";

import "../globals.css";
import "./admin-layout.css";
import AdminSidebar from "../../components/admin-sidebar";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (

    <div>

      <AdminSidebar />

      <main className="admin-main">
        {children}
      </main>

    </div>

  );

}