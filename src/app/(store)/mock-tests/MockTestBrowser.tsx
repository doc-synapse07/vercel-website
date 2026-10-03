"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileQuestion,
  Search,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { prettyTestTitle } from "@/lib/mock-test-utils";
import type { MockBundle } from "@/lib/mock-tests";

/* ---------------------------------------------------------------- taxonomy
   Everything here is previous-year papers. Facets are derived from titles:
   exam (NEET PG / FMGE / INI-CET / AIIMS / UPSC CMS), year, subject, and a
   grand/mock-test flag. No source-brand names appear anywhere in the UI. */

const EXAMS = [
  { key: "neet-pg", label: "NEET PG", test: /neet[\s-]?pg/ },
  { key: "fmge", label: "FMGE", test: /fmge/ },
  { key: "inicet", label: "INI-CET", test: /ini[\s-]?cet|inicet|aiims/ },
  { key: "upsc", label: "UPSC CMS", test: /upsc/ },
] as const;

type ExamKey = (typeof EXAMS)[number]["key"];

function examOf(title: string): ExamKey | null {
  const lower = title.toLowerCase();
  for (const e of EXAMS) if (e.test.test(lower)) return e.key;
  return null;
}

/** Last 4-digit year in the title (session dates trail the exam name). */
function yearOf(title: string): number | null {
  const fixed = title.replace(/\b2[oO](\d\d)\b/g, "20$1");
  const hits = fixed.match(/(?:19|20)\d{2}/g);
  if (!hits) return null;
  return Number(hits[hits.length - 1]);
}

function isGrandTest(title: string): boolean {
  return /\bgt\b|grand test|\bmock\b/i.test(title);
}

const MONTH_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Sort key from the exam date in the title (newest first). Dateless → last. */
function dateKey(title: string): number {
  const fixed = title.replace(/\b2[oO](\d\d)\b/g, "20$1");
  const ym = fixed.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+((?:19|20)\d{2})/i
  );
  if (ym) {
    const m = MONTH_NUM[ym[1].toLowerCase().slice(0, 3)] ?? 0;
    return Number(ym[2]) * 100 + m;
  }
  const y = fixed.match(/((?:19|20)\d{2})/);
  return y ? Number(y[1]) * 100 : -1;
}

/**
 * Subject-wise slice ("Surgery - AIIMS May 2018", "Ent Inicet Pyq") vs full
 * paper ("AIIMS May 2017", "Ini Cet July 2021"). Rule: the title STARTS WITH
 * a subject token. Dash-splitting alone misses titles like "Ent Inicet Pyq".
 */
function isSubjectSlice(title: string): boolean {
  const first = title.trim().toLowerCase().split(/[^a-z0-9]+/)[0] ?? "";
  if (!first) return false;
  const keys = SUBJECTS.flatMap((s) => s.keywords);
  return keys.some((k) => (k.length <= 3 ? first === k : first.startsWith(k)));
}

const SUBJECTS = [
  { key: "anatomy", label: "Anatomy", bundle: "pyq-anatomy", keywords: ["anatomy", "anat"] },
  { key: "anesthesia", label: "Anesthesia", bundle: "pyq-anesthesia", keywords: ["anesthesia", "anaes"] },
  { key: "biochemistry", label: "Biochemistry", bundle: "pyq-biochemistry", keywords: ["biochem"] },
  { key: "dermatology", label: "Dermatology", bundle: "pyq-dermatology", keywords: ["dermatology", "derma"] },
  { key: "ent", label: "ENT", bundle: "pyq-ent", keywords: ["ent"] },
  { key: "forensic", label: "Forensic Medicine", bundle: "pyq-forensic-medicine", keywords: ["forensic", "fmt", "fm"] },
  { key: "medicine", label: "Medicine", bundle: "pyq-medicine", keywords: ["medicine", "cardio", "neuro", "gastro", "nephro", "hema", "oncology", "pulmo", "rheuma"] },
  { key: "microbiology", label: "Microbiology", bundle: "pyq-microbiology", keywords: ["microbio", "micro"] },
  { key: "ophthalmology", label: "Ophthalmology", bundle: "pyq-ophthalmology", keywords: ["ophthal", "ophthalmology", "opthal"] },
  { key: "orthopedics", label: "Orthopedics", bundle: "pyq-orthopedics", keywords: ["ortho", "orthopedics"] },
  { key: "pathology", label: "Pathology", bundle: "pyq-pathology", keywords: ["patho", "pathology"] },
  { key: "pediatrics", label: "Pediatrics", bundle: "pyq-pediatrics", keywords: ["pedia"] },
  { key: "physiology", label: "Physiology", bundle: "pyq-physiology", keywords: ["physio", "physiology"] },
  { key: "psm", label: "PSM", bundle: "pyq-psm", keywords: ["psm"] },
  { key: "psychiatry", label: "Psychiatry", bundle: "pyq-psychiatry", keywords: ["psychi", "psychiatry"] },
  { key: "radiology", label: "Radiology", bundle: "pyq-radiology", keywords: ["radio", "radiology"] },
  { key: "surgery", label: "Surgery", bundle: "pyq-surgery", keywords: ["surg", "surgery"] },
  { key: "pharmacology", label: "Pharmacology", bundle: "pyq-pharmacology", keywords: ["pharma"] },
  { key: "obg", label: "OBG", bundle: "pyq-obg", keywords: ["obg", "obstetric", "gynae", "gynaec"] },
] as const;

type SubjectKey = (typeof SUBJECTS)[number]["key"];

/** Short keywords match whole words only so "fmge" never tags as forensic. */
function testSubjects(bundleSlug: string, title: string): SubjectKey[] {
  const direct = SUBJECTS.find((s) => s.bundle === bundleSlug);
  if (direct) return [direct.key];
  const lower = ` ${title.toLowerCase()} `;
  return SUBJECTS.filter((s) =>
    s.keywords.some((k) =>
      k.length <= 3
        ? new RegExp(`\\b${k}\\b`).test(lower)
        : new RegExp(`\\b${k}`).test(lower)
    )
  ).map((s) => s.key);
}

function TestRow({
  id,
  title,
  num,
  numQuestions,
  duration,
  totalMarks,
  compact,
}: {
  id: string;
  title: string;
  num: number;
  numQuestions: number;
  duration: number;
  totalMarks: number;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/mock-tests/${id}`}
      className="group flex items-center gap-3 rounded-card border border-ink-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-700/10 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-md bg-brand-700 font-extrabold tabular-nums text-white transition-colors group-hover:bg-brand-800 ${
          compact ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-[13px]"
        }`}
      >
        {compact ? num : String(num).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-semibold text-ink-900 dark:text-white ${
            compact ? "text-[13px]" : "text-sm"
          }`}
          title={title}
        >
          {prettyTestTitle(title)}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500 dark:text-ink-400">
          <span className="inline-flex items-center gap-1">
            <FileQuestion size={12} /> {numQuestions} Qs
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer size={12} /> {duration} min · {totalMarks} marks
          </span>
        </span>
      </span>
      <ArrowRight
        size={16}
        className="shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-700 dark:text-ink-500 dark:group-hover:text-brand-300"
      />
    </Link>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
      {children}
    </p>
  );
}

export function MockTestBrowser({ bundles }: { bundles: MockBundle[] }) {
  const [query, setQuery] = useState("");
  const [exam, setExam] = useState<ExamKey | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [grandOnly, setGrandOnly] = useState(false);
  const [paperType, setPaperType] = useState<"full" | "subject" | null>(null);

  const q = query.trim().toLowerCase();

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const b of bundles)
      for (const t of b.tests) {
        const y = yearOf(t.title);
        if (y) set.add(y);
      }
    return [...set].sort((a, b) => b - a);
  }, [bundles]);

  const stats = useMemo(() => {
    const perSubject = new Map<string, number>();
    const perExam = new Map<string, number>();
    const perYear = new Map<number, number>();
    let grand = 0;
    let total = 0;
    for (const b of bundles) {
      for (const t of b.tests) {
        total++;
        for (const s of testSubjects(b.slug, t.title)) {
          perSubject.set(s, (perSubject.get(s) ?? 0) + 1);
        }
        const e = examOf(t.title);
        if (e) perExam.set(e, (perExam.get(e) ?? 0) + 1);
        const y = yearOf(t.title);
        if (y) perYear.set(y, (perYear.get(y) ?? 0) + 1);
        if (isGrandTest(t.title)) grand++;
      }
    }
    return { perSubject, perExam, perYear, grand, total };
  }, [bundles]);

  const browsing =
    exam !== null ||
    year !== null ||
    subject !== null ||
    grandOnly ||
    paperType !== null ||
    q.length > 0;

  const visible = useMemo(
    () =>
      bundles.map((b) => ({
        ...b,
        tests: b.tests
          .map((t, i) => ({
            ...t,
            num: i + 1,
            subs: testSubjects(b.slug, t.title),
            exam: examOf(t.title),
            year: yearOf(t.title),
            grand: isGrandTest(t.title),
            slice: isSubjectSlice(t.title),
          }))
          .filter(
            (t) =>
              (exam === null || t.exam === exam) &&
              (year === null || t.year === year) &&
              (subject === null ||
                t.subs.includes(subject as (typeof SUBJECTS)[number]["key"])) &&
              (!grandOnly || t.grand) &&
              (paperType === null ||
                (paperType === "subject" ? t.slice : !t.slice)) &&
              (!q || t.title.toLowerCase().includes(q))
          ),
      })),
    [bundles, q, exam, year, subject, grandOnly, paperType]
  );

  const matchCount = visible.reduce((s, b) => s + b.tests.length, 0);

  function reset() {
    setQuery("");
    setExam(null);
    setYear(null);
    setSubject(null);
    setGrandOnly(false);
    setPaperType(null);
  }

  return (
    <div>
      {/* ---------------------------------------------------------- toolbar */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers — try “anatomy”, “NEET 2024”, “AIIMS”…"
            aria-label="Search previous year papers"
            className="w-full rounded-lg border border-ink-300 bg-white py-2.5 pl-10 pr-9 text-sm text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-ink-600 dark:bg-ink-800 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div>
          <FilterLabel>Exam</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {EXAMS.filter((e) => (stats.perExam.get(e.key) ?? 0) > 0).map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => setExam((prev) => (prev === e.key ? null : e.key))}
                aria-pressed={exam === e.key}
                className={`btn btn-sm ${exam === e.key ? "btn-primary" : "btn-outline"}`}
              >
                {e.label} · {stats.perExam.get(e.key) ?? 0}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGrandOnly((v) => !v)}
              aria-pressed={grandOnly}
              className={`btn btn-sm ${grandOnly ? "btn-primary" : "btn-outline"}`}
            >
              <Trophy size={14} /> Grand Tests
            </button>
          </div>
        </div>

        <div>
          <FilterLabel>Paper type</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "full", label: "Full papers" },
                { key: "subject", label: "Subject-wise" },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPaperType((prev) => (prev === p.key ? null : p.key))}
                aria-pressed={paperType === p.key}
                className={`btn btn-sm ${paperType === p.key ? "btn-primary" : "btn-outline"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FilterLabel>Year</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear((prev) => (prev === y ? null : y))}
                aria-pressed={year === y}
                className={`btn btn-sm ${year === y ? "btn-primary" : "btn-outline"}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FilterLabel>{SUBJECTS.length} subjects</FilterLabel>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubject((prev) => (prev === s.key ? null : s.key))}
                aria-pressed={subject === s.key}
                className={`btn btn-sm ${subject === s.key ? "btn-primary" : "btn-outline"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-500 dark:text-ink-400">
            {browsing ? (
              <>
                Showing <strong className="text-ink-800 dark:text-ink-100">{matchCount}</strong> of{" "}
                {stats.total} papers
                {q && (
                  <>
                    {" "}for <strong className="text-ink-800 dark:text-ink-100">“{query.trim()}”</strong>
                  </>
                )}
              </>
            ) : (
              <>
                <strong className="text-ink-800 dark:text-ink-100">{stats.total}</strong> papers
                waiting — pick an exam, year or subject to browse
              </>
            )}
          </p>
          {browsing && (
            <div className="flex gap-2">
              <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- results */}
      {!browsing ? (
        <div className="rounded-card border border-dashed border-ink-300 py-16 text-center dark:border-ink-600">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <ClipboardList size={22} />
          </span>
          <p className="mb-1 text-base font-semibold text-ink-900 dark:text-white">
            Find your paper in seconds
          </p>
          <p className="mx-auto mb-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            Choose an exam, year or subject — or just type in the search box above.
          </p>
        </div>
      ) : matchCount === 0 ? (
        <div className="rounded-card border border-dashed border-ink-300 py-16 text-center dark:border-ink-600">
          <p className="mb-1 text-base font-semibold text-ink-900 dark:text-white">
            No papers match this combination
          </p>
          <p className="mb-5 text-sm text-ink-500 dark:text-ink-400">
            Try a different exam, year or keyword.
          </p>
          <button type="button" onClick={reset} className="btn btn-outline btn-sm">
            Reset filters
          </button>
        </div>
      ) : (
        (() => {
          const flat = visible.flatMap((b) => b.tests.map((t) => ({ ...t, bundle: b.slug })));
          flat.sort((a, b) => {
            const d = dateKey(b.title) - dateKey(a.title);
            if (d !== 0) return d;
            return b.num_questions - a.num_questions;
          });
          const flatQuestions = flat.reduce((n, t) => n + t.num_questions, 0);
          const numbered = flat.map((t, i) => ({ ...t, num: i + 1 }));
          return (
            <div className="overflow-hidden rounded-card border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3.5 dark:border-ink-700">
                <p className="text-sm font-bold text-ink-900 dark:text-white">
                  {flat.length} paper{flat.length === 1 ? "" : "s"} ·{" "}
                  {flatQuestions.toLocaleString("en-IN")} questions
                </p>
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                  FREE
                </span>
              </div>
              <div className="hidden gap-3 p-4 md:grid md:grid-cols-2 xl:grid-cols-3">
                {numbered.map((t) => (
                  <TestRow
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    num={t.num}
                    numQuestions={t.num_questions}
                    duration={t.duration}
                    totalMarks={t.total_marks}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 p-3 md:hidden">
                {numbered.map((t) => (
                  <TestRow
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    num={t.num}
                    numQuestions={t.num_questions}
                    duration={t.duration}
                    totalMarks={t.total_marks}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
