# SYNAPSE.07 — digital notes store

An e-commerce storefront for selling exam-preparation PDFs (NEET PG, UPSC CMS, INI-CET, FMGE,
NORCET, GPSC and more), with an admin panel, cart/checkout, coupons and emailed download links.

Built with Next.js 15 (App Router), Prisma and Tailwind CSS v4.

---

## What's included

**Storefront**

- Home page, `/products` listing with category filter, product detail pages
- Category pages (`/category/[slug]`) — UPSC CMS, INI-CET, NEET PG, FMGE, NORCET, GPSC,
  Rajasthan MO, RUHS, Compiled Modules, Free Resources
- Cart (`/cart`) with **Add to cart** and **Buy now**, persisted in `localStorage`
- Checkout collects only name, phone and email — no account required
- Coupons: percentage or flat, with min order value, cap, per-customer limit, total usage
  limit, start date and expiry
- Order confirmation page with working download links
- `/account` — customer sign-in and signup via Google or email/password; signed-in
  customers see their order history with download links, and checkout prefills
  their name and email. Guest checkout still works without an account.
- `/services` — paid video creation and brand collaboration offers
- `/contact` — contact form; messages go to the support inbox with the visitor CC'd
- `/faq` — static FAQ page
- `/privacy`, `/terms`, `/returns` — legal pages

**Admin panel** (`/admin`)

- Dashboard: total revenue, orders, products, customers, coupons, downloads, plus a
  "digital products missing PDFs" warning and a configuration checklist
- Products: create/edit/delete, upload one PDF or a whole bundle of PDFs, per-file rename
  and delete, cover image, pricing, active/featured toggles
- Orders: search, filter by status, view full order detail, change payment status,
  re-issue download links
- Coupons: create/edit, enable/disable, delete, usage counters
- Settings: store name, tagline, support contact, social links, about text, password change,
  and a read-only view of which integrations are configured

**Payments** — Razorpay, Stripe, Cashfree, and a built-in sandbox gateway. Whichever is
configured is used; the sandbox route returns `403` as soon as any real gateway has keys, so
it cannot mark orders paid on a live store. All webhook signatures are verified with
`crypto.timingSafeEqual`.

**Delivery** — on successful payment the server creates one `DownloadGrant` per file, mints an
unguessable token, and emails the links. Files are streamed only through
`/api/download/[token]` after the grant is validated, so purchased PDFs are never reachable by
guessing a URL.

---

## Local setup

Requires **Node.js 20+**.

```bash
npm install
cp .env.example .env      # then edit .env
npx tsx scripts/fetch-images.ts   # covers must exist before the seed resolves them
npm run setup             # prisma generate + db push + seed
npm run dev               # http://localhost:3000
```

`npm run setup` creates the SQLite database, seeds 10 categories, 32 products, 3 coupons and an
admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default `admin@synapse07.store` /
`Admin@12345` — change it from the admin panel after first login).

The seeded products ship **without PDFs**. Add them from the admin panel, or generate throwaway
sample files to exercise the download pipeline:

```bash
npx tsx scripts/attach-sample-pdf.ts 3
```

### With no keys configured

Payments fall back to the sandbox gateway, email is skipped (links still render on the
confirmation page), and files are written to `./storage`. Everything works end to end locally.

### Verifying the whole flow

With the server running:

```bash
npx tsx scripts/smoke-test.ts     # checkout -> coupon -> payment -> PDF download
npx tsx scripts/coupon-test.ts    # every coupon rule: caps, expiry, limits, per-customer
```

Both create only throwaway data and clean up after themselves.

### Product covers

Cover images are hosted on a third-party CDN that the reference store controls.
They are downloaded once into `public/products/` and served from there, so the
store does not depend on that host staying up:

```bash
npx tsx scripts/fetch-images.ts          # download any that are missing
npx tsx scripts/localise-cover-images.ts # point products at the local copies
```

The manifest in `prisma/data/cover-images.ts` is shared by the downloader and
the seeder, so a fresh `npm run setup` picks up the local copies automatically.

---

## Key commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run db:push` | Sync the schema to the database |
| `npm run db:seed` | Seed catalog, coupons and the admin user |
| `npm run db:reset` | Drop everything and re-seed |
| `npm run db:studio` | Prisma Studio |
| `npx tsc --noEmit` | Typecheck |

---

## Project layout

```
prisma/
  schema.prisma        data model (SQLite here, Postgres in production)
  data/catalog.ts      seed data: categories, products, coupons
  seed.ts              seed script
scripts/
  fetch-images.ts        downloads catalogue cover images
  localise-cover-images.ts points products at the downloaded covers
  attach-sample-pdf.ts   generates throwaway PDFs to test downloads
  smoke-test.ts          end-to-end HTTP test
  coupon-test.ts         coupon rule-engine test
src/
  app/
    api/               checkout, coupons, payments, webhooks, download, media
    admin/             admin panel (layout, dashboard, products, orders, coupons, settings)
    checkout/          checkout form + sandbox payment page
    order/success/     confirmation page with download links
    products/          listing
    category/[slug]/   category page
    cart/              cart page
    track-order/       order lookup
    faq/               FAQ
  components/          header, footer, product card, cart, checkout UI
  lib/
    db.ts              Prisma client singleton
    orders.ts          totals, pending orders, fulfilment, download grants
    payments/          Razorpay, Stripe, Cashfree, sandbox
    coupons.ts         coupon validation and redemption bookkeeping
    storage.ts         Cloudflare R2 with local ./storage fallback
    mail.ts            order emails (built from the resolved SMTP config)
    mail-config.ts     SMTP settings from the admin panel, env fallback
    secrets.ts         AES-256-GCM sealing for admin-entered credentials
    auth.ts            admin JWT session
    settings.ts        store settings from the database
```

---

## Prices are stored in paise

Every price, discount and order total is an integer number of **paise** (`₹199 = 19900`).
This avoids floating-point drift in totals. Conversion helpers live in `src/lib/utils.ts`.

**Client totals are never trusted.** `/api/checkout` re-reads products from the database,
recomputes the subtotal, re-validates the coupon and recalculates the final amount before an
order is created.

---

## Deploying to Vercel

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "SYNAPSE.07 store"
   git remote add origin https://github.com/<you>/synapse07.git
   git push -u origin main
   ```

2. **Create a Postgres database.** Use Vercel Postgres, Neon or Supabase. Copy the connection
   string into `DATABASE_URL`.

3. **Point Prisma at Postgres.** In `prisma/schema.prisma` change:

   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

   Then `npx prisma db push`. No application code changes are needed — everything else is
   provider-agnostic.

4. **Add a migration workflow.** Vercel cannot run `prisma db push` against production
   automatically. Either run `npx prisma db push` once from a machine with the production
   `DATABASE_URL`, or add a CI step that runs `prisma migrate deploy`.

5. **Configure file storage — this one is mandatory.** Vercel's filesystem is read-only at
   runtime, so the local `./storage` fallback will not work. Create a Cloudflare R2 bucket and
   set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

6. **Set the environment variables** in Vercel → Project → Settings → Environment Variables:
   everything from `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to the production URL.
   `AUTH_SECRET` must be at least 32 random characters:

   ```bash
   npx --yes auth secret
   ```

   Also set `SETTINGS_ENCRYPTION_KEY` to a *different* long random value. It seals the
   credentials saved from the admin panel (see below), so keep it stable — rotating it
   invalidates anything already stored.

   The `SMTP_*` variables can stay empty; email is configured from the admin panel instead.

7. **Seed the production database** once:

   ```bash
   DATABASE_URL="<production-url>" ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npx prisma db push
   DATABASE_URL="<production-url>" npx tsx prisma/seed.ts
   ```

8. **Import the repo into Vercel**, deploy, and sign in at `/admin`.

9. **Update payment webhooks.** Point them at the deployed URL and copy the signing secrets
   into Vercel:

   | Gateway | Endpoint |
   | --- | --- |
   | Razorpay | `https://<domain>/api/webhooks/razorpay` |
   | Stripe | `https://<domain>/api/webhooks/stripe` |
   | Cashfree | `https://<domain>/api/webhooks/cashfree` |

   The checkout page already verifies the payment directly after the gateway returns, so
   downloads work even before the webhook is live — the webhook is the safety net for
   interrupted or closed browser sessions.

---

## Email is configured from the admin panel

SMTP settings live in **Admin → Settings → Email delivery**, not in `.env`. Enter the host,
port, username and password there and click **Send a test email** — it makes a real
connection, so a green result means your provider accepts those credentials, not merely that
they were saved.

The password is sealed with AES-256-GCM before it is written to the database, keyed by
`SETTINGS_ENCRYPTION_KEY` (falling back to `AUTH_SECRET`). It is never rendered back to the
panel; the field only shows that one is stored. Leaving the password field blank keeps the
saved value, so unrelated edits do not require retyping it.

`SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` still work as a fallback for headless setups.
Precedence is **admin panel → environment → off**. With nothing configured the store does not
break: download links are shown on the order success page and the order is still fulfilled.

---

## Security notes

- Admin session is a signed JWT in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie
- The login form asks for a password only — the account is resolved server-side, so the owner
  email is never typed or leaked. `ADMIN_EMAIL` pins which account is used when several exist
- Passwords hashed with bcrypt at cost 12; login compares against a dummy hash when the email
  is unknown so response timing does not reveal which accounts exist
- PDF bytes are only served after a `DownloadGrant` is validated for expiry and remaining uses
- Download tokens are 32 bytes of CSPRNG output, base64url encoded
- Webhook signatures verified with `timingSafeEqual`
- Coupons are validated server-side at checkout, not just in the browser
- `.env` is gitignored; `.env.example` is committed

---

## Notes on the catalogue

The 10 categories and 32 products were copied from the reference store and are defined in
`prisma/data/catalog.ts`, which is the single source of truth for the seed. Prices and cover
images match the reference; the PDF files themselves are not included and are uploaded by the
store owner through the admin panel.