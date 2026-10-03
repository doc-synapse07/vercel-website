/**
 * Cover image manifest.
 *
 * The reference store hosts its covers on an external CDN that we do not
 * control — it is slow and intermittently returns errors. This maps each
 * product's remote cover to a stable local filename so the storefront is
 * self-contained and deployable.
 *
 * The local name deliberately does NOT match the product slug: these are the
 * filenames the images were downloaded under and are kept as-is so existing
 * files in public/products are still found.
 */

export type CoverImage = {
  /** Filename stem inside public/products/ (extension is added on download). */
  name: string;
  /** Original remote URL, used by the downloader. */
  url: string;
};

export const COVER_IMAGES: CoverImage[] = [
  { name: "ups-cms-interview", url: "https://media-cdn.cosmofeed.com/chat/EDAC796F-244D-446D-8BE4-6D98699B58F1-2026-14-09-05-38-58.png" },
  { name: "rajasthan-mo-complete-book", url: "https://media-cdn.cosmofeed.com/chat/photo-output-2026-01-10-03-36-11.jpeg" },
  { name: "ruhs-all-in-one", url: "https://media-cdn.cosmofeed.com/chat/photo-output-2026-26-09-09-15-18.jpeg" },
  { name: "inicet-most-repeated-pyqs", url: "https://media-cdn.cosmofeed.com/chat/6EF3C7B2-8958-4253-8CBD-27D1986CA89B-2026-24-09-04-37-50.png" },
  { name: "compiled-module-all-subjects", url: "https://media-cdn.cosmofeed.com/chat/IMG_7357-2026-24-05-02-28-0.png" },
  { name: "neet-inicet-19-subjects", url: "https://media-cdn.cosmofeed.com/chat/1000045652-2026-03-04-06-28-55.png" },
  { name: "inicet-pyq-compiled", url: "https://media-cdn.cosmofeed.com/chat/3B6D7F4A-0A9C-4560-9DF4-2B25BB42C231-2026-04-09-02-19-23.png" },
  { name: "fmge-revision-minor", url: "https://media-cdn.cosmofeed.com/chat/74EB48A7-2106-429F-8809-DD2129ABE9A1-2026-27-08-07-19-43.png" },
  { name: "minor-subject-pyq", url: "https://media-cdn.cosmofeed.com/chat/1000045089-2026-31-03-04-06-43.jpg" },
  { name: "doc-all-in-one", url: "https://media-cdn.cosmofeed.com/chat/Pink-and-Yellow-Modern-Fashion-Magazine-2026-07-05-03-36-43.png" },
  { name: "pyq-expected-questions", url: "https://media-cdn.cosmofeed.com/chat/0E842773-4FCB-4F32-8858-BDC00ECF4D5E-2026-14-08-02-29-39.png" },
  { name: "all-subjects-updates", url: "https://media-cdn.cosmofeed.com/chat/E6C36E75-949D-4588-A575-045A29778085-2026-14-08-02-30-14.png" },
  { name: "neet-lrr", url: "https://media-cdn.cosmofeed.com/chat/1000045652-2026-03-04-06-28-55.png" },
  { name: "image-all-in-one", url: "https://media-cdn.cosmofeed.com/chat/83060BD8-B598-42DF-A00B-C42BFFF8F0D3-2026-09-05-08-31-52.png" },
  { name: "fmge-compiled", url: "https://media-cdn.cosmofeed.com/chat/1000046995-2026-22-04-02-06-13.png" },
  { name: "gpsc-medical-health-officer", url: "https://media-cdn.cosmofeed.com/chat/1621ECE8-4BB4-4BC5-9E6C-DBD9697E32DA-2026-21-05-04-32-41.png" },
  { name: "cms-lrr", url: "https://media-cdn.cosmofeed.com/chat/IMG_2072-2026-22-07-08-11-26.jpeg" },
  { name: "upsc-paper1-2-pyq", url: "https://media-cdn.cosmofeed.com/chat/1000047451-2026-09-05-08-46-35.png" },
  { name: "upsc-top-100", url: "https://media-cdn.cosmofeed.com/chat/1000045597-2026-02-04-02-24-6.png" },
  { name: "obgy-upsc-cms", url: "https://media-cdn.cosmofeed.com/chat/1000045725-2026-03-04-07-15-46.png" },
  { name: "pharmacology-top-100", url: "https://media-cdn.cosmofeed.com/chat/1000045649-2026-03-04-06-05-3.png" },
  { name: "upsc-2023-24-25", url: "https://media-cdn.cosmofeed.com/chat/1000046418-2026-12-04-09-12-58.png" },
  { name: "upsc-2020-21-22", url: "https://media-cdn.cosmofeed.com/chat/1000045159-2026-01-04-07-00-4.png" },
  { name: "anat-physio-biochem", url: "https://media-cdn.cosmofeed.com/chat/AFC8BEB4-EE83-4E16-8EA3-D224879D477C-2026-31-03-03-00-6.jpeg" },
  { name: "pharm-patheo-micro-fm", url: "https://media-cdn.cosmofeed.com/chat/1000045090-2026-31-03-04-11-17.jpg" },
  { name: "medicine-surgery-obgy-pedia", url: "https://media-cdn.cosmofeed.com/chat/1000045091-2026-31-03-03-48-57.jpg" },
  { name: "ophthal-ent-psm", url: "https://media-cdn.cosmofeed.com/chat/IMG_6944-2026-07-09-12-16-40.jpeg" },
  { name: "upsc-all-in-one", url: "https://media-cdn.cosmofeed.com/chat/IMG_7435-2026-24-05-07-35-32.png" },
  { name: "upsc-compiled-module", url: "https://media-cdn.cosmofeed.com/chat/F2A222A5-8CC1-4FCE-BBF2-1265FC498F2C-2026-14-09-05-43-34.png" },
  { name: "upsc-2018-2025", url: "https://media-cdn.cosmofeed.com/chat/D689EECF-A712-4848-9D7A-D8EEF3C4508C-2026-24-05-05-59-24.png" },
  { name: "minor-micro-mix-upsc", url: "https://media-cdn.cosmofeed.com/chat/1000046123-2026-07-04-02-12-58.png" },
];

/** Remote cover URL -> local filename stem. */
const BY_URL = new Map(COVER_IMAGES.map((c) => [c.url, c.name]));

export function localCoverNameFor(sourceImageUrl: string): string | null {
  return BY_URL.get(sourceImageUrl) ?? null;
}