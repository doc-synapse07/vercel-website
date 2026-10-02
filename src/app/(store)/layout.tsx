import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: {
    default: "SYNAPSE.07 — UPSC CMS, NEET PG & INI-CET PDF Notes",
    template: "%s | SYNAPSE.07",
  },
  description:
    "High-yield exam-preparation PDFs for UPSC CMS, NEET PG, INI-CET, FMGE and NORCET. Instant download links delivered to your inbox.",
  keywords: [
    "UPSC CMS notes",
    "NEET PG PYQ",
    "INI-CET PYQ",
    "FMGE notes",
    "NORCET PYQ",
    "medical exam preparation PDF",
  ],
  openGraph: {
    title: "SYNAPSE.07 — Medical Exam Preparation PDFs",
    description:
      "High-yield exam-preparation PDFs for UPSC CMS, NEET PG, INI-CET, FMGE and NORCET.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

/**
 * Storefront chrome lives in this layout, not the root one, so that /admin
 * renders its own header and footer-free shell instead of the shop's.
 */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <CartProvider>
      {/* Scoping hook for the dark-only storefront button/card overrides in
          globals.css. display:contents keeps it out of the flex layout. */}
      <div className="storefront contents">
        <SiteHeader siteName={settings.siteName} />
        <main className="flex-1">{children}</main>
        <SiteFooter
        siteName={settings.siteName}
        social={{
          instagramUrl: settings.instagramUrl,
          youtubeUrl: settings.youtubeUrl,
          telegramUrl: settings.telegramUrl,
          whatsappUrl: settings.whatsappUrl,
        }}
      />
      <CartDrawer />
      </div>
    </CartProvider>
  );
}