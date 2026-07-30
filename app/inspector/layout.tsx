"use client";

import InspectorSidebar from "../../components/InspectorSidebar";


export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div>

      <InspectorSidebar />

      <main>
        {children}
      </main>

    </div>

  );
}
