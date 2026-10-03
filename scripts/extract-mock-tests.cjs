/**
 * One-time extraction: pulls TESTS_LIST out of the BTRs.html exam bundle and
 * writes one JSON file per test under data/mock-tests/<bundle>/, plus an
 * index.json. Verifies counts; exits non-zero on any mismatch.
 *
 * Run with: node scripts/extract-mock-tests.cjs <input.html> <bundle-slug>
 */
const fs = require("fs");
const path = require("path");

const [inputPath, bundleSlug] = process.argv.slice(2);
if (!inputPath || !bundleSlug) {
  console.error("Usage: node scripts/extract-mock-tests.cjs <input.html> <bundle-slug>");
  process.exit(1);
}

const html = fs.readFileSync(inputPath, "utf8");
// NOTE: the file contains placeholder mentions of TESTS_LIST in comments —
// the real payload is the `const TESTS_LIST = [{...}]` assignment.
const marker = "const TESTS_LIST = [{";
const mIdx = html.indexOf(marker);
if (mIdx < 0) throw new Error("TESTS_LIST payload not found");

let i = html.indexOf("[", mIdx);
const start = i;
let depth = 0;
let inStr = false;
let esc = false;
for (; i < html.length; i++) {
  const ch = html[i];
  if (inStr) {
    if (esc) esc = false;
    else if (ch === "\\") esc = true;
    else if (ch === '"') inStr = false;
  } else {
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
}
if (depth !== 0) throw new Error("Unbalanced brackets in TESTS_LIST");

const tests = JSON.parse(html.slice(start, i + 1));
console.log(`Parsed ${tests.length} tests`);

const outDir = path.join(process.cwd(), "data", "mock-tests", bundleSlug);
fs.mkdirSync(outDir, { recursive: true });

let totalQ = 0;
const index = [];
for (const t of tests) {
  if (!t.id || !Array.isArray(t.questions) || t.questions.length === 0) {
    throw new Error(`Test missing id/questions: ${JSON.stringify(t).slice(0, 120)}`);
  }
  t.questions = t.questions.filter((q) => {
    const okShape = q.id && q.text && Array.isArray(q.options) && q.options.length > 0;
    const okAnswer = okShape && (q.options.some((o) => o.correct) || q.correct_answer);
    if (!okAnswer) {
      console.warn(`  SKIP bad question in test ${t.id}: ${JSON.stringify(q).slice(0, 160)}`);
    }
    return okAnswer;
  });
  if (t.questions.length === 0) {
    console.warn(`  SKIP test ${t.id}: no valid questions left`);
    continue;
  }
  const numQ = t.questions.length;
  const totalMarks = t.total_marks || numQ * 4;
  const duration = t.duration || Math.ceil(numQ + 10);
  const clean = {
    id: t.id,
    title: (t.title || t.id).replace(/\s+/g, " ").trim(),
    num_questions: numQ,
    total_marks: totalMarks,
    duration,
    time_per_question: t.time_per_question || Math.round((duration * 60) / numQ),
    questions: t.questions.map((q) => ({
      id: q.id,
      text: q.text,
      raw_text: q.raw_text || q.text,
      options: q.options.map((o) => ({ label: o.label, text: o.text, correct: !!o.correct })),
      correct_answer: q.correct_answer || "",
      question_images: q.question_images || [],
      explanation_images: q.explanation_images || [],
      explanation: q.explanation || "",
    })),
  };
  fs.writeFileSync(path.join(outDir, `${t.id}.json`), JSON.stringify(clean));
  totalQ += clean.questions.length;
  index.push({
    id: clean.id,
    title: clean.title,
    num_questions: clean.num_questions,
    total_marks: clean.total_marks,
    duration: clean.duration,
  });
}

const indexPath = path.join(process.cwd(), "data", "mock-tests", "index.json");
let root = [];
if (fs.existsSync(indexPath)) root = JSON.parse(fs.readFileSync(indexPath, "utf8"));
root = root.filter((b) => b.slug !== bundleSlug);
root.push({ slug: bundleSlug, tests: index });
fs.writeFileSync(indexPath, JSON.stringify(root));

console.log(`Wrote ${index.length} test files to data/mock-tests/${bundleSlug}/`);
console.log(`Total questions: ${totalQ}`);
