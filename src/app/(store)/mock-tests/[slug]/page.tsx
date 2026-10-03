import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findMockTest, getMockBundles } from "@/lib/mock-tests";
import { prettyTestTitle } from "@/lib/mock-test-utils";
import { MockTestRunner } from "../MockTestRunner";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await findMockTest(slug);
  if (!found) return { title: "Mock test not found" };
  const title = prettyTestTitle(found.test.title);
  return {
    title: `${title} — Free Mock Test`,
    description: `${found.test.num_questions} timed questions, ${found.test.total_marks} marks, instant results with explanations.`,
  };
}

export default async function MockTestPage({ params }: Params) {
  const { slug } = await params;
  const found = await findMockTest(slug);
  if (!found) notFound();

  return <MockTestRunner test={found.test} />;
}

/** Pre-render every test page so first paint never waits on disk reads. */
export async function generateStaticParams() {
  const bundles = await getMockBundles();
  return bundles.flatMap((b) => b.tests.map((t) => ({ slug: t.id })));
}
