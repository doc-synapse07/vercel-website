import { LegalPage } from "@/components/legal/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Returns, Refund & Cancellation",
  description:
    "How cancellations, refunds and digital-delivery issues are handled at SYNAPSE.07, including duplicate charges and broken download links.",
};

export default async function ReturnsPage() {
  const { supportEmail, supportPhone } = await getSettings();

  return (
    <LegalPage
      eyebrow="returns"
      title="Returns, Refund & Cancellation"
      summary="Because our products are delivered instantly, here is exactly how refunds and cancellations work."
      updated="2 October 2026"
      contact={{ email: supportEmail, phone: supportPhone }}
      sections={[
        {
          step: "01",
          title: "Digital products — non-cancellable and non-refundable",
          paragraphs: [
            "Our products are PDFs delivered immediately after payment. Once a download link has been generated the material has already been delivered, which is why an order cannot be cancelled or refunded at that point.",
            "This applies to every product on the store, including compilations, revision material and previous-year question papers.",
          ],
        },
        {
          step: "02",
          title: "Where we do issue a refund",
          paragraphs: [
            "We will refund an order in these situations, and you do not need to argue for it:",
          ],
          bullets: [
            "You were charged twice for the same order.",
            "The charge on your statement does not match the order you placed.",
            "Payment was taken but the order was never created and you received no links.",
            "A product file is broken, corrupt, or not the product you ordered.",
            "A product was listed as including a file that is missing.",
          ],
        },
        {
          step: "03",
          title: "How to claim",
          paragraphs: [
            "Contact us from the same address you ordered with and include your order number. The order number is in your confirmation email and on your account page.",
            "We aim to resolve a genuine problem within 3 working days of receiving it. Approved refunds are returned to the original payment method and may take a further 5–10 working days to appear, depending on your bank.",
          ],
        },
        {
          step: "04",
          title: "Link expiry is not a fault",
          paragraphs: [
            "Download links expire 24 hours after payment. That is a delivery window, not a limitation on your use of the file — once downloaded, the PDF is yours to keep indefinitely.",
            "If you lose the email, sign in to your account to reach the same links from your orders page. If the window has closed, contact us and we will re-issue them.",
          ],
        },
        {
          step: "05",
          title: "Duplicate charges",
          paragraphs: [
            "If a payment was taken twice, we refund the duplicate automatically — you do not need to request it. If the duplicate is still showing, email us with your order number and the last four digits of the card used.",
          ],
        },
        {
          step: "06",
          title: "Failed or pending payments",
          paragraphs: [
            "If a payment shows as pending and no order is created, no amount has been taken from you. Card networks and banks can hold an authorisation briefly before releasing it.",
            "If money has been debited and no order exists after 24 hours, email us with your order number and we will either push your links through or refund the full amount.",
          ],
        },
        {
          step: "07",
          title: "Chargebacks",
          paragraphs: [
            "If you raise a dispute with your bank instead of contacting us, it typically costs you more in time and in fees. Please email us first — we would rather fix it directly.",
          ],
        },
        {
          step: "08",
          title: "Physical products",
          paragraphs: [
            "No physical products are currently sold. If they are added later, this section will be updated with the applicable cancellation window and return conditions before they go on sale.",
          ],
        },
      ]}
    />
  );
}