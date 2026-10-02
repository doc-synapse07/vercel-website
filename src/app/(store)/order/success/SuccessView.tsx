import { CheckCircle2, Download, Mail, Clock, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatBytes, formatDate } from "@/lib/utils";

type DownloadItem = {
  token: string;
  productTitle: string;
  fileName: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  isExpired: boolean;
  isExhausted: boolean;
};

export function SuccessView({
  orderNumber,
  email,
  customerName,
  totalPaise,
  items,
  downloads,
  emailed,
  status,
  providerNote,
}: {
  orderNumber: string;
  email: string;
  customerName: string;
  totalPaise: number;
  items: { title: string; quantity: number }[];
  downloads: DownloadItem[];
  emailed: boolean;
  status: string;
  providerNote?: string | null;
}) {
  const isPaid = status === "PAID";
  const hoursLeft = downloads.length
    ? Math.max(
        0,
        Math.round(
          (new Date(downloads[0].expiresAt).getTime() - Date.now()) / 3_600_000,
        ),
      )
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* ------------------------------------------------------------ banner */}
      <div
        className={`mb-6 rounded-card border p-6 text-center ${
          isPaid
            ? "border-brand-200 bg-brand-50 dark:bg-brand-950"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <span
          className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
            isPaid ? "bg-brand-700 text-white" : "bg-amber-400 text-white"
          }`}
        >
          {isPaid ? <CheckCircle2 size={30} /> : <AlertTriangle size={28} />}
        </span>

        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
          {isPaid ? "Order confirmed" : "Payment processing"}
        </h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {isPaid
            ? `Thank you${customerName ? `, ${customerName}` : ""} — your order is confirmed.`
            : "We are still confirming your payment. This page updates automatically."}
        </p>

        <dl className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white px-3 py-2.5 dark:bg-ink-800">
            <dt className="text-xs text-ink-500 dark:text-ink-400">Order number</dt>
            <dd className="mt-0.5 font-bold text-ink-900 dark:text-white">{orderNumber}</dd>
          </div>
          <div className="rounded-lg bg-white px-3 py-2.5 dark:bg-ink-800">
            <dt className="text-xs text-ink-500 dark:text-ink-400">Amount paid</dt>
            <dd className="mt-0.5 font-bold text-ink-900 dark:text-white">₹{(totalPaise / 100).toFixed(0)}</dd>
          </div>
        </dl>
      </div>

      {/* ------------------------------------------------------------- email */}
      <div
        className={`mb-6 flex items-start gap-3 rounded-card border p-4 ${
          emailed
            ? "border-brand-200 bg-brand-50 dark:bg-brand-950"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <Mail
          size={19}
          className={`mt-0.5 shrink-0 ${emailed ? "text-brand-700 dark:text-brand-300" : "text-amber-700"}`}
        />
        <div className="text-sm">
          {emailed ? (
            <>
              <p className="font-semibold text-ink-900 dark:text-white">
                Download links sent to {email}
              </p>
              <p className="mt-0.5 text-ink-600 dark:text-ink-300">
                The same links are listed below in case the email is delayed. Don&apos;t forget to
                check your spam folder.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink-900 dark:text-white">
                SMTP is not configured — email was not sent
              </p>
              <p className="mt-0.5 text-ink-600 dark:text-ink-300">
                Your links are listed below and in your order history. Configure SMTP in{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 text-[12px]">.env</code> to have
                them emailed automatically.
              </p>
            </>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- downloads */}
      {downloads.length > 0 && (
        <section className="mb-6 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-white">
              <Download size={18} className="text-brand-700 dark:text-brand-300" /> Your downloads
            </h2>
            {hoursLeft > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                <Clock size={13} /> Expires in ~{hoursLeft}h
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-2.5">
            {downloads.map((d) => {
              const disabled = d.isExpired || d.isExhausted;
              return (
                <li
                  key={d.token}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                    <FileText size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{d.fileName}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      {d.productTitle} · {d.maxDownloads - d.downloadCount} of {d.maxDownloads}{" "}
                      downloads left
                    </p>
                    {d.isExpired && (
                      <p className="text-xs font-medium text-red-600">
                        This link has expired
                      </p>
                    )}
                    {d.isExhausted && !d.isExpired && (
                      <p className="text-xs font-medium text-red-600">
                        Download limit reached
                      </p>
                    )}
                  </div>

                  {disabled ? (
                    <span className="rounded-lg bg-ink-100 px-3.5 py-2 text-xs font-semibold text-ink-400">
                      Unavailable
                    </span>
                  ) : (
                    <a
                      href={`/api/download/${d.token}`}
                      className="btn btn-primary btn-sm"
                    >
                      Download
                    </a>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            Each link can be used {downloads[0]?.maxDownloads ?? 3} times and expires 24 hours
            after purchase. The PDFs themselves are yours for life — save them somewhere safe now.
          </p>
        </section>
      )}

      {/* -------------------------------------------------------------- items */}
      {items.length > 0 && (
        <section className="mb-6 rounded-card border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-800">
          <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Items in this order</h2>
          <ul className="flex flex-col gap-2">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-ink-700 dark:text-ink-200">
                  {i.title}
                  {i.quantity > 1 && <span className="text-ink-500 dark:text-ink-400"> × {i.quantity}</span>}
                </span>
              </li>
            ))}
          </ul>
          {providerNote && (
            <p className="mt-4 text-xs text-ink-500 dark:text-ink-400">Last update: {providerNote}</p>
          )}
        </section>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="btn btn-primary btn-md"
        >
          Continue shopping
        </Link>
        <Link
          href="/account"
          className="btn btn-outline btn-md"
        >
          Your orders
        </Link>
      </div>
    </div>
  );
}