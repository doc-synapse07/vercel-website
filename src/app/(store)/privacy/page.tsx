import { LegalPage } from "@/components/legal/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Privacy Policy",
  description:
    "What data SYNAPSE.07 collects to deliver your digital purchases, how it is used, how long it is kept, and how to ask us to delete it.",
};

export default async function PrivacyPage() {
  const { supportEmail, supportPhone, siteName } = await getSettings();

  return (
    <LegalPage
      eyebrow="privacy"
      title="Privacy Policy"
      summary="What we collect to deliver digital orders — and what we never do with it."
      updated="2 October 2026"
      contact={{ email: supportEmail, phone: supportPhone }}
      sections={[
        {
          step: "01",
          title: "What we collect",
          paragraphs: [
            `To fulfil an order we collect your name, email address and phone number. That is the minimum needed to take payment, deliver your download links and answer support requests.`,
            "We do not ask for a shipping address unless a physical product is added to the catalogue in future. The store already supports shipping addresses for that case, but no digital purchase collects one today.",
          ],
        },
        {
          step: "02",
          title: "Payments",
          paragraphs: [
            "Payments are processed by a payment gateway such as Razorpay, Stripe or Cashfree. Your card or bank details go directly to the gateway and never reach our servers.",
            "We keep only what is needed to confirm the order: the payment reference, the amount, the status and the timestamp.",
          ],
        },
        {
          step: "03",
          title: "Cookies & technical data",
          paragraphs: [
            "We use a small amount of browser storage for one purpose: remembering the contents of your cart so you can come back to it. There is no advertising or cross-site tracking, and no third-party analytics scripts.",
            "Basic technical logs kept by our hosting and infrastructure providers may be retained to keep the site reliable and secure.",
          ],
        },
        {
          step: "04",
          title: "How we use your data",
          paragraphs: [
            "Your details are used to process orders, generate and deliver your download links, send order confirmation emails, provide support, and meet legal and tax record-keeping duties.",
            "We do not sell, rent or share your personal data with third parties for marketing.",
          ],
          bullets: [
            `Hosting — ${siteName} is hosted on Vercel, which processes request data to serve pages.`,
            "Database — order records are stored in a managed Postgres database.",
            "File storage — purchased PDFs are held in Cloudflare R2 storage.",
            "Payments — handled by the gateway you choose at checkout.",
            "Email — order emails are sent through your configured SMTP provider.",
          ],
        },
        {
          step: "05",
          title: "Download links and retention",
          paragraphs: [
            "Download links are tied to the order they belong to and expire 24 hours after payment. Each link can be used a limited number of times within that window. Once expired, the link stops working and cannot be recovered.",
            "Order records are kept for as long as needed for support, accounting and legal compliance. You may ask us to delete your details at any time, except for records we are required to retain by law.",
          ],
        },
        {
          step: "06",
          title: "Your rights",
          paragraphs: [
            "You may ask for a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it. Write to us using the contact details below and we will action it.",
          ],
        },
      ]}
    />
  );
}