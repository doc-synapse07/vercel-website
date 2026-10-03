import { promises as fs } from "fs";
import path from "path";

/**
 * Native mock-test data layer. Tests are extracted from the authored HTML
 * bundles into data/mock-tests/<bundle>/<testId>.json (see
 * scripts/extract-mock-tests.cjs) and served from here. Images stay hotlinked
 * to the author's CDN by decision — only text lives in this repo.
 *
 * Server-only: uses fs, so import exclusively from server components/routes.
 */

export type MockOption = { label: string; text: string; correct: boolean };

export type MockQuestion = {
  id: string;
  text: string;
  raw_text: string;
  options: MockOption[];
  correct_answer: string;
  question_images: string[];
  explanation_images: string[];
  explanation: string;
};

export type MockTestMeta = {
  id: string;
  title: string;
  num_questions: number;
  total_marks: number;
  duration: number;
};

export type MockTest = MockTestMeta & {
  time_per_question: number;
  questions: MockQuestion[];
};

export type MockBundle = {
  slug: string;
  title: string;
  tests: MockTestMeta[];
};

const DATA_DIR = path.join(process.cwd(), "data", "mock-tests");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

const BUNDLE_TITLES: Record<string, string> = {
  btrs: "BTRs — Subject & Grand Tests",
};

export async function getMockBundles(): Promise<MockBundle[]> {
  try {
    const root = await readJson<Array<{ slug: string; tests: MockTestMeta[] }>>(
      path.join(DATA_DIR, "index.json")
    );
    return root.map((b) => ({
      slug: b.slug,
      title: BUNDLE_TITLES[b.slug] ?? b.slug,
      tests: b.tests,
    }));
  } catch {
    return [];
  }
}

export async function getMockTest(
  bundleSlug: string,
  testId: string
): Promise<MockTest | null> {
  try {
    const test = await readJson<MockTest>(path.join(DATA_DIR, bundleSlug, `${testId}.json`));
    return test;
  } catch {
    return null;
  }
}

/** Finds which bundle owns a test id (ids are unique across bundles). */
export async function findMockTest(testId: string): Promise<{ bundle: string; test: MockTest } | null> {
  const bundles = await getMockBundles();
  for (const b of bundles) {
    if (b.tests.some((t) => t.id === testId)) {
      const test = await getMockTest(b.slug, testId);
      if (test) return { bundle: b.slug, test };
    }
  }
  return null;
}
