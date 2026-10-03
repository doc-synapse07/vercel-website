import type { Metadata } from "next";
import Link from "next/link";
import { getMockBundles } from "@/lib/mock-tests";
import { MockTestBrowser } from "./MockTestBrowser";

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
            Timed tests with instant scoring and explanations. Search or pick a
            collection below — no account needed, free while in beta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <MockTestBrowser bundles={bundles} />
      </section>
    </>
  );
}
