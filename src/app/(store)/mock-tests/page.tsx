import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, FileQuestion, Timer } from "lucide-react";
import { getMockBundles } from "@/lib/mock-tests";
import { prettyTestTitle } from "@/lib/mock-test-utils";

export const metadata: Metadata = {
  title: "Free Mock Tests",
  description:
    "Free medical practice tests with timer, instant results and explanations — subject tests and grand tests for INI-CET, NEET PG and more.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
      {children}
    </p>
  );
}

export default async function MockTestsPage() {
  const bundles = await getMockBundles();
  const totalTests = bundles.reduce((s, b) => s + b.tests.length, 0);
  const totalQuestions = bundles.reduce(
    (s, b) => s + b.tests.reduce((n, t) => n + t.num_questions, 0),
    0
  );

  return (
    <>
      <section className="ambient-hero relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900">
        <div aria-hidden className="ambient-drift" />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <nav className="mb-3 text-sm text-ink-500 dark:text-ink-400">
            <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
              Home
            </Link>{" "}
            / <span className="text-ink-800 dark:text-ink-100">Mock Tests</span>
          </nav>

          <Eyebrow>
            Free · {totalTests} tests · {totalQuestions.toLocaleString("en-IN")} questions
          </Eyebrow>
          <h1 className="mb-3 mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Practice like it&apos;s the real exam.
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">
            Timed tests with instant scoring and explanations. Pick a test below —
            no account needed, free while in beta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {bundles.map((b) => (
          <div key={b.slug} className="mb-10 last:mb-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                <ClipboardList size={19} />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">
                  {b.title}
                </h2>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {b.tests.length} tests ·{" "}
                  {b.tests.reduce((n, t) => n + t.num_questions, 0).toLocaleString("en-IN")}{" "}
                  questions
                </p>
              </div>
            </div>

            <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
              {b.tests.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/mock-tests/${t.id}`}
                  className="group flex items-center gap-3 rounded-card border border-ink-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-700/10 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-700 text-[13px] font-extrabold tabular-nums text-white transition-colors group-hover:bg-brand-800">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white" title={t.title}>
                      {prettyTestTitle(t.title)}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500 dark:text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <FileQuestion size={12} /> {t.num_questions} Qs
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Timer size={12} /> {t.duration} min · {t.total_marks} marks
                      </span>
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-700 dark:text-ink-500 dark:group-hover:text-brand-300"
                  />
                </Link>
              ))}
            </div>

            {/* Mobile: compact rows */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {b.tests.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/mock-tests/${t.id}`}
                  className="group flex items-center gap-3 rounded-card border border-ink-200 bg-white px-3.5 py-2.5 transition-colors hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-700 text-[11px] font-extrabold tabular-nums text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900 dark:text-white" title={t.title}>
                      {prettyTestTitle(t.title)}
                    </span>
                    <span className="text-[11px] text-ink-500 dark:text-ink-400">
                      {t.num_questions} Qs · {t.duration} min
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-ink-300 group-hover:text-brand-700 dark:text-ink-500" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
