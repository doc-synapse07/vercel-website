# SYNAPSE.07 — Digital Notes Store

E-commerce storefront selling exam-preparation PDFs (UPSC CMS, NEET PG, INI-CET, FMGE,
NORCET, GPSC and state exams), with an admin panel, cart/checkout, coupons, and
emailed 24-hour download links.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4**,
**Prisma + Postgres (Neon)**.

Repo: `doc-synapse07/vercel-website` · Deploys to **Vercel**.

---

## Features

**Storefront**

- Home, `/products` listing (search, category filter, sort dropdown, pagination), product detail pages
- Category pages (`/category/[slug]`) — UPSC CMS, INI-CET, NEET PG, FMGE, NORCET, GPSC, Rajasthan MO, RUHS, Compiled Modules, Free Resources
- Cart (`/cart`) with **Add to cart** and **Buy now**, persisted in `localStorage`
- Checkout collects only name, phone and email — no account required
- Coupons: percentage or flat, with min order value, cap, per-customer limit, total usage limit, start date and expiry
- Order confirmation page with working download links
- `/account` — customer sign-in/signup via Google or email/password; signed-in customers see order history with download links, and checkout prefills name/email. Guest checkout still works.
- `/services` — paid video creation and brand collaboration offers
- `/contact` — contact form; messages go to the support inbox with the visitor CC'd
- `/faq`, `/privacy`, `/terms`, `/returns` — static/legal pages

**Admin panel** (`/admin`)

- Dashboard: revenue, orders, products, customers, coupons, downloads, "products missing PDFs" warning, configuration checklist
- Products: create/edit/delete, upload one PDF or a bundle, per-file rename/delete, cover image, pricing, active/featured toggles
- Orders: search, filter by status, full order detail, change payment status, re-issue download links
- Coupons: create/edit, enable/disable, delete, usage counters
- Settings: store name, tagline, support contact, social links, social-proof numbers, SMTP (email delivery), password change

**Payments** — Razorpay, Stripe, Cashfree, plus a built-in sandbox gateway for local testing.
Whichever provider is configured is used; the sandbox route returns `403` as soon as any real
gateway has keys, so it can never mark orders paid on a live store. Webhook signatures are
verified with `crypto.timingSafeEqual`. The checkout page also verifies payment directly after
the gateway returns, so downloads work even before webhooks are live — webhooks are the safety
net for interrupted sessions.

**Delivery** — on successful payment the server creates one `DownloadGrant` per file with an
unguessable token and emails the links. Files stream only through `/api/download/[token]`
after the grant is validated for expiry and remaining uses, so purchased PDFs are never
reachable by guessing a URL.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router, React 19 |
| Styling | Tailwind CSS v4, Lucide icons |
| Database | Postgres (Neon) — Prisma ORM for transactional data; document-style `s_*` tables (JSONB) for catalogue/content |
| Cache | Next.js `unstable_cache` with tag-based revalidation (`CACHE_TAGS`) |
| Auth | Admin: password-only login, signed JWT (`jose`) in `httpOnly` cookie, bcrypt cost 12. Customers: email/password + Google OAuth (separate `Customer` model) |
| Payments | Razorpay, Stripe, Cashfree, mock sandbox |
| Files | Cloudflare R2 (S3-compatible), local `./storage` fallback in dev |
| Email | Nodemailer SMTP, configured from the admin panel; AES-256-GCM sealed secrets |
| Validation | Zod (forms, coupons, checkout) |
| SEO / observability | `next-sitemap`, Vercel Analytics, Speed Insights, bundle analyzer |

---

## Architecture

```
Browser
  │
  ├─ Storefront (RSC by default) ── queries.ts (cached) ──┐
  ├─ Admin panel (server actions + Prisma) ───────────────┤
  └─ API routes (checkout, webhooks, download, media) ────┤
                                                          ▼
                        ┌──────────────────────────────────────────────┐
                        │ Postgres (Neon in production)                │
                        │  • Prisma models: orders, coupons, grants,   │
                        │    customers, admin users, settings, SMTP    │
                        │  • s_* JSONB tables: products, categories,   │
                        │    orders, customers, settings (via store.ts)│
                        └──────────────────────────────────────────────┘
                                                          │
                        ┌──────────────────────────────────────────────┐
                        │ External services                            │
                        │  • Cloudflare R2 — product PDFs + covers     │
                        │  • SMTP — order/download emails (admin panel)│
                        │  • Razorpay / Stripe / Cashfree — payments   │
                        │  • Google OAuth — customer sign-in           │
                        │  • YouTube / Instagram APIs — social proof   │
                        └──────────────────────────────────────────────┘
```

**Data layer — two complementary paths:**

- `src/lib/store.ts` — catalogue and content (products, categories, customers, orders, settings).
  Reads `data/*.json` when no database URL is set (offline local fallback); otherwise uses the
  `s_*` tables in Postgres (Neon serverless on Vercel/edge, `postgres-js` elsewhere).
  `src/lib/queries.ts` wraps it in `unstable_cache` with `CACHE_TAGS`, so admin edits revalidate
  instantly via `revalidateTag`.
- `src/lib/db.ts` (Prisma) — transactional and relational data: order fulfilment, coupons and
  redemptions, download grants, customer auth, admin users, SMTP secrets, settings overrides.

**Money** — every price, discount and total is an integer number of **paise** (`₹199 = 19900`).
Client totals are never trusted: `/api/checkout` re-reads products from the database,
recomputes the subtotal, re-validates the coupon and recalculates the final amount.

**Secrets** — SMTP passwords and API tokens entered in the admin panel are sealed with
AES-256-GCM (`src/lib/secrets.ts`), keyed by `SETTINGS_ENCRYPTION_KEY` (falling back to
`AUTH_SECRET`). Precedence is **admin panel → environment → off**. With nothing configured the
store still works: download links render on the order success page.

---

## Project structure

```
prisma/
  schema.prisma        Postgres data model (Neon connection string)
  seed.ts              seed script
  data/catalog.ts      seed data: categories, products, coupons
  data/cover-images.ts cover-image manifest shared by downloader + seeder
scripts/
  smoke-test.ts        end-to-end HTTP test (checkout → coupon → payment → download)
  coupon-test.ts       coupon rule-engine test (caps, expiry, limits)
  account-test.ts      auth validation, hashing, Google link flow
  smtp-test.ts / social-test.ts   email + social-proof checks
  migrate-data.ts / setup-sql.ts  data migration helpers
  fetch-images.ts / localise-cover-images.ts   cover pipeline
  attach-sample-pdf.ts throwaway PDFs for exercising downloads
src/
  app/
    (store)/          home, products, product detail, category, cart,
                      checkout (+ mock), order success, account, services,
                      contact, faq, privacy, terms, returns
    admin/            layout, dashboard, products, orders, coupons, settings, login
    api/              auth/google, checkout, coupons, download, media,
                      payments (mock + verify), products, webhooks
  components/         header, footer, product card, search, cart, checkout UI
  lib/
    store.ts          JSON ↔ Postgres document layer (catalogue/content)
    db.ts             Prisma client singleton
    queries.ts        cached read API + CACHE_TAGS
    orders.ts         totals, pending orders, fulfilment, download grants
    coupons.ts        coupon validation + redemption bookkeeping
    payments/         Razorpay, Stripe, Cashfree, sandbox
    storage.ts        R2 with local ./storage fallback
    mail.ts / mail-config.ts / order-emails.ts   email pipeline
    secrets.ts        AES-256-GCM sealing
    auth.ts / customer-auth.ts / google-oauth.ts auth + sessions
    settings.ts / social-stats.ts  store + social-proof config
    utils.ts / constants.ts / types.ts / account-validation.ts
```

---

## Local setup

Requires **Node.js 20+** and a Postgres URL (Neon free tier works).

```bash
npm install
cp .env.example .env      # then edit .env — DATABASE_URL is required
npm run setup             # prisma generate + db push + seed
npm run dev               # http://localhost:3000
```

`npm run setup` seeds 10 categories, 32 products, 3 coupons and an admin user from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@synapse07.store` / `Admin@12345` —
change it from the admin panel after first login).

Seeded products ship **without PDFs**. Add them from Admin → Products, or generate throwaway
sample files to exercise the download pipeline:

```bash
npx tsx scripts/attach-sample-pdf.ts 3
```

With no payment/email/R2 keys configured, the store falls back gracefully: sandbox gateway,
links on the confirmation page, files in `./storage`. Everything works end to end locally.

### Verify the whole flow (server running)

```bash
npx tsx scripts/smoke-test.ts     # checkout → coupon → payment → PDF download
npx tsx scripts/coupon-test.ts    # coupon rules: caps, expiry, limits, per-customer
npx tsx scripts/account-test.ts   # auth validation, hashing, Google link flow
npx tsx scripts/smtp-test.ts      # email delivery check
npx tsx scripts/social-test.ts    # social-proof numbers check
```

Tests create only throwaway data and clean up after themselves.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run db:push` / `db:seed` / `db:reset` / `db:studio` | Schema sync, seed, reset, Studio |
| `npx tsc --noEmit` | Typecheck |

---

## Environment variables

All keys are documented in `.env.example`. The required ones:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon in production) |
| `AUTH_SECRET` | Signs session cookies (≥ 32 random chars in production) |
| `SETTINGS_ENCRYPTION_KEY` | Seals admin-panel secrets; different value from `AUTH_SECRET`, kept stable |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (used for OAuth callbacks, emails, sitemap) |

Optional — each has a graceful fallback:

| Variable | Fallback |
| --- | --- |
| `RAZORPAY_*` / `STRIPE_*` / `CASHFREE_*` | Mock sandbox gateway (local only) |
| `SMTP_*` | Admin → Settings → Email delivery; else links on success page |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Email login still works; Google button shows "not switched on yet" |
| `YOUTUBE_API_KEY` / `INSTAGRAM_ACCESS_TOKEN` | Manual counts in Settings; tiles hidden if blank |
| `R2_*` | Local `./storage` (dev only — Vercel needs R2, its filesystem is read-only) |

---

## Deploying to Vercel

1. **Push to GitHub** (`doc-synapse07/vercel-website`) and import the repo in Vercel.
2. **Create a Postgres database** (Neon recommended). Copy the connection string into `DATABASE_URL`.
3. **Sync the schema** once from a machine with the production URL: `npx prisma db push`, then seed with `npx tsx prisma/seed.ts`.
4. **Create a Cloudflare R2 bucket** — mandatory, Vercel's filesystem is read-only. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
5. **Set environment variables** in Vercel → Project → Settings → Environment Variables (see table above). Generate secrets with `npx --yes auth secret`.
6. **Seed production** (step 3), deploy, sign in at `/admin`.
7. **Point payment webhooks** at the deployed URL:

| Gateway | Endpoint |
| --- | --- |
| Razorpay | `https://<domain>/api/webhooks/razorpay` |
| Stripe | `https://<domain>/api/webhooks/stripe` |
| Cashfree | `https://<domain>/api/webhooks/cashfree` |

---

## Security notes

- Admin session is a signed JWT in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie
- Admin login asks for a password only — the account is resolved server-side, so the owner email is never leaked. `ADMIN_EMAIL` pins the account when several exist
- Passwords hashed with bcrypt at cost 12; unknown-email logins compare against a dummy hash so timing does not reveal which accounts exist
- Download tokens are 32 bytes of CSPRNG output, base64url encoded, with TTL + max-use enforcement
- Webhook signatures verified with `timingSafeEqual`
- Coupons validated server-side at checkout, never just in the browser
- `.env` is gitignored; `.env.example` is committed

---

## Catalogue notes

The 10 categories and 32 products are defined in `prisma/data/catalog.ts`, the single source of
truth for the seed. Prices and cover images mirror the reference store; the PDF files themselves
are uploaded by the store owner through the admin panel. Covers are downloaded once into
`public/products/` (see `scripts/fetch-images.ts`) so the store does not depend on third-party
hosts staying up.
