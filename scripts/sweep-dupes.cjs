const fs = require("fs");
const base = "C:\\Users\\urvish.m.nakum\\Desktop\\Test\\synapse.07\\data\\mock-tests";
const idx = JSON.parse(fs.readFileSync(base + "\\index.json", "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim().slice(0, 150).toLowerCase();
function examKey(title) {
  const t = title.toLowerCase().replace(/\b2o(\d\d)\b/g, "20$1");
  let exam = "other";
  if (/neet[\s-]?pg/.test(t)) exam = "neetpg";
  else if (/fmge/.test(t)) exam = "fmge";
  else if (/ini[\s-]?cet|inicet|aiims/.test(t)) exam = "inicet";
  else if (/upsc/.test(t)) exam = "upsc";
  const y = t.match(/((?:19|20)\d{2})/g);
  return `${exam}|${y ? y[y.length - 1] : "noyear"}`;
}
const all = [];
for (const b of idx) {
  for (const t of b.tests) {
    const full = JSON.parse(fs.readFileSync(`${base}\\${b.slug}\\${t.id}.json`, "utf8"));
    all.push({ id: t.id, bundle: b.slug, title: t.title, n: full.questions.length,
      set: new Set(full.questions.map((q) => norm(q.text))) });
  }
}
const groups = new Map();
for (const t of all) {
  const k = examKey(t.title);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(t);
}
let flagged = 0;
for (const [k, arr] of groups) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], c = arr[j];
      const small = a.n <= c.n ? a : c;
      const big = a.n <= c.n ? c : a;
      if (small.n < 10) continue;
      let same = 0;
      for (const x of small.set) if (big.set.has(x)) same++;
      const pct = Math.round((same / small.n) * 100);
      if (pct >= 70) {
        flagged++;
        console.log(`[${k}] ${pct}% of smaller contained (${same}/${small.n} vs ${big.n})`);
        console.log(`   A: ${a.bundle} / ${a.title.slice(0, 60)} (${a.n})`);
        console.log(`   B: ${c.bundle} / ${c.title.slice(0, 60)} (${c.n})`);
      }
    }
  }
}
console.log(flagged === 0 ? "CLEAN: no containment above 70%" : `flagged: ${flagged}`);