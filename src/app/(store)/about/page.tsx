import type { Metadata } from "next";
import Link from "next/link";
import { getStoreStats } from "@/lib/queries";
import { getSocialStats } from "@/lib/social-stats";

export const metadata: Metadata = {
  title: "About us",
  description:
    "About SYNAPSE.07 — high-yield exam-preparation PDFs for UPSC CMS, NEET PG, INI-CET, FMGE and state exams.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
      {children}
    </p>
  );
}

export default async function AboutPage() {
  const [stats, social] = await Promise.all([getStoreStats(), getSocialStats()]);

  const proof = [
    {
      value: String(stats.products),
      label: "PDF products",
    },
    {
      value: String(stats.categories),
      label: "Exam categories",
    },
    {
      value: social.youtubeSubscribers || "450+",
      label: "YouTube subscribers",
    },
    {
      value: social.instagramFollowers || "57.8k",
      label: "Instagram followers",
    },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="ambient-hero relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900">
        <div aria-hidden className="ambient-drift" />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <nav className="mb-3 text-sm text-ink-500 dark:text-ink-400">
            <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
              Home
            </Link>{" "}
            / <span className="text-ink-800 dark:text-ink-100">About us</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <Eyebrow>Synapse.07 / Learn · Revise</Eyebrow>
            <h1 className="mb-5 mt-2 text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
              About <span className="text-brand-700 dark:text-brand-300">Synapse.07</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-600 dark:text-ink-300">
              We started SYNAPSE.07 to close a gap we kept seeing: enormous syllabi, scattered
              resources, and no single place to revise exactly what exams actually ask.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              So we do one thing well — high-yield previous-year questions, compiled modules and
              last-revision booklets for UPSC CMS, NEET PG, INI-CET, FMGE and state exams,
              delivered as PDF downloads the moment you pay. Yours to keep for life.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ proof strip */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {proof.map((s) => (
            <div
              key={s.label}
              className="rounded-card border border-ink-200 bg-white px-4 py-5 text-center dark:border-ink-700 dark:bg-ink-800"
            >
              <p className="text-xl font-extrabold leading-none text-brand-700 dark:text-brand-300 md:text-2xl">
                {s.value}
                <span className="text-brand-700 dark:text-brand-300">+</span>
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- founder */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left md:flex-row md:items-start">
            <div className="flex shrink-0 flex-col items-center">
              <span
                aria-hidden
                className="flex h-40 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-4xl font-extrabold tracking-tight text-white shadow-md shadow-brand-700/30 sm:h-32 sm:w-32 md:h-36 md:w-36"
              >
                KN
              </span>
              <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-ink-400 dark:text-ink-500">
                FOUNDER
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <Eyebrow>Founder</Eyebrow>
              <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white sm:text-2xl">
                Kapish Nakum
              </h2>
              <p className="mt-1 text-[13px] font-medium leading-6 text-brand-700 dark:text-brand-300 sm:text-sm">
                Founder, SYNAPSE.07
              </p>
              <p className="mt-4 max-w-2xl text-[13px] leading-6 text-ink-600 dark:text-ink-300 sm:mt-3 sm:text-sm sm:leading-7">
                I run SYNAPSE.07 with one obsession — revision material that respects an
                aspirant&apos;s time. Every PYQ set, compiled module and last-revision booklet is
                picked for what exams actually ask, so you revise more in fewer hours. No fluff,
                no filler — just high-yield notes that reach your inbox the moment you pay.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded border border-ink-200 bg-ink-50 px-3 py-1 text-xs leading-5 text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 sm:px-2.5">
                  UPSC CMS · NEET PG · INI-CET
                </span>
                <span className="rounded border border-ink-200 bg-ink-50 px-3 py-1 text-xs leading-5 text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 sm:px-2.5">
                  FMGE · GPSC · State exams
                </span>
                <span className="rounded border border-ink-200 bg-ink-50 px-3 py-1 text-xs leading-5 text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 sm:px-2.5">
                  India
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
