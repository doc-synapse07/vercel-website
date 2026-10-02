import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getAvailableProviders, isLiveMode } from "@/lib/payments";
import { getStorageDriver } from "@/lib/storage";
import { getSmtpFormState } from "@/lib/mail-config";
import { getSocialFormState } from "@/lib/social-stats";
import { SettingsPanels } from "./SettingsPanels";
import { SmtpPanel } from "./SmtpPanel";
import { SocialPanel } from "./SocialPanel";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

type EnvRow = { label: string; value: string; ok: boolean; hint: string };

/**
 * Payments and storage still come from environment variables — the secrets there
 * have to exist before the server can even boot, so they stay out of the admin
 * panel. SMTP is editable there and handled by SmtpPanel instead.
 */
function integrationRows(): { group: string; rows: EnvRow[] }[] {
  const providers = getAvailableProviders().filter((p) => p !== "mock");
  const storage = getStorageDriver();

  return [
    {
      group: "Payments",
      rows: [
        {
          label: "Payment gateway",
          value: providers.length ? providers.join(", ") : "Mock (sandbox)",
          ok: providers.length > 0,
          hint: providers.length
            ? `Set to ${isLiveMode() ? "LIVE" : "TEST"} mode.`
            : "Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET, STRIPE_SECRET_KEY or CASHFREE_APP_ID.",
        },
      ],
    },
    {
      group: "Storage",
      rows: [
        {
          label: "File driver",
          value: storage === "r2" ? "Cloudflare R2" : "Local ./storage",
          ok: storage === "r2",
          hint:
            storage === "r2"
              ? "Uploaded PDFs are stored in your R2 bucket."
              : "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET before deploying.",
        },
      ],
    },
  ];
}

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const [settings, smtp, social] = await Promise.all([
    getSettings(),
    getSmtpFormState(),
    getSocialFormState(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Signed in as {admin.email}. Store details appear everywhere on the storefront.
        </p>
      </div>

      <SettingsPanels settings={settings} />

      <div className="mt-6">
        <SmtpPanel state={smtp} />
      </div>

      <div className="mt-6">
        <SocialPanel state={social} />
      </div>

      {/* ------------------------------------------------- read-only env panel */}
      <section className="mt-6 rounded-card border border-ink-200 bg-white p-5">
        <h2 className="text-base font-semibold text-ink-900">Integrations</h2>
        <p className="mt-0.5 mb-4 text-sm text-ink-500">
          Configured through environment variables — edit them in{" "}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">.env</code> locally and
          in your Vercel project settings after deployment.
        </p>

        <div className="flex flex-col gap-4">
          {integrationRows().map((section) => (
            <div key={section.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {section.group}
              </p>
              <ul className="flex flex-col gap-2">
                {section.rows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-start justify-between gap-3 rounded-lg border border-ink-200 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900">{r.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{r.hint}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        r.ok
                          ? "bg-brand-100 text-brand-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}