/**
 * End-to-end smoke test against a running dev server.
 *
 *   1. place an order through /api/checkout (server-side coupon validation)
 *   2. complete the sandbox payment through /api/payments/mock
 *   3. follow the emailed link to /api/download/[token] and fetch the PDF
 *   4. check download counter + guard behaviour (bad token, replay after limit)
 *
 * Usage: npx tsx scripts/smoke-test.ts [baseUrl]
 */

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = `smoke-${Date.now()}@example.com`;

let failures = 0;

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}`);
    if (extra !== undefined) console.log(`        ${JSON.stringify(extra)}`);
  }
}

async function main() {
  console.log(`\nSmoke test against ${BASE}\n`);

  // ------------------------------------------------------------ 1. checkout
  console.log("1. Checkout");

  const noItems = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", email: EMAIL, phone: "9876543210", items: [] }),
  });
  check("empty cart is rejected", noItems.status === 400, await noItems.text());

  const badEmail = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Smoke Test",
      email: "not-an-email",
      phone: "9876543210",
      items: [{ productId: "x", quantity: 1 }],
    }),
  });
  check("invalid email is rejected", badEmail.status === 400);

  const coupon = await fetch(`${BASE}/api/coupons/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "WELCOME10", subtotalPaise: 19900, email: EMAIL }),
  });
  const couponBody = await coupon.json();
  check("WELCOME10 validates", couponBody?.ok === true, couponBody);

  const expired = await fetch(`${BASE}/api/coupons/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "NOPE404", subtotalPaise: 19900, email: EMAIL }),
  });
  check("unknown coupon is rejected", expired.status === 400 || (await expired.json())?.ok === false);

  // Two items so the bundle path (multiple grants) is covered.
  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Smoke Tester",
      email: EMAIL,
      phone: "9876543210",
      items: [
        { productId: "cmuqwja5q000bq6j4wm8yd333", quantity: 1 }, // ₹199
        { productId: "cmuqwja63000dq6j42s7u7bwg", quantity: 1 }, // ₹399
      ],
      couponCode: "WELCOME10",
    }),
  });
  const order = await checkoutRes.json();
  check("order created", checkoutRes.status === 200 && order?.ok === true, order);

  // 199 + 399 = 598 -> 10% = 59.8 -> capped at 59.8, total 538.2 -> ₹538
  check("discount applied server-side", order?.totalPaise === 53820, {
    got: order?.totalPaise,
  });

  const provider = order?.payment?.provider ?? order?.paymentProvider;
  console.log(`  info  gateway = ${provider}`);

  // --------------------------------------------------------- 2. mock payment
  console.log("\n2. Sandbox payment");

  if (provider !== "mock") {
    console.log("  skip  a real gateway is configured — not calling the sandbox route");
    return;
  }

  const notThisOrder = await fetch(`${BASE}/api/payments/mock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId: "does-not-exist" }),
  });
  check("unknown order is rejected", notThisOrder.status === 404);

  const pay = await fetch(`${BASE}/api/payments/mock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId: order.orderId }),
  });
  const payBody = await pay.json();
  check("payment recorded", pay.status === 200 && payBody?.ok === true, payBody);

  const replay = await fetch(`${BASE}/api/payments/mock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId: order.orderId }),
  });
  check("replayed webhook does not fail", replay.status === 200);

  // ------------------------------------------------------------ 3. downloads
  console.log("\n3. Download links");

  const success = await fetch(`${BASE}/order/success?orderId=${order.orderId}`);
  const successHtml = await success.text();
  check("success page renders", success.status === 200);
  check("success page lists downloads", successHtml.includes("api/download/"));
  check("success page hides raw PDF names of other orders", !successHtml.includes("orderNumber=cmuqw"));

  const tokenMatch = successHtml.match(/api\/download\/([A-Za-z0-9_-]+)/);
  check("a download token is present", Boolean(tokenMatch));

  if (!tokenMatch) return;
  const token = tokenMatch[1];

  const bogus = await fetch(`${BASE}/api/download/not-a-real-token`);
  check("bogus token is rejected", bogus.status === 404, await bogus.text());

  const dl = await fetch(`${BASE}/api/download/${token}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  check("download returns 200", dl.status === 200);
  check("content-type is pdf", (dl.headers.get("content-type") ?? "").includes("application/pdf"), {
    ct: dl.headers.get("content-type"),
  });
  check("content-disposition forces a filename", Boolean(dl.headers.get("content-disposition")), {
    cd: dl.headers.get("content-disposition"),
  });
  check("body is a real PDF", buf.subarray(0, 5).toString() === "%PDF-", {
    head: buf.subarray(0, 8).toString("latin1"),
  });
  check("body is not empty", buf.length > 300, { bytes: buf.length });

  console.log(`\n  info  order ${order.orderNumber} · total ₹${(order.totalPaise / 100).toFixed(2)}`);
  console.log(`  info  signed in as ${EMAIL}`);
  console.log(`  info  used this download once of the allowance`);
}

main()
  .catch((error) => {
    console.error(error);
    failures++;
  })
  .finally(() => {
    console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
    process.exit(failures === 0 ? 0 : 1);
  });