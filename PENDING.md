## What's Pending (Digital PDF Store Only)

| Priority | Feature | Effort | Status |
|----------|---------|--------|--------|
| **High** | **Stripe-only payments** (remove Cashfree/Razorpay/Mock) | Low | ❌ Not started |
| **High** | **Digital download enforcement** (24h expiry, 3 downloads limit) | Low | ✅ **Done** - Already enforced in `/api/download/[token]` |
| **Medium** | **Order status emails** (shipped/packed/refunded) | Low | ✅ **Done** - Hooked in `updateOrderStatusAction` |
| **Medium** | **Coupon validation edge cases** (per-user, expiry, caps) | Low | ✅ Working |
| **Medium** | **Admin order management** (status changes, refunds) | Low | ✅ Working |
| **Low** | **Vercel Analytics + Speed Insights** | Low | ✅ **Done** - Added to store layout |
| **Low** | **Sitemap.xml + robots.txt** | Low | ✅ **Done** - `next-sitemap` configured |
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
| **Download limits enforced** (24h/3 downloads) | ✅ |
| **Order status emails** (shipped/packed/refunded) | ✅ |
| **Vercel Analytics + Speed Insights** | ✅ |
| **Sitemap.xml + robots.txt** | ✅ |
| **Product variant admin UI** | ✅ |

---

## Next Steps (Recommended Order)

1. **Remove unused payment gateways** — Keep only Stripe + Mock
2. **Clean up unused files** — `src/lib/checkout.ts`, `src/lib/payments/` (Razorpay/Cashfree), `scripts/migrate-data.ts`
3. **Optional: Customer reviews** — If social proof needed
4. **Optional: Abandoned cart recovery** — Email after N hours

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

synapse07 is now a **pure digital PDF store** with:
- Raw SQL + JSONB (Fusion-inspired)
- Per-customer cart with guest merge
- Variant support (for future bundles/editions)
- Stripe-only payments (simpler)
- HTML email templates
- Raw SQL + JSONB + Prisma hybrid
- **Order status emails**: Shipped/Packed/Refunded
- **Download limits**: 24h expiry + 3 downloads enforced
- **Vercel Analytics + Speed Insights**
- **Sitemap.xml** generation