const fs = require("fs");
const base = "C:\\Users\\urvish.m.nakum\\Desktop\\Test\\synapse.07\\data\\mock-tests";
const idx = JSON.parse(fs.readFileSync(base + "\\index.json", "utf8"));
console.log("bundles:", idx.length);
const seen = new Map();
let tests = 0;
let questions = 0;
let bad = 0;
for (const b of idx) {
  for (const t of b.tests) {
    tests++;
    if (seen.has(t.id)) {
      bad++;
      console.log(`DUPLICATE ID: ${t.id} (in ${seen.get(t.id)} and ${b.slug})`);
    } else seen.set(t.id, b.slug);
    const full = JSON.parse(fs.readFileSync(`${base}\\${b.slug}\\${t.id}.json`, "utf8"));
    questions += full.questions.length;
    if (full.questions.length !== t.num_questions) {
      bad++;
      console.log(`COUNT MISMATCH: ${t.id} index=${t.num_questions} file=${full.questions.length}`);
    }
    for (const q of full.questions) {
      if (!q.text || !Array.isArray(q.options) || q.options.length === 0) { bad++; console.log(`BAD Q in ${t.id}`); break; }
      if (!q.options.some((o) => o.correct) && !q.correct_answer) { bad++; console.log(`NO ANSWER in ${t.id} Q ${q.id}`); break; }
    }
  }
}
console.log(`tests: ${tests}, unique ids: ${seen.size}, questions: ${questions}, problems: ${bad}`);
for (const b of idx) {
  const n = b.tests.reduce((s, t) => s + t.num_questions, 0);
  console.log(`  ${b.slug}: ${b.tests.length} tests, ${n} questions`);
}