import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css";

export const metadata: Metadata = {
  title: "ByteCraft",
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
      <body>{children}</body>
    </html>
  );
}