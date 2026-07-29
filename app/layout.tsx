import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Markit-Roofing",
  description: "Authentication App",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}