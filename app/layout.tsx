import type { Metadata } from "next";

import "../app/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Markit-Roofing",
  description: "Authentication App",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
