import type { Metadata } from "next";
import "./globals.css";

// Only the document shell lives here. The storefront chrome is in (store)/layout.tsx
// and the admin shell is in admin/layout.tsx, so neither leaks into the other.

export const metadata: Metadata = {
  // Required for Open Graph / Twitter image URLs to resolve to absolute links.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "SYNAPSE.07",
  // Default for the storefront; /admin overrides this to noindex.
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Light-theme storefront. The `dark:` utilities across the site stay dormant
  // until `dark` is put back on <html> — nothing to strip, one line to flip.
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}