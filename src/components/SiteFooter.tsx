import Link from "next/link";
import { Instagram, Youtube, Send, MessageCircle } from "lucide-react";
import { LEGAL_LINKS } from "@/components/legal/LegalPage";
import type { CategoryNav } from "@/lib/types";

type SocialLink = {
  href: string;
  label: string;
  Icon: typeof Instagram;
};

export function SiteFooter({
  siteName,
  social,
}: {
  siteName: string;
  social: {
    instagramUrl: string;
    youtubeUrl: string;
    telegramUrl: string;
    whatsappUrl: string;
  };
}) {
  const year = new Date().getFullYear();

  // Only show a network when the store owner has actually set its URL.
  const socialLinks: SocialLink[] = [
    { href: social.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: social.youtubeUrl, label: "YouTube", Icon: Youtube },
    { href: social.telegramUrl, label: "Telegram group", Icon: Send },
    { href: social.whatsappUrl, label: "WhatsApp", Icon: MessageCircle },
  ].filter((l) => l.href.trim().length > 0);

  // Top-level destinations only — the full category tree already lives in the header.
  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/mock-tests", label: "Mock Tests" },
    { href: "/cart", label: "Cart" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* ------------------------------------------------------------- top */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-[13px] font-extrabold tracking-tight text-white shadow-md shadow-brand-700/30">
              S7
            </span>
            <span className="text-[19px] font-extrabold leading-none tracking-tight text-ink-900 dark:text-white">
              {siteName.split(".")[0]}
              <span className="text-brand-600 dark:text-brand-400">.07</span>
            </span>
          </Link>

          <nav
            aria-label="Footer"
            className="grid w-full max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-ink-600 dark:text-ink-300 sm:grid-cols-3 lg:w-auto lg:flex lg:flex-wrap lg:items-center lg:justify-start lg:gap-x-6"
          >
            {primaryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-2 lg:justify-end">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                  className="grid h-12 w-12 place-items-center border-2 border-brand-600/40 bg-brand-50/50 text-brand-800 transition-all hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-700 hover:text-white hover:shadow-lg hover:shadow-brand-700/25 dark:border-brand-500/40 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:border-brand-400 dark:hover:bg-brand-400 dark:hover:text-ink-950"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------- policies */}
        <div className="mt-8 border-t border-ink-200 pt-6 dark:border-ink-700">
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-ink-600 dark:text-ink-300"
          >
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="mt-5 text-center text-xs text-ink-500 dark:text-ink-400">
            © {year} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}