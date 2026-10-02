/**
 * Catalog imported from the reference SuperProfile store (superprofile.bio/synapse07).
 *
 * Titles, prices, MRPs and descriptions mirror the live store. Products start
 * with NO files attached — the admin uploads the PDFs from Admin > Products.
 *
 * `sourceImage` is the original remote cover. scripts/fetch-images.mjs downloads
 * these into public/products/; the seed prefers the local copy when present.
 */

export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type SeedProduct = {
  title: string;
  categorySlug: string;
  /** INR, converted to paise by the seeder */
  price: number;
  mrp?: number | null;
  shortDescription: string;
  description: string;
  sourceImage: string;
  isFeatured?: boolean;
  isFree?: boolean;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "UPSC CMS",
    slug: "upsc-cms",
    description:
      "Complete UPSC CMS preparation — previous year papers, compiled modules, subject-wise PYQs, one-liners, radiology and minor subjects.",
    sortOrder: 1,
  },
  {
    name: "INI-CET",
    slug: "ini-cet",
    description:
      "Subject-wise and year-wise previous year questions for INI-CET and NEET PG with complete solutions across all 19 subjects.",
    sortOrder: 2,
  },
  {
    name: "NEET PG",
    slug: "neet-pg",
    description:
      "Last revision revision (LRR) and expected-question compilations to revise the full NEET PG syllabus in a single sitting.",
    sortOrder: 3,
  },
  {
    name: "Compiled Modules",
    slug: "compiled-modules",
    description:
      "High-yield compilations — drug of choice, formulas, criteria, buzzwords, updates and image-based questions.",
    sortOrder: 4,
  },
  {
    name: "FMGE",
    slug: "fmge",
    description: "FMGE previous year questions and all-in-one revision packs for NEET PG aspirants.",
    sortOrder: 5,
  },
  {
    name: "NORCET",
    slug: "norcet",
    description: "NORCET papers with explanations, expected questions and compiled modules.",
    sortOrder: 6,
  },
  {
    name: "GPSC",
    slug: "gpsc",
    description: "Gujarat Public Service Commission medical officer and health officer preparation.",
    sortOrder: 7,
  },
  {
    name: "Rajasthan MO",
    slug: "rajasthan-mo",
    description: "Rajasthan Medical Officer PYQs and complete subject-wise revision book.",
    sortOrder: 8,
  },
  {
    name: "RUHS",
    slug: "ruhs",
    description: "RUHS all-in-one compiled module covering buzzwords, DOC, OBGYN, updates, criteria and formulas.",
    sortOrder: 9,
  },
  {
    name: "Free Resources",
    slug: "free-resources",
    description: "Free sample notes and practice material for exam aspirants.",
    sortOrder: 10,
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // ------------------------------------------------------------------ UPSC CMS
  {
    title: "UPSC CMS Interview Guide",
    categorySlug: "upsc-cms",
    price: 199,
    mrp: null,
    shortDescription: "Self-introduction, DAF-based questions, HR and personality, field, clinical and emergency questions.",
    description:
      "<p><strong>UPSC CMS Interview Guidebook</strong></p><ul><li>Self-Introduction &amp; DAF-Based Questions</li><li>20-Chapter Interview Approach</li><li>HR &amp; Personality Questions</li><li>Field, Clinical &amp; Emergency Questions</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/EDAC796F-244D-446D-8BE4-6D98699B58F1-2026-14-09-05-38-58.png",
    isFeatured: true,
  },
  {
    title: "CMS Last Revision Revision (LRR)",
    categorySlug: "upsc-cms",
    price: 399,
    mrp: 699,
    shortDescription: "Crisp Paper 1 & 2 PYQs, all 5 major subjects plus important minor subjects, exam-oriented.",
    description:
      "<p><strong>What's inside?</strong></p><ul><li>Crisp Previous Year Paper 1 &amp; Paper 2</li><li>All 5 Major Subjects covered</li><li>Important Minor Subjects included</li><li>High-yield, exam-oriented presentation</li><li>PYQs integrated with must-know revision points</li><li>No unnecessary theory — only concepts repeatedly tested in UPSC CMS</li><li>Fast revision format for the final weeks before the exam</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/IMG_2072-2026-22-07-08-11-26.jpeg",
    isFeatured: true,
  },
  {
    title: "UPSC CMS Paper 1 & 2 PYQ + Pattern",
    categorySlug: "upsc-cms",
    price: 249,
    mrp: 399,
    shortDescription: "Top 50 topics of Paper 1 in detail with 100 MCQs each, plus exam pattern.",
    description:
      "<p><strong>TOP 50 TOPICS OF PAPER 1 IN DETAIL WITH 100 MCQs IN EACH TOPIC</strong></p><p><strong>A) PHARMACOLOGY TOP 100</strong></p><p><strong>B) MEDICINE</strong></p><ol><li>Heart sound and all murmurs</li><li>Pheochromocytoma</li><li>Medicine one liner with important tables</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000047451-2026-09-05-08-46-35.png",
  },
  {
    title: "UPSC CMS Top 100 PYQs",
    categorySlug: "upsc-cms",
    price: 89,
    mrp: 199,
    shortDescription: "Top 50 PYQs from Paper 1 and Top 50 from Paper 2, 2015–2025, with explanations.",
    description:
      "<p><strong>UPSC CMS TOP 100 PYQ PDF</strong></p><ul><li>Top 50 PYQs from 2015–2025 Paper 1</li><li>Top 50 PYQs from 2015–2025 Paper 2</li><li>From the last 10 years of papers</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045597-2026-02-04-02-24-6.png",
  },
  {
    title: "OBGY for UPSC CMS",
    categorySlug: "upsc-cms",
    price: 99,
    mrp: 199,
    shortDescription: "Top 100 OBGYN PYQs 2015–2025, all DOC, dosage, management and contraception.",
    description:
      "<p><strong>OBGY — UPSC CMS</strong></p><ol><li>Top 100 PYQ OBGY — 2015–2025</li><li>OBGY all DOC</li><li>OBGY all dosage</li><li>OBGY all management</li><li>OBGY contraception (50+ asked topics)</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045725-2026-03-04-07-15-46.png",
  },
  {
    title: "Pharmacology Top 100 for CMS",
    categorySlug: "upsc-cms",
    price: 149,
    mrp: 299,
    shortDescription: "Top 50 pure pharmacology topics and top 50 pharma + medicine integrated topics.",
    description:
      "<p><strong>PHARMACOLOGY — UPSC CMS</strong></p><ul><li>Top 50 Pure Pharmacology Topics</li><li>Top 50 Pharma + Medicine Integrated Topics</li></ul><p>Completely based on UPSC CMS PYQs, concepts and explanations.</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045649-2026-03-04-06-05-3.png",
  },
  {
    title: "UPSC CMS 2023–2025 Papers with Solutions",
    categorySlug: "upsc-cms",
    price: 99,
    mrp: 199,
    shortDescription: "2023, 2024 and 2025 CMS papers with complete solutions and added one-liners.",
    description:
      "<p><strong>UPSC CMS 2023–25 COMPLETE PAPER WITH SOLUTION</strong></p><p>With top one-liners added for revision.</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000046418-2026-12-04-09-12-58.png",
  },
  {
    title: "UPSC CMS 2020–2022 Complete Papers",
    categorySlug: "upsc-cms",
    price: 99,
    mrp: 199,
    shortDescription: "Complete UPSC CMS Paper 1 and Paper 2 for 2020, 2021 and 2022 with solutions.",
    description:
      "<p><strong>COMPLETE UPSC CMS PAPER 1 &amp; PAPER 2</strong></p><ol><li>CMS 2022 complete</li><li>CMS 2021 complete</li><li>CMS 2020 complete</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045159-2026-01-04-07-00-4.png",
  },
  {
    title: "UPSC CMS All in One",
    categorySlug: "upsc-cms",
    price: 499,
    mrp: 699,
    shortDescription: "The flagship CMS pack — pattern, top 100 papers, radiology, dermatology, OBGYN, PSM and updates.",
    description:
      "<p><strong>UPSC CMS ALL IN ONE</strong></p><ul><li>UPSC CMS pattern</li><li>Top 50 Paper 1 &amp; Top 50 Paper 2</li><li>2025 to 2020 complete Paper 1 and 2 with each year's top 50 important topics added</li><li>Radiology complete</li><li>Dermatology complete</li><li>Pharmacology Top 100</li><li>OBGY Top 100</li><li>Ortho, Anaesthesia &amp; Dermatology Top 50</li><li>PSM all updates</li><li>Acute stroke management updates</li><li>Arrhythmia management table PYQs</li><li>New medicine updates 2025–2026</li><li>qSOFA vs NEWS/NEWS2</li><li>Murmur special MCQs with complete theory</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/IMG_7435-2026-24-05-07-35-32.png",
    isFeatured: true,
  },
  {
    title: "UPSC CMS Compiled Module",
    categorySlug: "upsc-cms",
    price: 449,
    mrp: 999,
    shortDescription: "Image-based PDFs, drug and dose management, criteria, formulas, buzzwords, updates and one-liners.",
    description:
      "<p><strong>COMPILED MODULE</strong></p><ol><li>All-in-One Image-Based PDF</li><li>Drug &amp; Dose Management</li><li>Criteria Compilation</li><li>Formula Compilation</li><li>High-Yield Buzzwords</li><li>Latest Updates</li><li>OBGYN Drug &amp; Dose Management</li><li>UPSC CMS One Liners</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/F2A222A5-8CC1-4FCE-BBF2-1265FC498F2C-2026-14-09-05-43-34.png",
  },
  {
    title: "UPSC CMS 2018 to 2025 Complete Papers",
    categorySlug: "upsc-cms",
    price: 199,
    mrp: 399,
    shortDescription: "Every UPSC CMS paper from 2018 to 2025 with complete solutions.",
    description:
      "<p><strong>UPSC CMS COMPLETE PAPER WITH SOLUTIONS</strong></p><ul><li>2018 to 2025 papers with complete solutions</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/D689EECF-A712-4848-9D7A-D8EEF3C4508C-2026-24-05-05-59-24.png",
  },
  {
    title: "Minor Subjects Mix for UPSC CMS",
    categorySlug: "upsc-cms",
    price: 149,
    mrp: 299,
    shortDescription: "Dermatology, radiology, anaesthesia, psychiatry and orthopaedics MCQs with explanations and one-liners.",
    description:
      "<p><strong>UPSC CMS 2020 TO 2026 MINOR SUBJECTS — MCQ, EXPLANATION, ONE-LINERS</strong></p><ol><li>Dermatology</li><li>Radiology</li><li>Anaesthesia</li><li>Psychiatry</li><li>Ortho</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000046123-2026-07-04-02-12-58.png",
  },

  // ------------------------------------------------------------------- INI-CET
  {
    title: "INI-CET Most Repeated PYQs",
    categorySlug: "ini-cet",
    price: 799,
    mrp: 1999,
    shortDescription: "Most repeated INI-CET PYQs from the last 7 years across all 19 subjects, plus the full compiled module.",
    description:
      "<p><strong>1) INI-CET MOST REPEATED PYQs FROM THE LAST 7 YEARS — ALL 19 SUBJECTS</strong></p><p><strong>2) COMPILED MODULE</strong></p><ol><li>Buzzwords compiled</li><li>DOC compiled</li><li>OBGYN drug &amp; dose management</li><li>Updates compiled</li><li>Criteria compiled</li><li>Formula compiled</li><li>All-in-one image based</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/6EF3C7B2-8958-4253-8CBD-27D1986CA89B-2026-24-09-04-37-50.png",
    isFeatured: true,
  },
  {
    title: "NEET PG + INI-CET Combined 19 Subjects",
    categorySlug: "ini-cet",
    price: 599,
    mrp: 1299,
    shortDescription: "2018 to 2025 NEET and INI-CET papers with complete solutions, subject-wise and year-wise.",
    description:
      "<p><strong>SUBJECT WISE — YEAR WISE</strong></p><p>NEET / INI-CET Q&amp;A WITH FULL SOLUTIONS</p><p>ALL 19 SUBJECTS</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045652-2026-03-04-06-28-55.png",
    isFeatured: true,
  },
  {
    title: "INI-CET PYQ + Compiled Module",
    categorySlug: "ini-cet",
    price: 599,
    mrp: 999,
    shortDescription: "Last 5 years of INI-CET PYQs across all 19 subjects, bundled with DOC, updates, buzzwords and formulas.",
    description:
      "<p><strong>1) INI-CET PYQ — LAST 5 YEARS, ALL 19 SUBJECTS</strong></p><p><strong>2) DOC COMPILED</strong></p><p><strong>3) ALL UPDATES COMPILED</strong></p><p><strong>4) BUZZWORDS</strong></p><p><strong>5) FORMULA &amp; MATHEMATICS COMPILED</strong></p><p><strong>6) STAGING &amp; CLASSIFICATION PYQ COMPILED</strong></p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/3B6D7F4A-0A9C-4560-9DF4-2B25BB42C231-2026-04-09-02-19-23.png",
  },
  {
    title: "Anatomy, Physiology & Biochemistry PYQs",
    categorySlug: "ini-cet",
    price: 149,
    mrp: 249,
    shortDescription: "Complete PYQs from 2017–2025 covering INI-CET and NEET PG, subject-wise and year-wise.",
    description:
      "<p><strong>ANATOMY — PHYSIOLOGY — BIOCHEMISTRY</strong></p><ul><li>Complete PYQs from 2017–2025 in one PDF</li><li>Covers both INI-CET and NEET PG in a single resource</li><li>Subject-wise and year-wise PYQs for smart preparation</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/AFC8BEB4-EE83-4E16-8EA3-D224879D477C-2026-31-03-03-00-6.jpeg",
  },
  {
    title: "Pharm, Patho, Micro & Forensic Medicine PYQs",
    categorySlug: "ini-cet",
    price: 149,
    mrp: 199,
    shortDescription: "Complete PYQs from 2017–2025 covering INI-CET and NEET PG, subject-wise and year-wise.",
    description:
      "<p><strong>PHARM — PATHO — MICRO — FM PYQ PDF</strong></p><ul><li>Complete PYQs from 2017–2025 in one PDF</li><li>Covers both INI-CET and NEET PG in a single resource</li><li>Subject-wise and year-wise PYQs for smart preparation</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045090-2026-31-03-04-11-17.jpg",
  },
  {
    title: "Medicine, Surgery, OBGYN & Peds PYQs",
    categorySlug: "ini-cet",
    price: 199,
    mrp: 299,
    shortDescription: "Complete PYQs from 2017–2025 covering INI-CET and NEET PG, subject-wise and year-wise.",
    description:
      "<p><strong>MEDICINE — SURGERY — OBGYN — PEDIA PYQ PDF</strong></p><ul><li>Complete PYQs from 2017–2025 in one PDF</li><li>Covers both INI-CET and NEET PG in a single resource</li><li>Subject-wise and year-wise PYQs for smart preparation</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045091-2026-31-03-03-48-57.jpg",
  },
  {
    title: "Ophthalmology, ENT & PSM PYQs",
    categorySlug: "ini-cet",
    price: 149,
    mrp: 299,
    shortDescription: "Complete PYQs from 2017–2025 covering INI-CET and NEET PG, subject-wise and year-wise.",
    description:
      "<p><strong>OPHTHALMOLOGY — ENT — PSM PYQ PDF</strong></p><ul><li>Complete PYQs from 2017–2025 in one PDF</li><li>Covers both INI-CET and NEET PG in a single resource</li><li>Subject-wise and year-wise PYQs for smart preparation</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/IMG_6944-2026-07-09-12-16-40.jpeg",
  },

  // ------------------------------------------------------------------- NEET PG
  {
    title: "NEET PG LRR — Revise in 1 Day",
    categorySlug: "neet-pg",
    price: 399,
    mrp: 499,
    shortDescription: "Revise the full NEET PG syllabus in one day — all 19 subjects, DOC, OBGYN DOC, updates and images.",
    description:
      "<p><strong>NEET LRR — REVISE FULL NEET PG IN 1 DAY EFFECTIVELY</strong></p><ol><li>All 19 subject revision</li><li>All 19 subject DOC</li><li>OBGYN drug of choice</li><li>All subjects updates</li><li>All subject image based questions</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045652-2026-03-04-06-28-55.png",
    isFeatured: true,
  },
  {
    title: "PYQs + Expected Questions Compiled",
    categorySlug: "neet-pg",
    price: 499,
    mrp: 799,
    shortDescription: "All 19 subject PYQs and expected questions, NEET PG LRR, all subject updates and DOC.",
    description:
      "<p><strong>THIS INCLUDES</strong></p><ol><li>All 19 subject PYQ and expected questions PDF</li><li>NEET PG LRR</li><li>All subjects updates</li><li>DOC — all subjects</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/0E842773-4FCB-4F32-8858-BDC00ECF4D5E-2026-14-08-02-29-39.png",
  },

  // ---------------------------------------------------------- Compiled Modules
  {
    title: "Compiled Module — All Subjects",
    categorySlug: "compiled-modules",
    price: 399,
    mrp: 699,
    shortDescription: "For NEET PG, INI-CET, FMGE and UPSC CMS — images, drug & dose, criteria, formulas, buzzwords and updates.",
    description:
      "<p><strong>COMPILED MODULE</strong></p><p>FOR NEET PG / INI-CET / FMGE / UPSC CMS</p><ol><li>All-in-One Image-Based PDF</li><li>Drug &amp; Dose Management</li><li>Criteria Compilation</li><li>Formula Compilation</li><li>High-Yield Buzzwords</li><li>Latest Updates</li><li>OBGYN Drug &amp; Dose Management</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/IMG_7357-2026-24-05-02-28-0.png",
    isFeatured: true,
  },
  {
    title: "Minor Subject PYQ PDF",
    categorySlug: "compiled-modules",
    price: 149,
    mrp: 299,
    shortDescription: "Ortho, radiology, dermatology, psychiatry, anaesthesia, ENT, ophthalmology and PSM PYQs.",
    description:
      "<p><strong>MINOR SUBJECT PYQ PDF</strong></p><p>ORTHO · RADIO · DERMAT · PSYCHI · ANAESTHESIA · ENT · OPTHAL · PSM</p><ul><li>Complete PYQs from 2017–2025 in one PDF</li><li>Covers both INI-CET and NEET PG in a single resource</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000045089-2026-31-03-04-06-43.jpg",
  },
  {
    title: "DOC — All in One",
    categorySlug: "compiled-modules",
    price: 149,
    mrp: 299,
    shortDescription: "Drug of choice A to Z across pharmacology, microbiology and OBGYN, plus side effects and new drugs.",
    description:
      "<p><strong>ALL IN ONE — DRUG OF CHOICE</strong></p><ol><li>Pharmacology — A to Z</li><li>Microbiology — drug of choice</li><li>OBGYN — all drug of choice</li><li>OBGYN — management</li><li>Drug side effects</li><li>New drugs updated</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/Pink-and-Yellow-Modern-Fashion-Magazine-2026-07-05-03-36-43.png",
  },
  {
    title: "All Subjects Updates 2025–26 Compiled",
    categorySlug: "compiled-modules",
    price: 200,
    mrp: 399,
    shortDescription: "Twenty latest guideline updates across ANC, ECT, ACOG, NACP, thalassemia, PSM, stroke, COPD and more.",
    description:
      "<p><strong>ALL UPDATES 2025–2026</strong></p><ol><li>ANC — 4 to 8 contacts</li><li>ECT — individualized drugs</li><li>ACOG ripening — updated induction</li><li>Foley + Miso — best combo</li><li>Misoprostol — 1st line in previous CS</li><li>NACP — 95-95-99</li><li>Thalassemia — HPLC early diagnosis</li><li>FOGSI screening — HPLC, partner, PND</li><li>Obesity — Asian BMI + Semaglutide</li><li>DMPA — IM 150 vs SC 104</li><li>PSM (TB) — shorter, all-oral regimens</li><li>Stroke — Tenecteplase &gt; Alteplase</li><li>NRP — DCC ≥60 sec</li><li>PPH — ≥300 ml + MOTIVE</li><li>COPD (GOLD) — A/B/E + Activity</li><li>PE — early anticoagulation</li><li>Dyslipidemia — Inclisiran add-on</li><li>FDA — new drug approvals</li><li>MDR-TB — 6M BPaLM</li><li>DS-TB — 4M regimen</li></ol><p><strong>Plus: ALL OBGYN UPDATES 25–26</strong></p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/E6C36E75-949D-4588-A575-045A29778085-2026-14-08-02-30-14.png",
  },
  {
    title: "All in One Image Based PDF",
    categorySlug: "compiled-modules",
    price: 99,
    mrp: 199,
    shortDescription: "All-in-one image-based PDFs — PYQ based, PSM, psychiatry and radiology/CNS.",
    description:
      "<p><strong>ALL IN ONE IMAGE BASED PDF</strong></p><ul><li>All in one PYQ based PDF</li><li>PSM all image based PDF</li><li>Psychiatry all image based PDF</li><li>Radiology / CNS image based PDF</li></ul>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/83060BD8-B598-42DF-A00B-C42BFFF8F0D3-2026-09-05-08-31-52.png",
  },

  // ----------------------------------------------------------------------- FMGE
  {
    title: "FMGE Revision for NEET PG + Minor Subject PYQs",
    categorySlug: "fmge",
    price: 149,
    mrp: 299,
    shortDescription: "FMGE January and June PYQs revised for NEET PG, bundled with minor subject PYQs.",
    description:
      "<p><strong>1) FMGE JANUARY AND JUNE PYQS REVISION FOR NEET PG</strong></p><p><strong>2) MINOR SUBJECT PYQ PDF</strong></p><p>ORTHO · RADIO · DERMAT · PSYCHI · ANAESTHESIA · ENT · OPTHAL · PSM</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/74EB48A7-2106-429F-8809-DD2129ABE9A1-2026-27-08-07-19-43.png",
  },
  {
    title: "FMGE Compiled",
    categorySlug: "fmge",
    price: 349,
    mrp: 499,
    shortDescription: "5 years of FMGE PYQs, paediatric all-in-one, radiology and image-based, updates and DOC.",
    description:
      "<p><strong>FMGE ALL IN ONE PDF — UPDATED</strong></p><ol><li>FMGE 5 year PYQ complete PDF</li><li>Paediatric all in one FMGE</li><li>Radiology / image based — all PYQ image based, PSM image based, radiology CNS, psychiatry image based final</li><li>Updates all in one</li><li>DOC all in one PDF — pharmacology, microbiology, OBGYN, image based side effects</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1000046995-2026-22-04-02-06-13.png",
  },

  // ---------------------------------------------------------------------- NORCET
  {
    title: "NORCET Papers + Compiled Module",
    categorySlug: "norcet",
    price: 500,
    mrp: 999,
    shortDescription: "NORCET papers 1–10 with explanations and expected questions, plus updates, DOC and image PYQs.",
    description:
      "<p><strong>What's inside</strong></p><ol><li>NORCET 1–5 papers + explanations + expected questions</li><li>NORCET 6–10 papers + explanations + expected questions</li><li>All-in-one updates</li><li>Pharmacology drug of choice</li><li>Psychiatry image-based MCQs</li><li>Pharmacology side effects list</li><li>All image-based PYQs PDF</li><li>Buzzwords — all in one</li></ol>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/CF9CB227-5D10-4D06-869E-203B44091DD6-2026-24-09-08-52-12.png",
  },

  // ----------------------------------------------------------------------- GPSC
  {
    title: "GPSC Medical Officer & Health Officer",
    categorySlug: "gpsc",
    price: 99,
    mrp: 299,
    shortDescription: "Preparation notes for the Gujarat Public Service Commission medical officer and health officer exams.",
    description:
      "<p><strong>GPSC MEDICAL OFFICER &amp; HEALTH OFFICER</strong></p><p>Complete preparation material for both GPSC medical officer and health officer exams.</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/1621ECE8-4BB4-4BC5-9E6C-DBD9697E32DA-2026-21-05-04-32-41.png",
  },

  // --------------------------------------------------------------- Rajasthan MO
  {
    title: "Rajasthan MO Complete Book",
    categorySlug: "rajasthan-mo",
    price: 499,
    mrp: 899,
    shortDescription: "Last 4 years of PYQs with complete subject-wise revision, buzzwords and rapid revision points.",
    description:
      "<p><strong>Rajasthan Medical Officer — PYQ + Complete Revision Book</strong></p><ol><li>Last 4 years PYQs</li><li>Complete subject-wise revision</li><li>High-yield buzzwords</li><li>Important repeated topics</li><li>Clinical &amp; image-based questions</li><li>Rapid revision points</li><li>Exam-oriented high-yield content</li></ol><p>Designed for quick revision + PYQ-based preparation for the Rajasthan Medical Officer exam.</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/photo-output-2026-01-10-03-36-11.jpeg",
    isFeatured: true,
  },

  // ------------------------------------------------------------------------ RUHS
  {
    title: "RUHS All in One",
    categorySlug: "ruhs",
    price: 799,
    mrp: 999,
    shortDescription: "RUHS compiled module — buzzwords, DOC, OBGYN dosing, updates, criteria and formulas.",
    description:
      "<p><strong>RUHS COMPILED MODULE</strong></p><ol><li>Buzzwords compiled</li><li>DOC compiled</li><li>OBGYN drug &amp; dose management</li><li>Updates compiled</li><li>Criteria compiled</li><li>Formula compiled</li></ol><p>Rajasthan Medical Officer PYQ + complete subject-wise revision with high-yield content.</p>",
    sourceImage:
      "https://media-cdn.cosmofeed.com/chat/photo-output-2026-26-09-09-15-18.jpeg",
  },
];

/** Welcome coupons so discount flow can be tested immediately. */
export const SEED_COUPONS = [
  {
    code: "WELCOME10",
    description: "10% off for new customers",
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscountPaise: 50000, // cap at ₹500
    minOrderPaise: 9900, // min ₹99
    usageLimit: null,
    perUserLimit: 1,
    expiresInDays: 90,
  },
  {
    code: "FLAT100",
    description: "₹100 off on orders above ₹499",
    discountType: "FLAT",
    discountValue: 10000, // ₹100
    minOrderPaise: 49900, // min ₹499
    usageLimit: 500,
    perUserLimit: 2,
    expiresInDays: 60,
  },
  {
    code: "SYNAPSE20",
    description: "20% off, capped at ₹300",
    discountType: "PERCENT",
    discountValue: 20,
    maxDiscountPaise: 30000, // cap at ₹300
    minOrderPaise: null,
    usageLimit: null,
    perUserLimit: null,
    expiresInDays: null,
  },
];