import type { MockQuestion } from "./mock-tests";

/** +4 for a correct answer, no negative marking — matches the authored engine. */
export const MARKS_PER_CORRECT = 4;

export function correctLabel(q: MockQuestion): string | null {
  const opt = q.options.find((o) => o.correct);
  if (opt) return opt.label;
  const m = /^([A-Da-d])[\).\s]/.exec(q.correct_answer.trim());
  return m ? m[1].toUpperCase() : null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "Btr Anatomy 28 09 2025 2025 09 27" -> "BTR Anatomy · 28 Sep 2025".
 *
 * Authored titles carry a Btr prefix, lowercase subjects, and the date twice
 * (once DD MM YYYY, once YYYY MM DD). This keeps the first date, drops the
 * duplicate, and normalises known exam tokens — display only, raw titles in
 * data stay untouched.
 */
export function prettyTestTitle(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();

  // Pull trailing date(s): "28 09 2025 [2025 09 27]" or a lone "2025 09 27".
  let dateStr = "";
  const dup = s.match(/(\d{2}) (\d{2}) (\d{4})(?: (\d{4}) (\d{2}) (\d{2}))?$/);
  const solo = dup ? null : s.match(/(\d{4}) (\d{2}) (\d{2})$/);
  if (dup) {
    const [, d, m, y] = dup;
    dateStr = `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
    s = s.slice(0, dup.index).trim();
  } else if (solo) {
    const [, y, m, d] = solo;
    dateStr = `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
    s = s.slice(0, solo.index).trim();
  }

  // Normalise known tokens before title-casing.
  const TOKEN: Record<string, string> = {
    btr: "BTR",
    gt: "GT",
    inicet: "INI-CET",
    neet: "NEET",
    obg: "OBG",
    psm: "PSM",
    ent: "ENT",
    fmt: "FMT",
    ophthal: "Ophthal",
    radio: "Radio",
    ortho: "Ortho",
    surgery: "Surgery",
    pharma: "Pharma",
    path: "Path",
    physio: "Physio",
    respi: "Respi",
    renal: "Renal",
    gi: "GI",
    cvs: "CVS",
    hemat: "Hemat",
    neuro: "Neuro",
    rheumat: "Rheumat",
    endocrine: "Endocrine",
    integrated: "Integrated",
    online: "Online",
    mock: "Mock",
    "e&d": "E&D",
  };
  s = s
    .split(" ")
    .map((w) => {
      const clean = w.replace(/,+$/, "");
      const suffix = w.slice(clean.length);
      const key = clean.toLowerCase();
      if (TOKEN[key]) return TOKEN[key] + suffix;
      if (/^[a-z]/i.test(clean)) return clean[0].toUpperCase() + clean.slice(1) + suffix;
      return w;
    })
    .join(" ")
    .replace(/\s*&\s*/g, " & ");

  return dateStr ? `${s} · ${dateStr}` : s;
}
