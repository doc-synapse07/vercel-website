import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getPopularProducts, getStoreStats } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getSocialStats } from "@/lib/social-stats";
import { formatCompact } from "@/components/StatsMatrix";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Send,
  Video,
  Shield,
  Star,
  Zap,
  Youtube,
  Instagram,
  Users,
  MessageCircle,
} from "lucide-react";

/**
 * Homepage structure:
 * 1. Hero — strong value prop, primary CTAs
 * 2. Stats band — numbers + social stats
 * 3. Featured/Popular products — social proof + quick purchase
 * 4. Shop by exam — category grid with visual cards
 * 5. Trust signals — why buy from us
 * 6. Brand collaboration band
 */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
      {children}
    </p>
  );
}

function TrustBadge({ icon: Icon, title, text }: { icon: React.ComponentType<{ size?: number }>; title: string; text: string }) {
  return (
    <div className="group rounded-card border border-ink-200 bg-white p-4 sm:p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900 transition-colors">
        <Icon size={20} />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-400">{text}</p>
    </div>
  );
}

export default async function HomePage() {
  const [categories, stats, settings, social, popular] = await Promise.all([
    getCategories(),
    getStoreStats(),
    getSettings(),
    getSocialStats(),
    getPopularProducts(4),
  ]);

  const waDigits = settings.supportPhone.replace(/\D/g, "");
  const waCollab =
    waDigits.length >= 10
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
          "Hi SYNAPSE.07! I want to discuss a brand collaboration. Please share details and pricing."
        )}`
      : null;

  const community = [    {
      href: settings.telegramUrl,
      icon: Send,
      title: "Join Telegram group",
      text: "Discussion, doubt-clearing and knowledge sharing with fellow aspirants.",
    },
    {
      href: settings.whatsappUrl,
      icon: MessageCircle,
      title: "Follow WhatsApp channel",
      text: "New launches, discounts and updates — straight to your phone.",
    },
  ].filter((c) => c.href.trim().length > 0);

  const statItems = [
    { key: "products", value: stats.products, label: "PDF products", icon: FileText, iconBg: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" },
    { key: "categories", value: stats.categories, label: "Exam categories", icon: FileText, iconBg: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" },
    { key: "youtube", value: formatCompact(social.youtubeSubscribers) || "450+", label: "YouTube subscribers", icon: Youtube, iconBg: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400", href: settings.youtubeUrl },
    { key: "instagram", value: formatCompact(social.instagramFollowers) || "57.8K", label: "Instagram followers", icon: Instagram, iconBg: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400", href: settings.instagramUrl },
    { key: "telegram", value: "Join", label: "Telegram group", icon: Send, iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", href: settings.telegramUrl },
    { key: "whatsapp", value: "Join", label: "WhatsApp channel", icon: MessageSquare, iconBg: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400", href: settings.whatsappUrl },
  ];

  const trustSignals = [
    {
      icon: Shield,
      title: "Lifetime access",
      text: "Buy once, download forever. No subscriptions, no expiry on your files.",
    },
    {
      icon: Zap,
      title: "Instant delivery",
      text: "PDF links land in your inbox the moment payment succeeds — 24/7.",
    },
    {
      icon: Users,
      title: "Trusted by aspirants",
      text: `Join ${stats.customers?.toLocaleString("en-IN") ?? "thousands"} of medical students preparing with our notes.`,
    },
    {
      icon: Star,
      title: "Exam-focused content",
      text: "Previous-year questions, compiled modules and last-revision booklets — exactly what's asked.",
    },
  ];

  return (
    <>
      {/* ==================================================================== HERO */}
      <section className="ambient-hero relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900">
        <div aria-hidden className="ambient-drift" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-800/30"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fade-up">
            <Eyebrow>Synapse.07 / Learn · Revise</Eyebrow>
            <h1 className="mb-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-ink-900 dark:text-white sm:text-6xl lg:text-7xl">
              Learn Smart.
              <br />
              Revise Fast.
              <br />
              <span className="text-brand-700 dark:text-brand-300">Crack Exams.</span>
            </h1>
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">
              UPSC CMS <span className="mx-1.5 text-brand-600 dark:text-brand-400">|</span>
              INI-CET <span className="mx-1.5 text-brand-600 dark:text-brand-400">|</span>
              NEET PG <span className="mx-1.5 text-brand-600 dark:text-brand-400">|</span>
              FMGE <span className="mx-1.5 text-brand-600 dark:text-brand-400">|</span>
              NORCET <span className="mx-1.5 text-brand-600 dark:text-brand-400">|</span>
              GPSC
            </p>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink-600 dark:text-ink-300 sm:text-lg">
              High-yield previous-year questions, compiled modules and last-revision
              booklets — PDF downloads in your inbox the moment you pay. Yours to keep for life.
            </p>

            {/* Quick stats preview */}
            <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-ink-600 dark:text-ink-400">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-brand-600 dark:text-brand-400" />
                <span className="font-semibold text-ink-900 dark:text-white">{stats.products}</span>
                <span>PDF products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-brand-600 dark:text-brand-400" />
                <span className="font-semibold text-ink-900 dark:text-white">{stats.customers?.toLocaleString("en-IN") ?? "0"}+</span>
                <span>students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={16} className="text-brand-600 dark:text-brand-400" />
                <span className="font-semibold text-ink-900 dark:text-white">Lifetime</span>
                <span>access</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Link href="/products" className="btn btn-primary btn-lg w-full sm:w-auto">
                Browse notes <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn btn-outline btn-lg w-full sm:w-auto">
                Video services
              </Link>
              <Link href="/contact" className="btn btn-outline btn-lg w-full sm:w-auto">
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== STATS BAND */}
      <section className="border-b border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Eyebrow>The numbers</Eyebrow>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
            Community & output
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 gap-y-4">
            {statItems.map((item) => {
              const Content = item.href ? "a" : "div";
              const extraProps = item.href
                ? {
                    href: item.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "group flex flex-col items-center gap-2 px-3 py-5 rounded-card border border-ink-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500",
                  }
                : {
                    className: "group flex flex-col items-center gap-2 px-3 py-5 rounded-card border border-ink-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500",
                  };
              return (
                <Content key={item.key} {...extraProps}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg} group-hover:bg-brand-100 dark:group-hover:bg-brand-900 transition-colors`}>
                    <item.icon size={20} />
                  </span>
                  <div className="text-center">
                    <span className="block text-2xl font-extrabold leading-none tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                      {typeof item.value === "number"
                        ? item.value >= 1000
                          ? item.value.toLocaleString("en-IN")
                          : String(item.value)
                        : item.value}
                      {typeof item.value === "number" && (
                        <span className="text-brand-700 dark:text-brand-300">+</span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-ink-700 dark:text-ink-200">{item.label}</span>
                  </div>
                </Content>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================================== POPULAR PRODUCTS */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <Eyebrow>Most popular this week</Eyebrow>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                Top picks by aspirants
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                These are flying off the shelves — grab them before your peers do.
              </p>
            </div>
            <Link
              href="/products"
              className="btn btn-outline btn-sm hidden sm:inline-flex"
            >
              View all products <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn btn-outline btn-sm">
              View all products <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ==================================================================== CATEGORIES / SHOP BY EXAM */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Eyebrow>
                Exam notes · {stats.products} products · {stats.categories} exams
              </Eyebrow>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                Shop by exam
              </h2>
            </div>
            <Link
              href="/products"
              className="btn btn-outline btn-sm self-start sm:self-auto"
            >
              View all {stats.products} products <ArrowRight size={14} />
            </Link>
          </div>

          {/* Desktop: compact rectangular cards, all visible at a glance */}
          <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group flex items-center gap-3 rounded-card border border-ink-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-700/10 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-700 text-[13px] font-extrabold tabular-nums text-white transition-colors group-hover:bg-brand-800">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500 dark:text-ink-400">
                    {c.productCount} {c.productCount === 1 ? "product" : "products"}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-700 dark:text-ink-500 dark:group-hover:text-brand-300"
                />
              </Link>
            ))}
          </div>

          {/* Mobile: compact cards */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group card-glow relative flex min-h-[140px] flex-col overflow-hidden rounded-card border border-ink-200 bg-white p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500 dark:hover:shadow-black/40"
              >
                <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-all group-hover:bg-brand-100 group-hover:text-brand-800 dark:bg-brand-950 dark:text-brand-300 dark:group-hover:bg-brand-900 dark:group-hover:text-brand-400">
                  <FileText size={14} />
                </div>
                <h3 className="mb-1 line-clamp-1 text-[11px] font-semibold text-ink-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                  {c.name}
                </h3>
                <p className="text-[10px] text-ink-500 dark:text-ink-400">
                  {c.productCount} product{c.productCount !== 1 ? "s" : ""}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-1.5 dark:border-ink-800">
                  <span className="text-[10px] font-medium text-ink-400 dark:text-ink-500">Explore</span>
                  <ArrowRight size={10} className="text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== FREE MOCK TESTS BAND */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-col gap-6 rounded-card border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-50 p-8 dark:border-ink-700 dark:from-brand-950 dark:via-ink-900 dark:to-ink-900 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Free · 27 tests · 3,600 questions</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
              Test yourself before the real thing
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Timed subject and grand tests with instant scoring and explanations.
              No account needed — free while in beta.
            </p>
          </div>
          <Link href="/mock-tests" className="btn btn-primary btn-md shrink-0">
            Start a free test <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ==================================================================== TRUST SIGNALS */}
      <section className="border-y border-ink-200 bg-ink-50/60 py-14 dark:border-ink-700 dark:bg-ink-800/40">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <Eyebrow>Why aspirants choose us</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
              Built for serious preparation
            </h2>
            <p className="mt-2 max-w-2xl mx-auto text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Every note is designed to save you time and boost your score — no fluff, just what's asked.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((signal, i) => (
              <TrustBadge key={i} {...signal} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== COLLABORATION BAND */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-card border border-ink-200 bg-white p-8 dark:border-ink-700 dark:bg-ink-800 sm:p-10 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow>Brand collaboration</Eyebrow>
              <h2 className="mb-3 max-w-2xl text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl lg:text-4xl">
                Let&apos;s create something great together
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">
                We are content creators. If you are a brand and want to promote
                your product, connect with us — we will plan the content together
                (reels, stories, videos), agree one fixed package price, and you pay
                us only for the content we create for you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-2.5 w-full">
              {waCollab && (
                <a
                  href={waCollab}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-md w-full sm:w-auto"
                >
                  <MessageCircle size={15} /> WhatsApp us
                </a>
              )}
              <Link href="/services" className="btn btn-outline btn-md w-full sm:w-auto">
                Our services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}