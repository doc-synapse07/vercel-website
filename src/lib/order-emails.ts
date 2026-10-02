import type { Order } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"");
}

function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

function shell(body: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <tr><td style="padding:24px;border-bottom:1px solid #e2e8f0;background:#0f766e">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold">SYNAPSE <span style="color:#5eead4">.07</span></p>
          </td></tr>
          <tr><td style="padding:24px">
            ${body}
          </td></tr>
          <tr><td style="padding:24px;border-top:1px solid #e2e8f0;background:#f8fafc">
            <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6">
              Need help? Reply to this email or contact us at support@synapse07.store<br/>
              SYNAPSE.07, India
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}

function itemsTable(order: Order) {
  const shipping = order.shipping || 0;
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;color:#1e293b;font-size:14px">${item.name} \u00d7 ${item.quantity}${item.variant ? `<br/><span style="color:#0f766e;font-size:12px">${escapeHtml(item.variant)}</span>` : ""}${item.customization ? `<br/><span style="color:#64748b;font-size:12px">${escapeHtml(item.customization)}</span>` : ""}</td>
          <td align="right" style="padding:10px 0;color:#0f766e;font-size:14px;font-weight:bold">${formatINR(item.pricePaise * item.quantity)}</td>
        </tr>`
    )
    .join("");
  const shippingRow = shipping > 0
    ? `<tr>
        <td style="padding:10px 0;color:#1e293b;font-size:14px">Shipping</td>
        <td align="right" style="padding:10px 0;color:#0f766e;font-size:14px;font-weight:bold">${formatINR(shipping)}</td>
      </tr>`
    : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
      ${rows}
      ${shippingRow}
      <tr>
        <td style="padding:12px 0;color:#1e293b;font-size:15px;font-weight:bold">Total</td>
        <td align="right" style="padding:12px 0;color:#0f766e;font-size:18px;font-weight:bold">${formatINR(order.totalPaise)}</td>
      </tr>
    </table>`;
}

function digitalDownloadsSection(itemsWithDigital: { name: string; fileName?: string; url: string; expiresAt: number }[]) {
  if (itemsWithDigital.length === 0) return "";
  const expires = new Date(itemsWithDigital[0].expiresAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const links = itemsWithDigital
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;color:#1e293b;font-size:14px">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.fileName ? `<br/><span style="color:#64748b;font-size:12px">${escapeHtml(item.fileName)}</span>` : ""}
          </td>
          <td align="right" style="padding:12px 0">
            <a href="${item.url}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px">Download ${item.fileName || "file"}</a>
          </td>
        </tr>`
    )
    .join("");
  return `
    <div style="margin:24px 0;padding:16px;background:#f0fdfa;border:1px solid #5eead4;border-radius:8px">
      <p style="margin:0 0 12px;color:#0f766e;font-size:14px;font-weight:bold">\uD83D\uDCE5 Your digital downloads are ready</p>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.5">Click the links below to download your digital products. Each link expires <strong style="color:#1e293b">${expires}</strong> (24 hours after your order) \u2014 download everything before then.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${links}
      </table>
    </div>`;
}

export function orderConfirmationEmail(order: Order, itemsWithDigital: { name: string; fileName?: string; url: string; expiresAt: number }[] = []) {
  const isDigitalOnly = order.items.every((i) => i.kind === "DIGITAL");
  const shipping = order.shippingAddress
    ? `${order.shippingAddress.line}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}, ${order.shippingAddress.country}`
    : "";
  const delivery = isDigitalOnly
    ? `<p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">This is a digital order \u2014 nothing ships. Your downloads are above and will expire 24 hours after your order.</p>`
    : `<p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">SHIPS TO</p>
        <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6">${shipping}</p>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">
          We'll email you your tracking number the moment your order is shipped.
        </p>`;
  return shell(`
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">Order confirmed \u2705</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${escapeHtml(order.contact.name)}, thanks for your order${order.totalPaise === 0 ? " \u2014 it's free, enjoy!" : "!"}.
      Your confirmation number is <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong>.
    </p>
    ${itemsTable(order)}
    ${digitalDownloadsSection(itemsWithDigital)}
    ${delivery}
  `);
}

export function orderShippingEmail(order: Order) {
  const shipping = order.shippingAddress
    ? `${order.shippingAddress.line}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}, ${order.shippingAddress.country}`
    : "";
  const isDigitalOnly = order.items.every((i) => i.kind === "DIGITAL");
  const tracking = order.trackingNumber
    ? `
      <p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">TRACKING NUMBER</p>
      <p style="margin:0;color:#1e293b;font-size:22px;font-weight:bold;letter-spacing:1px">${escapeHtml(order.trackingNumber)}</p>
      <p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.6">
        Keep this number handy. You can use it on the courier's website or app to follow your package.
      </p>`
    : `<p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">We'll share your tracking number in a follow-up email if it isn't in this one.</p>`;

  const body = isDigitalOnly
    ? `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">Your digital order is delivered \uD83C\uDF89</h1>
    <p style="margin:0 0 4px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${escapeHtml(order.contact.name)}, your order <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong> was delivered instantly as a download \u2014 it's in your inbox and on the confirmation page. No physical shipping applies.
    </p>
    ${itemsTable(order)}`
    : `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">Your order is on the way \uD83D\uDE9A</h1>
    <p style="margin:0 0 4px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${escapeHtml(order.contact.name)}, good news \u2014 your order <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong> has been shipped.
    </p>
    ${tracking}
    <p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">SHIPPED TO</p>
    <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6">${shipping}</p>
    ${itemsTable(order)}`;

  return shell(body);
}

export function orderPackedEmail(order: Order) {
  const shipping = order.shippingAddress
    ? `${order.shippingAddress.line}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}, ${order.shippingAddress.country}`
    : "";
  const isDigitalOnly = order.items.every((i) => i.kind === "DIGITAL");
  const body = isDigitalOnly
    ? `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">Your digital order is ready \u2705</h1>
    <p style="margin:0 0 4px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${escapeHtml(order.contact.name)}, your order <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong> is ready. Your download links were emailed to you and are also on the confirmation page (valid for 24 hours).
    </p>
    ${itemsTable(order)}`
    : `
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">Your order is packed \uD83D\uDCE6</h1>
    <p style="margin:0 0 4px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${escapeHtml(order.contact.name)}, good news \u2014 your order <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong> is packed and ready to ship. We'll email you the tracking number as soon as it's handed to the courier.
    </p>
    <p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">SHIPS TO</p>
    <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6">${shipping}</p>
    ${itemsTable(order)}`;

  return shell(body);
}

export function adminOrderEmail(order: Order, baseUrl?: string) {
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const isDigitalOnly = order.items.every((i) => i.kind === "DIGITAL");
  const customer = `${escapeHtml(order.contact.name)}<br/>${escapeHtml(order.contact.phone)}<br/>${escapeHtml(order.contact.email)}`;
  const shipping = order.shippingAddress
    ? `${order.shippingAddress.line}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}, ${order.shippingAddress.country}`
    : "";
  const destination = isDigitalOnly
    ? `<p style="margin:8px 0 0;color:#1e293b;font-size:14px;line-height:1.6">Digital download \u2014 no shipping required.</p>`
    : `<p style="margin:8px 0 0;color:#1e293b;font-size:14px;line-height:1.6">${shipping}</p>`;
  return shell(`
    <h1 style="margin:0 0 8px;color:#1e293b;font-size:22px">\uD83D\uDD28 New order received</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6">
      Order <strong style="color:#0f766e">${order.orderNumber.toUpperCase()}</strong> just came in
      for <strong style="color:#1e293b">${formatINR(order.totalPaise)}</strong>${isDigitalOnly ? " (digital)" : ""}.
    </p>
    ${itemsTable(order)}
    <p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">CUSTOMER</p>
    <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6">${customer}</p>
    <p style="margin:20px 0 8px;color:#64748b;font-size:12px;letter-spacing:1px">${isDigitalOnly ? "DELIVERY" : "SHIP TO"}</p>
    ${destination}
    <p style="margin:24px 0 0">
      <a href="${base}/admin/orders" style="display:inline-block;background:#0f766e;color:#ffffff;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px">Open admin orders</a>
    </p>
  `);
}