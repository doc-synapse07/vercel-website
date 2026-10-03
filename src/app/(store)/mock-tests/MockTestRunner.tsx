"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Eraser,
  Flag,
  LayoutGrid,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { correctLabel, MARKS_PER_CORRECT, prettyTestTitle } from "@/lib/mock-test-utils";
import type { MockTest } from "@/lib/mock-tests";

type Phase = "intro" | "exam" | "result";
type Filter = "all" | "correct" | "wrong" | "skipped";

function fmtTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

function statusOf(
  answer: string | null,
  isMarked: boolean,
  isCorrect: boolean
): "correct" | "wrong" | "skipped" | "marked" {
  if (!answer) return isMarked ? "marked" : "skipped";
  return isCorrect ? "correct" : "wrong";
}

function ReviewPaletteGrid({
  visible,
  pos,
  answers,
  onJump,
  compact,
}: {
  visible: Array<{ q: import("@/lib/mock-tests").MockQuestion; i: number }>;
  pos: number;
  answers: (string | null)[];
  onJump: (p: number) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={`grid gap-1.5 ${compact ? "grid-cols-5" : "grid-cols-8 sm:grid-cols-10"}`}>
        {visible.map(({ q, i }, p) => {
          const mine = answers[i];
          const cls =
            mine == null
              ? "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-300"
              : mine === correctLabel(q)
                ? "bg-green-600 text-white"
                : "bg-red-500 text-white";
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(p)}
              aria-label={`Review question ${i + 1}`}
              className={`flex h-8 items-center justify-center rounded-md text-xs font-bold tabular-nums transition-all ${cls} ${
                p === pos ? "ring-2 ring-brand-500 ring-offset-1" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Correct
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Wrong
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-200 dark:bg-ink-700" /> Skipped
        </span>
      </div>
    </div>
  );
}

export function MockTestRunner({ test }: { test: MockTest }) {
  const totalSeconds = test.duration * 60;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array(test.questions.length).fill(null)
  );
  const [marked, setMarked] = useState<boolean[]>(() => Array(test.questions.length).fill(false));
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [reviewPos, setReviewPos] = useState(0);
  const submittedRef = useRef(false);

  const finish = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPaletteOpen(false);
    setReviewPos(0);
    setPhase("result");
  }, []);

  // Countdown + auto-submit at zero.
  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, finish]);

  // Warn on reload/close mid-exam so a stray refresh doesn't wipe answers.
  useEffect(() => {
    if (phase !== "exam") return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [phase]);

  const summary = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    test.questions.forEach((q, i) => {
      if (!answers[i]) return;
      if (answers[i] === correctLabel(q)) correct++;
      else wrong++;
    });
    const skipped = test.questions.length - correct - wrong;
    const score = correct * MARKS_PER_CORRECT;
    const percent = test.total_marks > 0 ? Math.round((score / test.total_marks) * 100) : 0;
    return { correct, wrong, skipped, score, percent };
  }, [answers, test]);

  const answeredCount = answers.filter(Boolean).length;
  const timeUsed = totalSeconds - timeLeft;
  const urgent = timeLeft <= 5 * 60;

  function choose(label: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = next[index] === label ? null : label;
      return next;
    });
    setConfirmSubmit(false);
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function clearResponse() {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function go(i: number) {
    setIndex(Math.min(test.questions.length - 1, Math.max(0, i)));
    setConfirmSubmit(false);
  }

  function retry() {
    submittedRef.current = false;
    setAnswers(Array(test.questions.length).fill(null));
    setMarked(Array(test.questions.length).fill(false));
    setTimeLeft(totalSeconds);
    setIndex(0);
    setConfirmSubmit(false);
    setFilter("all");
    setPhase("exam");
  }

  /* ---------------------------------------------------------------- intro */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/mock-tests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-300"
        >
          <ArrowLeft size={15} /> All mock tests
        </Link>

        <div className="mt-6 rounded-card border border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-800 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            Free mock test
          </p>
          <h1 className="mx-auto mb-3 mt-2 max-w-xl text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            {prettyTestTitle(test.title)}
          </h1>
          <div className="mx-auto mb-6 flex max-w-md flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-600 dark:text-ink-300">
            <span>
              <strong className="text-ink-900 dark:text-white">{test.num_questions}</strong> questions
            </span>
            <span>
              <strong className="text-ink-900 dark:text-white">{test.total_marks}</strong> marks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} className="text-brand-700 dark:text-brand-300" />
              <strong className="text-ink-900 dark:text-white">{test.duration} min</strong>
            </span>
          </div>
          <ul className="mx-auto mb-8 grid max-w-md gap-2 text-left text-sm text-ink-600 dark:text-ink-300">
            {[
              `+${MARKS_PER_CORRECT} for every correct answer, no negative marking.`,
              "Mark questions for review and jump back from the palette.",
              "The test auto-submits when the timer hits zero.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
                {t}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setPhase("exam")} className="btn btn-primary btn-lg">
            <Play size={16} /> Start test
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- results */
  if (phase === "result") {
    const cards = [
      { label: "Score", value: `${summary.score} / ${test.total_marks}`, cls: "text-brand-700 dark:text-brand-300" },
      { label: "Correct", value: String(summary.correct), cls: "text-green-600" },
      { label: "Wrong", value: String(summary.wrong), cls: "text-red-600" },
      { label: "Skipped", value: String(summary.skipped), cls: "text-ink-400" },
    ];
    const visible = test.questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => {
        const mine = answers[i];
        const st = statusOf(mine, marked[i], mine != null && mine === correctLabel(q));
        if (filter === "correct") return st === "correct";
        if (filter === "wrong") return st === "wrong";
        if (filter === "skipped") return st === "skipped";
        return true;
      });

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-card border border-ink-200 bg-white p-6 text-center dark:border-ink-700 dark:bg-ink-800 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            Results · {prettyTestTitle(test.title)}
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-tight text-ink-900 dark:text-white">
            {summary.percent}
            <span className="text-2xl text-ink-400">%</span>
          </p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {fmtTime(timeUsed)} taken · {answeredCount} of {test.questions.length} attempted
          </p>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-card border border-ink-200 bg-white px-3 py-4 dark:border-ink-700 dark:bg-ink-900">
                <p className={`text-xl font-extrabold ${c.cls}`}>{c.value}</p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  {c.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button type="button" onClick={retry} className="btn btn-primary btn-md">
              <RotateCcw size={15} /> Retry test
            </button>
            <Link href="/mock-tests" className="btn btn-outline btn-md">
              All mock tests
            </Link>
          </div>
        </div>

        <div className="mb-4 mt-8 flex flex-wrap gap-2">
          {(["all", "correct", "wrong", "skipped"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setReviewPos(0);
              }}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
            >
              {f === "all" ? "All questions" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-card border border-dashed border-ink-300 py-10 text-center text-sm text-ink-500 dark:text-ink-400">
            No questions in this group.
          </p>
        ) : (
          (() => {
            const pos = Math.min(reviewPos, visible.length - 1);
            const { q, i } = visible[pos];
            const mine = answers[i];
            const right = correctLabel(q);
            const ok = mine != null && mine === right;
            return (
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">
                    Review {pos + 1} of {visible.length}
                    {filter !== "all" && (
                      <span className="ml-1.5 text-ink-400">· {filter}</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewPos(pos - 1)}
                      disabled={pos === 0}
                      className="btn btn-outline btn-sm"
                    >
                      <ArrowLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewPos(pos + 1)}
                      disabled={pos >= visible.length - 1}
                      className="btn btn-outline btn-sm"
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <article
                  className={`rounded-card border bg-white p-5 dark:bg-ink-800 sm:p-6 ${
                    ok
                      ? "border-green-300 dark:border-green-800"
                      : mine
                        ? "border-red-300 dark:border-red-800"
                        : "border-ink-200 dark:border-ink-700"
                  }`}
                >
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-400">
                    Question {i + 1}
                    {marked[i] && <span className="ml-2 text-amber-600">· marked</span>}
                  </p>
                  <div
                    className="rich-text mb-3 text-[15px] text-ink-900 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: q.raw_text || q.text }}
                  />
                  {q.question_images?.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" loading="lazy" className="mb-3 h-auto max-w-full rounded-lg" />
                  ))}
                  <p className="text-sm">
                    <span className="font-semibold text-ink-700 dark:text-ink-200">Your answer: </span>
                    <span className={ok ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
                      {mine
                        ? `${mine}. ${q.options.find((o) => o.label === mine)?.text ?? ""}`
                        : "Unanswered"}
                    </span>
                  </p>
                  {(!ok || !mine) && right && (
                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-ink-700 dark:text-ink-200">Correct answer: </span>
                      <span className="font-semibold text-green-700">
                        {right}. {q.options.find((o) => o.label === right)?.text ?? ""}
                      </span>
                    </p>
                  )}
                  {q.explanation ? (
                    <div
                      className="rich-text mt-3 border-t border-ink-100 pt-3 text-sm text-ink-700 dark:border-ink-700 dark:text-ink-200"
                      dangerouslySetInnerHTML={{ __html: q.explanation }}
                    />
                  ) : (
                    <p className="mt-3 text-sm text-ink-400">No explanation available.</p>
                  )}
                  {q.explanation_images?.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" loading="lazy" className="mt-2 h-auto max-w-full rounded-lg" />
                  ))}
                </article>

                <div className="mt-3 hidden items-center justify-between gap-3 lg:flex">
                  <button
                    type="button"
                    onClick={() => setReviewPos(pos - 1)}
                    disabled={pos === 0}
                    className="btn btn-outline btn-sm"
                  >
                    <ArrowLeft size={14} /> Prev
                  </button>
                  <p className="text-xs tabular-nums text-ink-400">
                    {pos + 1} / {visible.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewPos(pos + 1)}
                    disabled={pos >= visible.length - 1}
                    className="btn btn-outline btn-sm"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 items-center gap-2 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setReviewPos(pos - 1)}
                    disabled={pos === 0}
                    className="btn btn-outline btn-sm"
                  >
                    <ArrowLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteOpen((v) => !v)}
                    className="btn btn-ghost btn-sm"
                    aria-expanded={paletteOpen}
                  >
                    <LayoutGrid size={14} /> {paletteOpen ? "Hide" : "All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewPos(pos + 1)}
                    disabled={pos >= visible.length - 1}
                    className="btn btn-outline btn-sm"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>

                {paletteOpen && (
                  <div className="mt-3 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800 lg:hidden">
                    <ReviewPaletteGrid
                      visible={visible}
                      pos={pos}
                      answers={answers}
                      onJump={setReviewPos}
                    />
                  </div>
                )}
              </div>

              {/* Right-side palette (desktop) */}
              <aside className="hidden rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800 lg:sticky lg:top-24 lg:block lg:self-start">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
                  Questions
                </p>
                <ReviewPaletteGrid
                  visible={visible}
                  pos={pos}
                  answers={answers}
                  onJump={setReviewPos}
                  compact
                />
              </aside>
            </div>
          );
          })()
        )}
      </div>
    );
  }

  /* ----------------------------------------------------------------- exam */
  const q = test.questions[index];
  const right = correctLabel(q);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* exam header */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-ink-200 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-800">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink-900 dark:text-white" title={test.title}>
            {prettyTestTitle(test.title)}
          </p>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Question {index + 1} of {test.questions.length} · {answeredCount} answered
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
            urgent ? "bg-red-600 text-white" : "bg-ink-100 text-ink-800 dark:bg-ink-700 dark:text-white"
          }`}
        >
          <Clock size={14} /> {fmtTime(timeLeft)}
        </span>
        <button
          type="button"
          onClick={() => setPaletteOpen((v) => !v)}
          className="btn btn-outline btn-sm lg:hidden"
        >
          <LayoutGrid size={14} /> Palette
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* question card */}
        <div className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800 sm:p-6">
          <div
            className="rich-text mb-4 text-[16px] leading-relaxed text-ink-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: q.raw_text || q.text }}
          />
          {q.question_images?.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" loading="lazy" className="mb-4 h-auto max-w-full rounded-lg" />
          ))}

          <div className="flex flex-col gap-2.5">
            {q.options.map((o) => {
              const selected = answers[index] === o.label;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => choose(o.label)}
                  aria-pressed={selected}
                  className={`flex items-start gap-3 rounded-card border px-4 py-3 text-left text-sm transition-all ${
                    selected
                      ? "border-brand-600 bg-brand-50 text-ink-900 dark:border-brand-400 dark:bg-brand-950 dark:text-white"
                      : "border-ink-200 bg-white text-ink-800 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px] font-extrabold ${
                      selected ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200"
                    }`}
                  >
                    {o.label}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{o.text}</span>
                  {selected && <Check size={16} className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={toggleMark} className={`btn btn-sm ${marked[index] ? "btn-primary" : "btn-outline"}`}>
              <Bookmark size={14} /> {marked[index] ? "Marked" : "Mark for review"}
            </button>
            <button type="button" onClick={clearResponse} className="btn btn-ghost btn-sm">
              <Eraser size={14} /> Clear
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-700">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="btn btn-outline btn-sm"
            >
              <ArrowLeft size={14} /> Prev
            </button>
            {index < test.questions.length - 1 ? (
              <button type="button" onClick={() => go(index + 1)} className="btn btn-primary btn-sm">
                Next <ArrowRight size={14} />
              </button>
            ) : confirmSubmit ? (
              <button type="button" onClick={finish} className="btn btn-primary btn-sm">
                <Flag size={14} /> Confirm submit
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmSubmit(true)} className="btn btn-primary btn-sm">
                Submit test
              </button>
            )}
          </div>
          {confirmSubmit && (
            <p className="mt-2 text-right text-xs text-ink-500 dark:text-ink-400">
              {test.questions.length - answeredCount} unanswered — press again to finish.
            </p>
          )}
        </div>

        {/* palette */}
        <aside
          className={`rounded-card border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800 lg:sticky lg:top-24 lg:block lg:self-start ${
            paletteOpen ? "block" : "hidden"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
              Palette
            </p>
            <button
              type="button"
              onClick={() => setPaletteOpen(false)}
              className="rounded-md p-1 text-ink-400 hover:bg-ink-100 lg:hidden"
              aria-label="Close palette"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {test.questions.map((_, i) => {
              const a = answers[i];
              const cls = a
                ? "bg-brand-700 text-white"
                : marked[i]
                  ? "bg-amber-400 text-ink-900"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-200";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    go(i);
                    setPaletteOpen(false);
                  }}
                  aria-label={`Question ${i + 1}${a ? ", answered" : marked[i] ? ", marked" : ""}`}
                  className={`flex h-8 items-center justify-center rounded-md text-xs font-bold tabular-nums transition-all ${cls} ${
                    i === index ? "ring-2 ring-brand-500 ring-offset-1" : ""
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-1 text-[11px] text-ink-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-700" /> Answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Marked for review
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-ink-200 dark:bg-ink-700" /> Not answered
            </span>
          </div>
          <p className="mt-3 hidden text-[11px] leading-relaxed text-ink-400 lg:block">
            Answers save in this page as you go. Refreshing restarts the timer — submit before
            leaving.
          </p>
          {confirmSubmit ? (
            <button type="button" onClick={finish} className="btn btn-primary btn-sm mt-3 w-full">
              <Flag size={14} /> Confirm submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSubmit(true)}
              className="btn btn-outline btn-sm mt-3 w-full"
            >
              Submit test
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
