import { METRIC, normalizePost, toInsightSeries } from "@/lib/facebook/analysis";
import type {
  GraphResult,
  InsightSeries,
  PagePost,
  PageProfile,
  RawInsight,
  RawPageProfile,
  RawPost,
} from "@/lib/facebook/types";

/**
 * Server-side Facebook Graph API client.
 *
 * Every function returns a GraphResult instead of throwing, so pages can
 * always render an empty state instead of crashing. Access tokens must never
 * reach the browser: only import this module from server components, server
 * actions, or route handlers.
 */
const GRAPH_BASE = "https://graph.facebook.com/v21.0";

type RawErrorBody = { error?: { message?: string; code?: number } };

export async function graphGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  accessToken: string,
): Promise<GraphResult<T>> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  url.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    console.error("[graph] Request failed before reaching Facebook", error);
    return {
      ok: false,
      error: {
        message: "Could not reach the Facebook Graph API.",
        expiredToken: false,
      },
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body; fall through to the status check below.
  }

  const graphError = (payload as RawErrorBody | null)?.error;
  if (!response.ok || graphError) {
    return {
      ok: false,
      error: {
        message:
          graphError?.message ??
          `Graph API request failed with status ${response.status}.`,
        code: graphError?.code,
        expiredToken: graphError?.code === 190,
      },
    };
  }
  return { ok: true, data: payload as T };
}

// ── Page profile ────────────────────────────────────────────────────

const PAGE_PROFILE_FIELDS = [
  "id",
  "name",
  "category",
  "fan_count",
  "followers_count",
  "about",
  "link",
  "picture.width(200).height(200)",
  "cover",
].join(",");

export async function getPageProfile(
  pageId: string,
  accessToken: string,
): Promise<GraphResult<PageProfile>> {
  const result = await graphGet<RawPageProfile>(
    pageId,
    { fields: PAGE_PROFILE_FIELDS },
    accessToken,
  );
  if (!result.ok) return result;
  const raw = result.data;
  return {
    ok: true,
    data: {
      id: raw.id,
      name: raw.name,
      category: raw.category ?? null,
      fanCount: raw.fan_count ?? 0,
      followersCount: raw.followers_count ?? null,
      about: raw.about ?? null,
      link: raw.link ?? null,
      pictureUrl: raw.picture?.data?.url ?? null,
      coverUrl: raw.cover?.source ?? null,
    },
  };
}

/** Calls /me to confirm a stored token is still live. */
export async function verifyToken(
  accessToken: string,
): Promise<GraphResult<{ id: string; name?: string }>> {
  return graphGet<{ id: string; name?: string }>(
    "me",
    { fields: "id,name" },
    accessToken,
  );
}

// ── Posts ───────────────────────────────────────────────────────────

const POST_FIELDS = [
  "id",
  "message",
  "story",
  "created_time",
  "permalink_url",
  "full_picture",
  "status_type",
  "is_published",
  "shares",
  "likes.summary(true).limit(0)",
  "comments.summary(true).limit(0)",
  "attachments{media_type,type}",
].join(",");

const POST_FIELDS_WITH_INSIGHTS = `${POST_FIELDS},insights.metric(${METRIC.postReach})`;

/**
 * Latest published posts, newest first. Per-post reach comes from the
 * insights field expansion; when the token lacks read_insights the call is
 * retried without it so the rest of the data still loads (reach stays null).
 */
export async function getPagePosts(
  pageId: string,
  pageName: string,
  accessToken: string,
  limit = 25,
): Promise<GraphResult<PagePost[]>> {
  const withInsights = await graphGet<{ data?: RawPost[] }>(
    `${pageId}/posts`,
    { fields: POST_FIELDS_WITH_INSIGHTS, limit },
    accessToken,
  );
  let raws: RawPost[];
  if (withInsights.ok) {
    raws = withInsights.data.data ?? [];
  } else {
    if (withInsights.error.expiredToken) return withInsights;
    const fallback = await graphGet<{ data?: RawPost[] }>(
      `${pageId}/posts`,
      { fields: POST_FIELDS, limit },
      accessToken,
    );
    if (!fallback.ok) return fallback;
    raws = fallback.data.data ?? [];
  }
  return {
    ok: true,
    data: raws.map((raw) => normalizePost(raw, pageId, pageName)),
  };
}

// ── Insights ────────────────────────────────────────────────────────

export type InsightPeriod = "day" | "week" | "days_28" | "lifetime";

/**
 * One unsupported metric makes Facebook fail the whole insights call, so on
 * failure each metric is retried individually and whatever the page can
 * serve is kept.
 */
async function fetchInsightsResilient(
  pageId: string,
  accessToken: string,
  metrics: string[],
  params: Record<string, string | number | undefined>,
): Promise<GraphResult<RawInsight[]>> {
  const combined = await graphGet<{ data?: RawInsight[] }>(
    `${pageId}/insights`,
    { ...params, metric: metrics.join(",") },
    accessToken,
  );
  if (combined.ok) return { ok: true, data: combined.data.data ?? [] };
  if (combined.error.expiredToken || metrics.length === 1) return combined;

  const collected: RawInsight[] = [];
  let lastError = combined.error;
  for (const metric of metrics) {
    const single = await graphGet<{ data?: RawInsight[] }>(
      `${pageId}/insights`,
      { ...params, metric },
      accessToken,
    );
    if (single.ok) {
      collected.push(...(single.data.data ?? []));
    } else {
      if (single.error.expiredToken) return single;
      lastError = single.error;
    }
  }
  return collected.length
    ? { ok: true, data: collected }
    : { ok: false, error: lastError };
}

export async function getPageInsights(
  pageId: string,
  accessToken: string,
  metrics: string[],
  options: { period?: InsightPeriod; sinceDays?: number } = {},
): Promise<GraphResult<InsightSeries>> {
  const { period = "day", sinceDays } = options;
  const params: Record<string, string | number | undefined> = { period };
  if (sinceDays !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    params.since = now - sinceDays * 86400;
    params.until = now;
  }
  const result = await fetchInsightsResilient(
    pageId,
    accessToken,
    metrics,
    params,
  );
  if (!result.ok) return result;
  return { ok: true, data: toInsightSeries(result.data) };
}
