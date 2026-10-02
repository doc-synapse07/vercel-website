## What's Pending (Digital PDF Store Only)

| Priority | Feature | Effort | Status |
|----------|---------|--------|--------|
| **High** | **Stripe-only payments** (remove Cashfree/Razorpay/Mock) | Low | ❌ Not started |
| **High** | **Digital download enforcement** (24h expiry, 3 downloads limit) | Low | ❌ Partial |
| **Medium** | **Order status emails** (paid/failed/refunded) | Low | ✅ Templates ready, not hooked |
| **Medium** | **Coupon validation edge cases** (per-user, expiry, caps) | Low | ✅ Working |
| **Medium** | **Admin order management** (status changes, refunds) | Low | ✅ Working |
| **Low** | **Vercel Analytics + Speed Insights** | Low | ❌ Not added |
| **Low** | **Sitemap.xml + robots.txt** | Low | ❌ Not added |
| **Low** | **Product reviews/ratings** | Medium | ❌ Not started |
| **Low** | **Abandoned cart recovery** (email after N hours) | Medium | ❌ Not started |
| **Low** | **Customer wishlist** | Low | ❌ Not started |

---

## What's Working (Digital PDF Store)

| Feature | Status |
|---------|--------|
| Product catalog (categories, products, variants) | ✅ |
| Cart (per-customer + guest merge) | ✅ |
| Checkout (Stripe + Mock) | ✅ |
| Digital delivery (instant email + download page) | ✅ |
| Coupons (%, flat, caps, limits, expiry) | ✅ |
| Admin panel (products, orders, coupons, settings) | ✅ |
| Customer accounts (orders, downloads) | ✅ |
| HTML email templates | ✅ |
| Raw SQL + JSONB storage | ✅ |
| Prisma for admin mutations | ✅ |

---

## Next Steps (Recommended Order)

1. **Remove unused payment gateways** — Keep only Stripe + Mock
2. **Enforce download limits** — Check `expiresAt` and `downloadCount` in `/api/download/[token]`
3. **Hook order emails** — Call `orderConfirmationEmail`, `orderShippingEmail` from order actions
3. **Add Vercel Analytics** — `npm i @vercel/analytics @vercel/speed-insights`
4. **Add sitemap.xml** — `next-sitemap` or manual generation
5. **Optional: Customer reviews** — If social proof needed

---

## Files to Clean Up (Optional)

| File | Reason |
|------|--------|
| `src/lib/checkout.ts` (Cashfree/Razorpay logic) | Remove if Stripe-only |
| `src/lib/payments/` (Razorpay, Cashfree) | Remove if Stripe-only |
| `src/app/(store)/checkout/mock/` | Keep for dev, hide in prod |
| `scripts/migrate-data.ts` | One-time use, can archive |

---

## Architecture Note

With 3D printing removed, synapse07 is now a **pure digital PDF store** with:
- Raw SQL + JSONB (Fusion-inspired)
- Per-customer cart with guest merge
- Variant support (for future bundles/editions)
- Stripe-only payments (simpler)
- HTML email templates
- Raw SQL + JSONB + Prisma hybrid