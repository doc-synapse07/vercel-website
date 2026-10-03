import { isR2Configured } from "./storage";

/**
 * Monthly R2 operations for the current calendar-month cycle, via Cloudflare's
 * GraphQL Analytics API — the same source as their dashboard.
 * Writes ≈ Class A, reads ≈ Class B. Returns null when CLOUDFLARE_API_TOKEN is
 * missing or the query fails; the dashboard then shows a static hint instead.
 */

export const R2_CLASS_A_CAP = 1_000_000;
export const R2_CLASS_B_CAP = 10_000_000;
export const R2_STORAGE_CAP_BYTES = 10 * 1024 * 1024 * 1024;
/** Neon free-tier storage cap shown on the usage bar. */
export const NEON_STORAGE_CAP_BYTES = 500 * 1024 * 1024;

export type R2MonthlyOps = {
  monthLabel: string;
  writes: number;
  reads: number;
};

export async function getR2MonthlyOps(): Promise<R2MonthlyOps | null> {
  if (!isR2Configured()) return null;
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (!token || !accountId) return null;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const end = now.toISOString();

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query R2MonthlyOps($accountTag: string!, $start: Time!, $end: Time!) {
          viewer {
            accounts(filter: { accountTag: $accountTag }) {
              r2OperationsAdaptiveGroups(
                limit: 100
                filter: { datetime_geq: $start, datetime_leq: $end }
              ) {
                dimensions { actionType }
                sum { requests }
              }
            }
          }
        }`,
        variables: { accountTag: accountId, start, end },
      }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        viewer?: {
          accounts?: Array<{
            r2OperationsAdaptiveGroups?: Array<{
              dimensions?: { actionType?: string };
              sum?: { requests?: number };
            }>;
          }>;
        };
      };
    };
    const groups = json.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups;
    if (!groups) return null;

    let writes = 0;
    let reads = 0;
    for (const g of groups) {
      const action = (g.dimensions?.actionType || "").toLowerCase();
      const count = g.sum?.requests || 0;
      if (action.includes("get") || action.includes("head") || action.includes("select")) {
        reads += count;
      } else {
        writes += count;
      }
    }
    const monthLabel = now.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
    return { monthLabel, writes, reads };
  } catch {
    return null;
  }
}
