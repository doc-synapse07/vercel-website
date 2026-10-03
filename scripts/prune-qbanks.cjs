const fs = require("fs");
const path = require("path");
const base = "C:\\Users\\urvish.m.nakum\\Desktop\\Test\\synapse.07\\data\\mock-tests";
const drop = new Set([
  "btrs",
  "cereb-anatomy", "cereb-anesthesia", "cereb-biochemistry", "cereb-dermatology",
  "cereb-ent", "cereb-forensic-medicine", "cereb-medicine", "cereb-microbiology",
  "cereb-ophthalmology", "cereb-orthopedics", "cereb-pathology", "cereb-pediatrics",
  "cereb-physiology", "cereb-psm", "cereb-psychiatry", "cereb-radiology",
  "cereb-surgery", "cereb-grand-tests", "cereb-btr", "cereb-btr-more",
]);
for (const d of drop) {
  fs.rmSync(path.join(base, d), { recursive: true, force: true });
  console.log("deleted", d);
}
const idx = JSON.parse(fs.readFileSync(path.join(base, "index.json"), "utf8"));
const kept = idx.filter((b) => !drop.has(b.slug));
fs.writeFileSync(path.join(base, "index.json"), JSON.stringify(kept));
let tests = 0, q = 0;
for (const b of kept) {
  const n = b.tests.reduce((s, t) => s + t.num_questions, 0);
  tests += b.tests.length; q += n;
  console.log(`kept ${b.slug}: ${b.tests.length} tests, ${n} questions`);
}
console.log(`TOTAL: ${kept.length} bundles, ${tests} tests, ${q} questions`);
