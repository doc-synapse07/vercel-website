import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, MessageCircle, Package } from "lucide-react";
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
    subtitle: "For physical products",
    text: "Are you a brand? Send us your product and we will learn it inside out — then create unboxing videos, hands-on demos and honest reviews that show buyers exactly what they get. Made for health and everyday devices our medical audience already shops for.",
    examples: ["BP monitors", "Nebulizers", "Massagers", "Thermometers", "Oximeters", "Steamers"],
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
    subtitle: "For courses & educators",
    text: "You pay us, we make the content. Walkthroughs of your coaching, test series or mentorship programme — what is inside, who it suits, and why it is worth the fee. A separate track for brands and educators — we create review videos, demos and promos for your physical products, courses and digital products.",
    examples: ["Coaching", "Test series", "Mentorship", "Study apps", "E-books"],
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
  const settings = await getSettings();
  const { supportEmail } = settings;
  const waDigits = settings.supportPhone.replace(/\D/g, "");
  const waNumber = waDigits.length >= 10 ? waDigits : null;
  const waLink = (message: string) =>
    waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null;
  const waCloser = waLink(
    "Hi SYNAPSE.07! I want to discuss a brand collaboration. Please share details and pricing."
  );

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
            brands. Two focused offerings — you pay us, we make the content, and it goes
            live to an audience of medical aspirants who actually buy study material.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- offers */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {OFFERS.map((o) => {
            const wa = waLink(
              `Hi SYNAPSE.07! I'm interested in "${o.title}". Please share details and pricing.`
            );
            return (
            <article
              key={o.n}
              className="group flex flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40"
            >
              <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50/70 to-transparent p-6 dark:border-ink-700 dark:from-brand-950/50 sm:p-7">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-extrabold tabular-nums text-brand-700 dark:text-brand-300">
                    {o.n}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md shadow-brand-700/25 transition-transform group-hover:scale-105">
                    <o.icon size={21} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                      {o.title}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                      {o.subtitle}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {o.text}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.examples.map((e) => (
                    <span
                      key={e}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 dark:bg-ink-900 dark:text-ink-200 dark:ring-ink-700"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
                  What you get
                </p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {o.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-200"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-2.5 border-t border-ink-100 pt-5 dark:border-ink-700">
                  <Link href="/contact" className="btn btn-primary btn-sm">
                    {o.cta} <ArrowRight size={14} />
                  </Link>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <MessageCircle size={14} /> WhatsApp us
                    </a>
                  )}
                </div>
              </div>
            </article>
            );
          })}
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
            Work with us
          </p>
          <h2 className="mx-auto mb-2 mt-2 max-w-xl text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            Let&apos;s create something great together
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            We are content creators — if you are a brand and want to promote your
            product, just connect with us. We will discuss the plan together: how
            many reels, stories and videos, what is included, and one fixed price
            for the entire package. You pay us, we create the content and publish
            it to our audience.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {waCloser && (
              <a
                href={waCloser}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-md"
              >
                <MessageCircle size={15} /> WhatsApp us
              </a>
            )}
            <Link href="/contact" className="btn btn-outline btn-md">
              Contact form
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
