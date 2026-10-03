/**
 * Scans every HTML file in Downloads for the TESTS_LIST payload shape.
 * Usage: node scripts/scan-html.cjs "<dir>"
 */
const fs = require("fs");
const path = require("path");

const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".html"));

for (const f of files) {
  const full = path.join(dir, f);
  const stat = fs.statSync(full);
  const mb = (stat.size / 1048576).toFixed(2);
  let html;
  try {
    html = fs.readFileSync(full, "utf8");
  } catch (e) {
    console.log(`${f} | ${mb}MB | UNREADABLE: ${e.message}`);
    continue;
  }
  const hasPayload = html.includes("const TESTS_LIST = [{");
  const titles = [...html.matchAll(/"title":\s*"((?:CEREB|Btr)[^"]{0,80})"/g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim());
  const uniqTitles = [...new Set(titles)];
  const nq = (html.match(/num_questions/g) || []).length;
  console.log(`${f} | ${mb}MB | payload=${hasPayload} | titles=${uniqTitles.length} | num_q refs=${nq}`);
  for (const t of uniqTitles.slice(0, 40)) console.log(`    - ${t}`);
}
