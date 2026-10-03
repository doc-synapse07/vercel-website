const fs = require("fs");
const path = require("path");
const dir = "C:\\Users\\urvish.m.nakum\\Downloads";
const files = [
  "surgery_pyq.html", "psm_pyq.html", "DQB INICET_PYQ.html", "biochem_pyq.html",
  "radio_pyq.html", "fmt_pyq.html", "medicine_pyq.html", "derma_pyq.html",
  "micro_pyq.html", "ent_pyq.html", "psyc_pyq.html", "patho_pyq.html",
  "anesthesia_pyq.html", "physio_pyq.html", "anant_pyq.html", "ophth_pyq.html",
  "ortho_pyq.html", "pharma_pyq.html", "pedia_pyq.html", "obg_pqy.html",
  "DQB NEETPG_PYQ.html",
];
for (const f of files) {
  const full = path.join(dir, f);
  let html;
  try {
    html = fs.readFileSync(full, "utf8");
  } catch (e) {
    console.log(`${f} | UNREADABLE`);
    continue;
  }
  const mb = (html.length / 1048576).toFixed(2);
  const hasTestsList = html.includes("const TESTS_LIST = [{");
  const escDocs = (html.match(/&lt;!DOCTYPE/g) || []).length;
  const title = (/ <title>([\s\S]*?)<\/title>/i.exec(html) || [])[1];
  console.log(
    `${f} | ${mb}MB | testsList=${hasTestsList} | escDocs=${escDocs} | title=${(title || "?").replace(/\s+/g, " ").trim().slice(0, 60)}`
  );
}