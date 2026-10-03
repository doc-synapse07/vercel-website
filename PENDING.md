# Project status — synapse07 (digital PDF store)

> Last reviewed: full dead-code + structure audit. Prisma is the source of truth.
> `src/lib/store.ts` is a catalogue *read* layer only.

## Done

| Area | Status |
|------|--------|
| Product catalog (categories, products, variants UI) | ✅ |
| Cart (per-customer + guest merge) | ✅ |
| Checkout (Razorpay / Stripe / Cashfree / mock sandbox) | ✅ |
| Digital delivery (instant email + success-page links) | ✅ |
| Download limits enforced (`DOWNLOAD_TTL_HOURS` / `DOWNLOAD_MAX_USES`, default 24h / 3 uses) | ✅ |
| Coupons (percent/flat, caps, expiry, per-user + total limits) | ✅ |
| Admin panel (products, orders, coupons, settings, dashboard) | ✅ |
| Customer accounts (email/password + Google, order history) | ✅ |
| Resend-links flow for lapsed/expired grants | ✅ |
| Single HTML email pipeline (`mail.ts`) | ✅ |
| Vercel Analytics + Speed Insights | ✅ |
| Sitemap + robots (`npm run sitemap`, also runs on `postbuild`) | ✅ |
| Cache tags (`CACHE_TAGS` + `revalidateTag` on admin mutations) | ✅ |
| Bundle analyzer (`npm run analyze`) | ✅ |
| Dead-code cleanup (duplicate email module, orphan store mutations, unused exports) | ✅ |

## Deliberately out of scope

| Item | Reason |
|------|--------|
| Refunds / returns for digital products | Digital downloads are non-returnable; statuses are `PENDING \| PAID \| FAILED` |
| 3D-printing / STL upload / courier shipping | Physical-goods track removed; store is digital-only (physical variant UI remains for bundles/editions) |
| Stripe-only migration | Keeping Razorpay + Cashfree for the Indian market |

## Optional follow-ups (low priority)

| Item | Effort |
|------|--------|
| Product reviews / ratings (social proof) | Medium |
| Abandoned-cart recovery email | Medium |
| Customer wishlist | Low |
| Split `src/lib/payments/index.ts` per gateway | Low (cleanup only) |
| Collapse `Settings` types (`lib/settings.ts` vs `lib/types.ts`) | Low (cleanup only) |

## Notes for contributors

- **Data ownership:** Prisma (`src/lib/db.ts`) owns all writes. `src/lib/store.ts`
  exposes catalogue *reads* (`getPublishedProducts`, `getProductBySlug`,
  `getPopularProducts`, `getRelatedProducts`, `getCategories`, `getCategoryBySlug`,
  `getSettings`, `setSetting`, `getStoreStats`). Do not add order/customer
  mutations to `store.ts`.
- **Money:** all prices/totals are integer paise. Never trust client totals —
  `/api/checkout` recomputes everything server-side.
- **Secrets:** admin-panel secrets are AES-256-GCM sealed (`SETTINGS_ENCRYPTION_KEY`
  falling back to `AUTH_SECRET`).
- **Typecheck covers everything:** `npm run typecheck` includes `src/`, `scripts/`,
  and `prisma/` (test scripts import lib helpers, e.g. `parseYouTubeTarget`).
- **One-time scripts:** `scripts/repair-category-slugs.ts` is idempotent and safe to
  re-run; `fetch-images` / `localise-cover-images` / `attach-sample-pdf` are
  documented dev/one-time helpers.
