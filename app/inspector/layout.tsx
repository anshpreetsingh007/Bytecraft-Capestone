"use client";

import InspectorSidebar from "../../components/InspectorSidebar";

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inspector-layout">
      <InspectorSidebar />
      <main className="inspector-content">
        {children}
      </main>
    </div>
  );
}