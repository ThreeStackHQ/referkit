import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ReferKit — Referral Programs for Indie SaaS",
  description: "Add a viral referral loop to your SaaS in a weekend.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body className="bg-gray-950 text-gray-100 antialiased">{children}</body></html>);
}
