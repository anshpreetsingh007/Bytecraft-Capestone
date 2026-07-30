"use client";

import InspectorSidebar from "../../components/InspectorSidebar";
import { RoleGuard } from "../../components/RoleGuard";


export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (

    <RoleGuard allowedRoles={["inspector"]}>
      <div>

        <InspectorSidebar />

        <main>
          {children}
        </main>

      </div>
    </RoleGuard>

  );

}
