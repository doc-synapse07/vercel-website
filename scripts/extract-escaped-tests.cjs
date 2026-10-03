/**
 * Extracts tests from "escaped-docs" bundles (e.g. CEREB_*.html): each file
 * holds N complete HTML documents HTML-escaped and concatenated. Each inner
 * doc is one test with `questions = [{...}]` plus `timeRemaining = M * 60`.
 *
 * Writes data/mock-tests/<bundle>/<testId>.json + appends to index.json.
 *
 * Run with: node scripts/extract-escaped-tests.cjs <input.html> <bundle-slug>
 */
const fs = require("fs");
const path = require("path");

const [inputPath, bundleSlug] = process.argv.slice(2);
if (!inputPath || !bundleSlug) {
  console.error("Usage: node scripts/extract-escaped-tests.cjs <input.html> <bundle-slug>");
  process.exit(1);
}

function fingerprint(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 120).toLowerCase();
}

/**
 * Fingerprints of every question already in the library, so a re-sent HTML
 * (same file twice, renamed file, overlapping bundle) is detected by content
 * — not by filename or generated ids, which change between exports.
 */
function loadLibraryPrints() {
  const prints = new Set();
  const rootPath = path.join(process.cwd(), "data", "mock-tests", "index.json");
  if (!fs.existsSync(rootPath)) return prints;
  const root = JSON.parse(fs.readFileSync(rootPath, "utf8"));
  for (const b of root) {
    for (const t of b.tests) {
      try {
        const full = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), "data", "mock-tests", b.slug, `${t.id}.json`), "utf8")
        );
        for (const q of full.questions) prints.add(fingerprint(q.text));
      } catch {
        /* unreadable entry — ignore */
      }
    }
  }
  return prints;
}

const libraryPrints = loadLibraryPrints();
console.log(`Library fingerprints loaded: ${libraryPrints.size}`);

function unescapeEntities(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Plain-text variant: also decodes &amp; left over inside text content. */
function unescapeText(s) {
  return unescapeEntities(s).replace(/&amp;/g, "&");
}

/**
 * JSON.parse that tolerates generator sloppiness inside strings: literal
 * newlines/tabs and \' escapes (valid JS, invalid JSON).
 */
function tolerantParse(src) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) {
        out += ch;
        esc = false;
      } else if (ch === "\\") {
        if (src[i + 1] === "'") {
          out += "'";
          i++;
        } else {
          out += ch;
          esc = true;
        }
      } else if (ch === '"') {
        inStr = false;
        out += ch;
      } else if (ch === "\n") {
        out += "\\n";
      } else if (ch === "\r") {
        out += "\\r";
      } else if (ch === "\t") {
        out += "\\t";
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return JSON.parse(out);
}

/** Balanced-bracket JSON array scan starting at the '[' at pos. */
function scanArray(src, openIdx) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) return src.slice(openIdx, i + 1);
      }
    }
  }
  throw new Error("Unbalanced brackets in questions array");
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const raw = fs.readFileSync(inputPath, "utf8");
const parts = raw.split("&lt;!DOCTYPE").slice(1);
if (parts.length === 0) throw new Error("No escaped documents found");
console.log(`Found ${parts.length} embedded documents`);

const outDir = path.join(process.cwd(), "data", "mock-tests", bundleSlug);
fs.mkdirSync(outDir, { recursive: true });

const usedIds = new Set();
const index = [];
let totalQ = 0;

parts.forEach((part, di) => {
  const doc = unescapeEntities("&lt;!DOCTYPE" + part);

  const titleM = /<title>([\s\S]*?)<\/title>/i.exec(doc);
  const rawTitle = unescapeText((titleM ? titleM[1] : `Test ${di + 1}`).replace(/\s+/g, " ").trim());

  // All candidate question arrays; keep the biggest real one (skips the
  // single-question "2 + 2" fallback and empty initialisers).
  const candidates = [];
  const re = /questions\s*=\s*\[/g;
  let m;
  while ((m = re.exec(doc)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    try {
      const arrSrc = scanArray(doc, openIdx);
      const arr = tolerantParse(arrSrc);
      if (Array.isArray(arr) && arr.length > 0) candidates.push(arr);
    } catch {
      /* not valid JSON — skip */
    }
  }
  if (candidates.length === 0) throw new Error(`Doc ${di}: no parseable questions array`);
  candidates.sort((a, b) => b.length - a.length);
  const questions = candidates[0];

  const durations = [...doc.matchAll(/timeRemaining\s*=\s*(\d+)\s*\*\s*60/g)].map((x) =>
    Number(x[1])
  );
  const duration = durations.length ? Math.max(...durations) : Math.ceil(questions.length + 10);

  let base = `${bundleSlug}-${slugify(rawTitle)}`;
  let id = base;
  let n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);

  const cleaned = questions.map((q, qi) => {
    if (!q.text || !Array.isArray(q.options) || q.options.length === 0) {
      throw new Error(`Doc ${di} Q${qi}: bad shape`);
    }
    const correctOpt = q.options.find((o) => o.correct);
    if (!correctOpt && !q.correct_answer) {
      throw new Error(`Doc ${di} Q${qi} (${q.id || "?"}): no correct marker`);
    }
    return {
      id: q.id || `${id}-q${qi + 1}`,
      text: q.text,
      raw_text: q.raw_text || q.text,
      options: q.options.map((o) => ({ label: o.label, text: o.text, correct: !!o.correct })),
      correct_answer:
        q.correct_answer ||
        (correctOpt ? `${correctOpt.label}. ${correctOpt.text}` : ""),
      question_images: q.question_images || [],
      explanation_images: q.explanation_images || [],
      explanation: q.explanation || "",
    };
  });

  const numQ = cleaned.length;
  const dupes = cleaned.filter((qq) =>
    libraryPrints.has(fingerprint(qq.text))
  ).length;
  const dupePct = Math.round((dupes / numQ) * 100);
  if (dupePct >= 90) {
    console.log(`  SKIP ${id} | ${numQ}q | ${dupePct}% already in library — duplicate`);
    return;
  }
  if (dupes > 0) console.log(`  NOTE ${id}: ${dupes}/${numQ} questions overlap library`);
  const test = {
    id,
    title: rawTitle,
    num_questions: numQ,
    total_marks: numQ * 4,
    duration,
    time_per_question: Math.round((duration * 60) / numQ),
    questions: cleaned,
  };
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(test));
  totalQ += numQ;
  index.push({
    id: test.id,
    title: test.title,
    num_questions: test.num_questions,
    total_marks: test.total_marks,
    duration: test.duration,
  });
  console.log(`  ${test.id} | ${numQ}q | ${duration}min | ${test.title}`);
});

const indexPath = path.join(process.cwd(), "data", "mock-tests", "index.json");
let root = [];
if (fs.existsSync(indexPath)) root = JSON.parse(fs.readFileSync(indexPath, "utf8"));
root = root.filter((b) => b.slug !== bundleSlug);
root.push({ slug: bundleSlug, tests: index });
fs.writeFileSync(indexPath, JSON.stringify(root));

console.log(`Wrote ${index.length} test files to data/mock-tests/${bundleSlug}/`);
console.log(`Total questions: ${totalQ}`);
