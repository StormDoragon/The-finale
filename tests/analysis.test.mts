import assert from "node:assert/strict";
import test from "node:test";
import {
  countPostsSince,
  detectPostType,
  engagementByHour,
  engagementByWeekday,
  engagementOf,
  estimateDaysToTarget,
  followerGrowth,
  latestBreakdown,
  latestValue,
  METRIC,
  normalizePost,
  postFormatBreakdown,
  seriesDelta,
  sumPoints,
  toInsightSeries,
  topBuckets,
  topPost,
} from "../lib/facebook/analysis.ts";
import type { PagePost, RawPost } from "../lib/facebook/types.ts";

function makePost(overrides: Partial<PagePost> = {}): PagePost {
  return {
    id: "1_1",
    pageId: "1",
    pageName: "Test page",
    message: "Hello",
    createdTime: "2026-06-01T12:30:00+0000",
    type: "text",
    thumbnailUrl: null,
    permalinkUrl: null,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: null,
    isPublished: true,
    ...overrides,
  };
}

test("toInsightSeries keeps numeric daily values per metric", () => {
  const series = toInsightSeries([
    {
      name: "page_impressions_unique",
      values: [
        { value: 10, end_time: "2026-06-01T07:00:00+0000" },
        { value: 20, end_time: "2026-06-02T07:00:00+0000" },
      ],
    },
    { name: "page_fans_country", values: [{ value: { US: 5 } }] },
  ]);
  assert.deepEqual(series.page_impressions_unique.map((p) => p.value), [10, 20]);
  assert.deepEqual(series.page_fans_country, []);
});

test("latestBreakdown returns the newest object value", () => {
  const breakdown = latestBreakdown(
    [
      {
        name: "page_fans_country",
        values: [{ value: { US: 5, CA: 2 } }, { value: { US: 9, CA: 3 } }],
      },
    ],
    "page_fans_country",
  );
  assert.deepEqual(breakdown, { US: 9, CA: 3 });
  assert.equal(latestBreakdown([], "page_fans_country"), null);
});

test("series math handles windows and missing data", () => {
  const points = [10, 20, 30, 40].map((value, index) => ({
    date: `2026-06-0${index + 1}T07:00:00+0000`,
    value,
  }));
  assert.equal(sumPoints(points), 100);
  assert.equal(sumPoints(points, 2), 70);
  assert.equal(sumPoints(undefined), null);
  assert.equal(sumPoints([], 7), null);
  assert.equal(latestValue(points), 40);
  assert.equal(seriesDelta(points, 2), 20);
  assert.equal(seriesDelta(points, 10), 30);
  assert.equal(seriesDelta(undefined, 7), null);
});

test("followerGrowth prefers fan adds and falls back to the fan delta", () => {
  const fans = [100, 105, 112].map((value, index) => ({
    date: `2026-06-0${index + 1}`,
    value,
  }));
  const adds = [2, 3].map((value, index) => ({
    date: `2026-06-0${index + 2}`,
    value,
  }));
  assert.equal(followerGrowth({ [METRIC.fans]: fans, [METRIC.fanAdds]: adds }, 7), 5);
  assert.equal(followerGrowth({ [METRIC.fans]: fans }, 2), 12);
  assert.equal(followerGrowth({}, 7), null);
});

test("detectPostType classifies attachments, reels, and bare statuses", () => {
  assert.equal(
    detectPostType({ attachments: { data: [{ media_type: "photo" }] } }),
    "photo",
  );
  assert.equal(
    detectPostType({ attachments: { data: [{ media_type: "video" }] } }),
    "video",
  );
  assert.equal(
    detectPostType({
      attachments: { data: [{ media_type: "video" }] },
      permalink_url: "https://www.facebook.com/reel/123",
    }),
    "reel",
  );
  assert.equal(
    detectPostType({ attachments: { data: [{ type: "share" }] } }),
    "link",
  );
  assert.equal(detectPostType({ status_type: "mobile_status_update" }), "text");
});

test("normalizePost maps Graph fields and per-post reach", () => {
  const raw: RawPost = {
    id: "1_99",
    message: "Big news",
    created_time: "2026-06-02T10:00:00+0000",
    permalink_url: "https://www.facebook.com/1/posts/99",
    full_picture: "https://scontent.fbcdn.net/thumb.jpg",
    is_published: true,
    shares: { count: 4 },
    likes: { summary: { total_count: 12 } },
    comments: { summary: { total_count: 3 } },
    attachments: { data: [{ media_type: "photo" }] },
    insights: {
      data: [{ name: "post_impressions_unique", values: [{ value: 250 }] }],
    },
  };
  const post = normalizePost(raw, "1", "Test page");
  assert.equal(post.type, "photo");
  assert.equal(post.likes, 12);
  assert.equal(post.comments, 3);
  assert.equal(post.shares, 4);
  assert.equal(post.reach, 250);
  assert.equal(engagementOf(post), 19);

  const sparse = normalizePost({ id: "1_2", created_time: "x" }, "1", "Test page");
  assert.equal(sparse.reach, null);
  assert.equal(sparse.message, "");
  assert.equal(engagementOf(sparse), 0);
});

test("topPost and countPostsSince respect the time window", () => {
  const old = makePost({ id: "old", createdTime: "2026-05-01T00:00:00+0000", likes: 100 });
  const recent = makePost({ id: "recent", createdTime: "2026-06-02T00:00:00+0000", likes: 10 });
  const cutoff = Date.parse("2026-06-01T00:00:00+0000");
  assert.equal(topPost([old, recent])?.id, "old");
  assert.equal(topPost([old, recent], cutoff)?.id, "recent");
  assert.equal(topPost([], cutoff), null);
  assert.equal(countPostsSince([old, recent], cutoff), 1);
});

test("posting-time buckets average engagement by UTC hour and weekday", () => {
  const posts = [
    makePost({ createdTime: "2026-06-01T13:10:00+0000", likes: 10 }), // Monday 13h
    makePost({ createdTime: "2026-06-08T13:50:00+0000", likes: 30 }), // Monday 13h
    makePost({ createdTime: "2026-06-03T09:00:00+0000", likes: 5 }), // Wednesday 9h
  ];
  const byHour = engagementByHour(posts);
  assert.equal(byHour.length, 24);
  assert.equal(byHour[13].averageEngagement, 20);
  assert.equal(byHour[13].posts, 2);
  assert.equal(byHour[9].averageEngagement, 5);

  const byDay = engagementByWeekday(posts);
  assert.equal(byDay.length, 7);
  assert.equal(byDay[1].label, "Monday");
  assert.equal(byDay[1].averageEngagement, 20);

  const top = topBuckets(byHour, 2);
  assert.deepEqual(top.map((bucket) => bucket.key), [13, 9]);
});

test("postFormatBreakdown ranks formats by average engagement", () => {
  const posts = [
    makePost({ type: "photo", likes: 10 }),
    makePost({ type: "photo", likes: 30 }),
    makePost({ type: "video", likes: 50 }),
  ];
  const breakdown = postFormatBreakdown(posts);
  assert.deepEqual(breakdown, [
    { type: "video", posts: 1, averageEngagement: 50 },
    { type: "photo", posts: 2, averageEngagement: 20 },
  ]);
});

test("estimateDaysToTarget handles reached, unknown, and growing cases", () => {
  assert.equal(estimateDaysToTarget(12000, 10000, 5), 0);
  assert.equal(estimateDaysToTarget(4000, 10000, 100), 60);
  assert.equal(estimateDaysToTarget(4000, 10000, 7), 858);
  assert.equal(estimateDaysToTarget(4000, 10000, 0), null);
  assert.equal(estimateDaysToTarget(4000, 10000, null), null);
});
