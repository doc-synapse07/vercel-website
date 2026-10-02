import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Package } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Paid video creation and brand collaboration: review videos, demos and promos for your physical products, courses and digital products.",
};

const OFFERS = [
  {
    n: "01",
    icon: Package,
    title: "Product review videos",
    text: "Are you a brand? Send us your physical product and we will learn it inside out — then create unboxing videos, hands-on demos and honest reviews that show buyers exactly what they get.",
    bullets: [
      "Unboxing and first-look videos",
      "Hands-on demos and how-to guides",
      "Honest review format your buyers trust",
      "Published on YouTube, cut-down reels for Instagram",
    ],
    cta: "Discuss a video",
  },
  {
    n: "02",
    icon: GraduationCap,
    title: "Course promotions / Brand collaboration",
    text: "You pay us, we make the content. Walkthroughs of your coaching, test series or mentorship programme — what is inside, who it suits, and why it is worth the fee. A separate track for brands and educators — we create review videos, demos and promos for your physical products, courses and digital products.",
    bullets: [
      "Full course walkthroughs",
      "Test-series and mentorship features",
      "Structured like a genuine review, not a banner ad",
      "Pinned comments and description links to your page",
    ],
    cta: "Promote your course",
  },
];

const STEPS = [
  {
    n: "1",
    title: "You send your product",
    text: "Ship us the physical product, or share access for courses and digital products. Tell us the audience and the video style you want.",
  },
  {
    n: "2",
    title: "We learn it",
    text: "Hands-on setup, real use and testing — so the video shows genuine experience, not a script read off your landing page.",
  },
  {
    n: "3",
    title: "We create the video",
    text: "Shot, edited and captioned for YouTube and Instagram. You review the final cut before anything goes live — one round of revisions included.",
  },
  {
    n: "4",
    title: "Published to our audience",
    text: "The video goes live to medical aspirants who already buy study material — visibility and sales reach for your brand.",
  },
];

export default async function ServicesPage() {
  const { supportEmail } = await getSettings();

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="ambient-hero relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900">
        <div aria-hidden className="ambient-drift" />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <nav className="mb-3 text-sm text-ink-500 dark:text-ink-400">
            <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-300">
              Home
            </Link>{" "}
            / <span className="text-ink-800 dark:text-ink-100">Services</span>
          </nav>

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            Synapse.07 / Services
          </p>
          <h1 className="mb-3 mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Content that sells your product.
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">
            Paid video creation and brand collaboration for education and student-focused
            brands. Three focused offerings — you pay us, we make the content, and it goes
            live to an audience of medical aspirants who actually buy study material.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- offers */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {OFFERS.map((o) => (
            <article
              key={o.n}
              className="rounded-card border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-800"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-extrabold tabular-nums text-brand-700 dark:text-brand-300">
                  {o.n}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <o.icon size={19} />
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                  {o.title}
                </h2>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {o.text}
              </p>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {o.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-200"
                  >
                    <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
                    {b}
                  </li>
                ))}
              </ul>

              <Link href="/contact" className="btn btn-primary btn-sm mt-6">
                {o.cta} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- steps */}
      <section className="border-y border-ink-200 bg-ink-50/60 py-12 dark:border-ink-700 dark:bg-ink-800/40">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            How collaboration works
          </h2>
          <p className="mb-7 text-sm text-ink-500 dark:text-ink-400">
            Four steps from first message to published video.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-card border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-800"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mb-1.5 text-base font-semibold text-ink-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- closer */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-card border border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-800 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
            Start a project
          </p>
          <h2 className="mx-auto mb-2 mt-2 max-w-xl text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            Tell us what you are selling
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            Write to us with your product, your audience and the kind of video you want.
            Email {supportEmail} or use the contact form — we reply with a fixed quote
            and a delivery date.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-primary btn-md">
              Request a quote <ArrowRight size={15} />
            </Link>
            <a href={`mailto:${supportEmail}`} className="btn btn-outline btn-md">
              Send email
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
