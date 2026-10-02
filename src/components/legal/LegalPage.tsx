import Link from "next/link";

/**
 * Shared shell for the three legal pages, so they stay consistent and each page
 * only has to supply its own sections.
 */

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/returns", label: "Returns, Refund & Cancellation" },
] as const;

export type LegalSection = {
  /** Small step marker shown to the left of the heading. */
  step?: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  updated,
  sections,
  contact,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
  contact: { email: string; phone: string };
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">{title}</h1>
      <p className="mt-3 text-ink-600 dark:text-ink-300">{summary}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
        Last updated · {updated}
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="flex items-baseline gap-3">
              {section.step && (
                <span className="text-sm font-bold tabular-nums text-brand-700 dark:text-brand-300">
                  {section.step}
                </span>
              )}
              <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
                {section.title}
              </h2>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="flex flex-col gap-1.5">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700 dark:bg-brand-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* ----------------------------------------------------------- contact */}
      <section className="mt-12 rounded-card border border-ink-200 bg-ink-50 p-6 dark:border-ink-700 dark:bg-ink-800">
        <h2 className="text-base font-semibold text-ink-900 dark:text-white">Contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          For any question about this policy, an order, or a privacy request, reach us at:
        </p>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <a
            href={`mailto:${contact.email}`}
            className="font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            Email: {contact.email}
          </a>
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            Phone: {contact.phone}
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------ cross-links */}
      <nav
        aria-label="Other policies"
        className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-200 pt-6 text-sm dark:border-ink-700"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
          Also read
        </span>
        {LEGAL_LINKS.filter((l) => l.href !== `/${eyebrow}`).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-medium text-ink-600 transition-colors hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

