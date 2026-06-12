import { METRIC } from "@/lib/facebook/analysis";
import {
  getPageInsights,
  getPagePosts,
  getPageProfile,
} from "@/lib/facebook/graph";
import type {
  GraphError,
  InsightSeries,
  PagePost,
  PageProfile,
} from "@/lib/facebook/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PageTokenRow } from "@/lib/types";

/** A page_tokens row shaped for the dashboard. Server-side only. */
export type ConnectedPage = {
  rowId: string;
  pageId: string;
  name: string;
  accessToken: string;
  createdAt: string;
};

export type ConnectedPagesResult = {
  pages: ConnectedPage[];
  /** Set when Supabase env vars are missing — settings cannot help until fixed. */
  configError: string | null;
  /** Set when the page_tokens query itself failed. */
  loadError: string | null;
};

export async function getConnectedPages(): Promise<ConnectedPagesResult> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      pages: [],
      configError:
        "Supabase is not fully configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to load page data.",
      loadError: null,
    };
  }
  const result = await admin
    .from("page_tokens")
    .select("*")
    .order("created_at", { ascending: true });
  if (result.error) {
    console.error("[data] Unable to load page tokens", result.error);
    return {
      pages: [],
      configError: null,
      loadError: "Connected pages could not be loaded from Supabase.",
    };
  }
  const rows = (result.data as PageTokenRow[]) ?? [];
  return {
    pages: rows.map((row) => ({
      rowId: row.id,
      pageId: row.page_id,
      name: row.page_name || `Page ${row.page_id}`,
      accessToken: row.access_token,
      createdAt: row.created_at,
    })),
    configError: null,
    loadError: null,
  };
}

export const CORE_METRICS = [
  METRIC.fans,
  METRIC.reach,
  METRIC.engagements,
  METRIC.fanAdds,
];

/** Everything the dashboard needs about one page, fetched in parallel. */
export type PageSnapshot = {
  page: ConnectedPage;
  profile: PageProfile | null;
  series: InsightSeries;
  posts: PagePost[];
  errors: GraphError[];
};

export async function loadPageSnapshot(
  page: ConnectedPage,
  options: { sinceDays?: number; postLimit?: number; metrics?: string[] } = {},
): Promise<PageSnapshot> {
  const { sinceDays = 30, postLimit = 25, metrics = CORE_METRICS } = options;
  const [profile, insights, posts] = await Promise.all([
    getPageProfile(page.pageId, page.accessToken),
    getPageInsights(page.pageId, page.accessToken, metrics, {
      period: "day",
      sinceDays,
    }),
    getPagePosts(page.pageId, page.name, page.accessToken, postLimit),
  ]);
  const errors: GraphError[] = [];
  if (!profile.ok) errors.push(profile.error);
  if (!insights.ok) errors.push(insights.error);
  if (!posts.ok) errors.push(posts.error);
  return {
    page,
    profile: profile.ok ? profile.data : null,
    series: insights.ok ? insights.data : {},
    posts: posts.ok ? posts.data : [],
    errors,
  };
}

export async function loadAllSnapshots(
  pages: ConnectedPage[],
  options?: Parameters<typeof loadPageSnapshot>[1],
): Promise<PageSnapshot[]> {
  return Promise.all(pages.map((page) => loadPageSnapshot(page, options)));
}
