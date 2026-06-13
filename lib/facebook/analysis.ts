import type {
  InsightPoint,
  InsightSeries,
  PagePost,
  PostType,
  RawInsight,
  RawPost,
} from "@/lib/facebook/types";

/**
 * Pure helpers for turning Graph API responses into dashboard numbers.
 * Keep this module free of runtime imports so the node test runner can
 * execute it directly with type stripping.
 */

export const METRIC = {
  fans: "page_fans",
  reach: "page_impressions_unique_v2",
  engagements: "page_post_engagements",
  fanAdds: "page_fan_adds",
  videoViews: "page_video_views",
  fansGenderAge: "page_fans_gender_age",
  fansCountry: "page_fans_country",
  postReach: "post_impressions_unique",
} as const;

// ── Raw response parsing ────────────────────────────────────────────

/** Numeric daily values per metric, oldest first (as Facebook returns them). */
export function toInsightSeries(raws: RawInsight[]): InsightSeries {
  const series: InsightSeries = {};
  for (const raw of raws) {
    const points: InsightPoint[] = [];
    for (const value of raw.values ?? []) {
      if (typeof value.value === "number") {
        points.push({ date: value.end_time ?? "", value: value.value });
      }
    }
    series[raw.name] = points;
  }
  return series;
}

/** Latest object-valued breakdown (demographics) for a metric, if present. */
export function latestBreakdown(
  raws: RawInsight[],
  metric: string,
): Record<string, number> | null {
  const raw = raws.find((entry) => entry.name === metric);
  const values = raw?.values ?? [];
  for (let index = values.length - 1; index >= 0; index--) {
    const value = values[index]?.value;
    if (value && typeof value === "object") {
      const entries = Object.entries(value).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      );
      if (entries.length) return Object.fromEntries(entries);
    }
  }
  return null;
}

// ── Series math ─────────────────────────────────────────────────────

/** Sum of the last `lastN` points (or all). Null when the series is missing. */
export function sumPoints(
  points: InsightPoint[] | undefined,
  lastN?: number,
): number | null {
  if (!points || points.length === 0) return null;
  const window = lastN === undefined ? points : points.slice(-lastN);
  return window.reduce((total, point) => total + point.value, 0);
}

export function latestValue(points: InsightPoint[] | undefined): number | null {
  if (!points || points.length === 0) return null;
  return points[points.length - 1].value;
}

/** Change between the last point and the point `lastN` entries earlier. */
export function seriesDelta(
  points: InsightPoint[] | undefined,
  lastN: number,
): number | null {
  if (!points || points.length < 2) return null;
  const last = points[points.length - 1].value;
  const baseIndex = Math.max(0, points.length - 1 - lastN);
  return last - points[baseIndex].value;
}

/** New followers over the window: daily fan adds, falling back to the fan-count delta. */
export function followerGrowth(
  series: InsightSeries,
  days: number,
): number | null {
  const adds = sumPoints(series[METRIC.fanAdds], days);
  if (adds !== null) return adds;
  return seriesDelta(series[METRIC.fans], days);
}

export function averagePerDay(
  points: InsightPoint[] | undefined,
): number | null {
  const total = sumPoints(points);
  if (total === null || !points || points.length === 0) return null;
  return total / points.length;
}

// ── Posts ───────────────────────────────────────────────────────────

export function engagementOf(
  post: Pick<PagePost, "likes" | "comments" | "shares">,
): number {
  return post.likes + post.comments + post.shares;
}

export function detectPostType(
  raw: Pick<RawPost, "attachments" | "status_type" | "permalink_url">,
): PostType {
  const attachment = raw.attachments?.data?.[0];
  const hints =
    `${attachment?.media_type ?? ""} ${attachment?.type ?? ""} ${raw.status_type ?? ""}`.toLowerCase();
  if (hints.includes("reel") || raw.permalink_url?.includes("/reel/")) {
    return "reel";
  }
  if (hints.includes("video")) return "video";
  if (hints.includes("photo") || hints.includes("album")) return "photo";
  if (hints.includes("share") || hints.includes("link")) return "link";
  return "text";
}

export function normalizePost(
  raw: RawPost,
  pageId: string,
  pageName: string,
): PagePost {
  const reachInsight = raw.insights?.data?.find(
    (entry) => entry.name === METRIC.postReach,
  );
  const reachValue = reachInsight?.values?.[0]?.value;
  return {
    id: raw.id,
    pageId,
    pageName,
    message: raw.message ?? raw.story ?? "",
    createdTime: raw.created_time,
    type: detectPostType(raw),
    thumbnailUrl: raw.full_picture ?? null,
    permalinkUrl: raw.permalink_url ?? null,
    likes: raw.likes?.summary?.total_count ?? 0,
    comments: raw.comments?.summary?.total_count ?? 0,
    shares: raw.shares?.count ?? 0,
    reach: typeof reachValue === "number" ? reachValue : null,
    isPublished: raw.is_published ?? true,
  };
}

/** Highest-engagement post, optionally restricted to posts after `sinceMs`. */
export function topPost(posts: PagePost[], sinceMs?: number): PagePost | null {
  const pool =
    sinceMs === undefined
      ? posts
      : posts.filter((post) => Date.parse(post.createdTime) >= sinceMs);
  if (pool.length === 0) return null;
  return pool.reduce((best, post) =>
    engagementOf(post) > engagementOf(best) ? post : best,
  );
}

export function countPostsSince(posts: PagePost[], sinceMs: number): number {
  return posts.filter((post) => Date.parse(post.createdTime) >= sinceMs).length;
}

// ── Posting-time and format analysis ────────────────────────────────

export type TimeBucket = {
  key: number;
  label: string;
  averageEngagement: number;
  posts: number;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function bucketize(
  posts: PagePost[],
  size: number,
  keyOf: (date: Date) => number,
  labelOf: (key: number) => string,
): TimeBucket[] {
  const totals = Array.from({ length: size }, () => ({ total: 0, posts: 0 }));
  for (const post of posts) {
    const time = new Date(post.createdTime);
    if (Number.isNaN(time.getTime())) continue;
    const bucket = totals[keyOf(time)];
    bucket.total += engagementOf(post);
    bucket.posts += 1;
  }
  return totals.map((bucket, key) => ({
    key,
    label: labelOf(key),
    averageEngagement:
      bucket.posts === 0 ? 0 : Math.round(bucket.total / bucket.posts),
    posts: bucket.posts,
  }));
}

/** Average engagement per post by UTC hour (24 chronological buckets). */
export function engagementByHour(posts: PagePost[]): TimeBucket[] {
  return bucketize(posts, 24, (date) => date.getUTCHours(), formatHourLabel);
}

/** Average engagement per post by UTC weekday (Sunday first). */
export function engagementByWeekday(posts: PagePost[]): TimeBucket[] {
  return bucketize(posts, 7, (date) => date.getUTCDay(), (key) => DAY_NAMES[key]);
}

/** Best-performing buckets that actually contain posts. */
export function topBuckets(buckets: TimeBucket[], limit = 3): TimeBucket[] {
  return buckets
    .filter((bucket) => bucket.posts > 0)
    .sort(
      (a, b) =>
        b.averageEngagement - a.averageEngagement || b.posts - a.posts,
    )
    .slice(0, limit);
}

export type FormatBreakdown = {
  type: PostType;
  posts: number;
  averageEngagement: number;
};

/** Post formats ranked by average engagement. */
export function postFormatBreakdown(posts: PagePost[]): FormatBreakdown[] {
  const groups = new Map<PostType, { total: number; posts: number }>();
  for (const post of posts) {
    const group = groups.get(post.type) ?? { total: 0, posts: 0 };
    group.total += engagementOf(post);
    group.posts += 1;
    groups.set(post.type, group);
  }
  return [...groups.entries()]
    .map(([type, group]) => ({
      type,
      posts: group.posts,
      averageEngagement: Math.round(group.total / group.posts),
    }))
    .sort(
      (a, b) => b.averageEngagement - a.averageEngagement || b.posts - a.posts,
    );
}

// ── Monetization estimates ──────────────────────────────────────────

/**
 * Whole days until `current` reaches `target` at `perDay` growth.
 * 0 when already reached, null when the rate is unknown or non-positive.
 */
export function estimateDaysToTarget(
  current: number,
  target: number,
  perDay: number | null,
): number | null {
  if (current >= target) return 0;
  if (perDay === null || !Number.isFinite(perDay) || perDay <= 0) return null;
  return Math.ceil((target - current) / perDay);
}
