import { LegalPage } from "@/components/legal/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you buy exam-preparation PDFs from SYNAPSE.07, including licensing, acceptable use and liability.",
};

export default async function TermsPage() {
  const { supportEmail, supportPhone } = await getSettings();

  return (
    <LegalPage
      eyebrow="terms"
      title="Terms of Service"
      summary="The ground rules for buying and using our exam-preparation material."
      updated="2 October 2026"
      contact={{ email: supportEmail, phone: supportPhone }}
      sections={[
        {
          step: "01",
          title: "Scope",
          paragraphs: [
            "We sell digital study material — revision notes, previous-year question compilations and practice material for medical entrance and competitive exams. Everything is delivered as a PDF.",
            "By placing an order you accept these terms along with our Returns, Refund & Cancellation policy.",
          ],
        },
        {
          step: "02",
          title: "Orders & pricing",
          paragraphs: [
            "Prices are shown in Indian Rupees and include any applicable tax. The price confirmed at checkout is the price you pay — we do not change it after the fact.",
            "Coupon discounts are applied at checkout and are subject to their own expiry, minimum order value and per-customer limits. An order is only created once payment is confirmed.",
            "We may correct a pricing error at any time before the order is confirmed. If a payment is taken for an obviously incorrect price, we will contact you and offer a full refund rather than completing the order.",
          ],
        },
        {
          step: "03",
          title: "Licence to use",
          paragraphs: [
            "When you buy a PDF you are granted a personal, non-transferable licence to use it. You may download it, print it, read it on any device, and keep a backup. Your access is lifetime: the 24-hour window applies only to the emailed download link, never to your right to keep and use the file you have downloaded.",
            "You may not resell, redistribute, re-upload, share publicly, or include the material in any paid course or product. A single purchase covers one person.",
          ],
          bullets: [
            "Personal study and revision are permitted.",
            "Sharing a file with friends, classmates or a cohort is not permitted.",
            "Listing the material on any marketplace or file-sharing service is not permitted.",
          ],
        },
        {
          step: "04",
          title: "Accuracy of the material",
          paragraphs: [
            "Our notes summarise published guidelines, standard textbooks and previous-year question papers. They are study aids, not clinical or professional advice, and they are not a substitute for the official guidelines of any examination body.",
            "Medicine and regulatory content changes. Always cross-check anything clinically important against the current official source. We review and update material on a best-effort basis and do not guarantee that it reflects the most recent change on any given day.",
            "Typographical and factual errors can occur despite review. If you find one, please tell us and we will correct it.",
          ],
        },
        {
          step: "05",
          title: "Liability",
          paragraphs: [
            "To the maximum extent permitted by law, our liability for any order is limited to the amount you paid for that order.",
            "We are not liable for decisions you make based on this material, including exam or clinical outcomes. Study material cannot guarantee a result.",
          ],
        },
        {
          step: "06",
          title: "Availability",
          paragraphs: [
            "Download links are time-limited for the protection of our customers. We aim to keep the store available at all times but do not guarantee uninterrupted access, and we may change or discontinue products.",
          ],
        },
        {
          step: "07",
          title: "Changes to these terms",
          paragraphs: [
            "We may update these terms as the store changes. The date at the top of this page shows the latest revision. Continuing to use the store after a change means you accept the updated terms.",
          ],
        },
      ]}
    />
  );
}