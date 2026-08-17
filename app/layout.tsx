import type { Metadata, Viewport } from "next";

import "../app/globals.css";
import { Providers } from "./providers";
import ChatbotGate from "../components/ChatbotGate";
import AutoScrollReveal from "../components/AutoScrollReveal";
export const metadata: Metadata = {
  title: "Markit-Roofing",
  description: "Authentication App",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AutoScrollReveal />
          {children}
          <ChatbotGate />
        </Providers>
      </body>
    </html>
  );
}
