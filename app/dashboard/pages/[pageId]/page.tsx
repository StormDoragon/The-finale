import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Eye,
  FileText,
  Globe,
  MessageCircle,
  Share2,
  ThumbsUp,
  Users,
} from "lucide-react";
import { AreaTrendChart, BarsChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { GraphIssues, snapshotIssues } from "@/components/graph-issues";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { PostTypeBadge, PublishedBadge } from "@/components/post-badges";
import { RefreshButton } from "@/components/refresh-button";
import {
  engagementByHour,
  engagementByWeekday,
  METRIC,
  postFormatBreakdown,
  topBuckets,
} from "@/lib/facebook/analysis";
import { getConnectedPages, loadPageSnapshot } from "@/lib/facebook/service";
import type { PagePost } from "@/lib/facebook/types";
import {
  formatCompact,
  formatDate,
  formatNumber,
  toChartPoints,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "posts", label: "Posts" },
  { key: "insights", label: "Insights" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{caption}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NoChartData() {
  return (
    <p className="grid h-40 place-items-center text-sm text-slate-500">
      No data available for this period.
    </p>
  );
}

function PostRow({ post }: { post: PagePost }) {
  return (
    <div className="flex flex-wrap items-start gap-4 p-5">
      {post.thumbnailUrl ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
          <Image
            src={post.thumbnailUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-600">
          <FileText size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1 basis-52">
        <p className="line-clamp-2 text-sm leading-6 text-slate-200">
          {post.message || "(no text)"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{formatDate(post.createdTime)}</span>
          <PostTypeBadge type={post.type} />
          <PublishedBadge published={post.isPublished} />
          {post.permalinkUrl && (
            <a
              href={post.permalinkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-300"
            >
              Open <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-4 gap-4 text-right">
        {(
          [
            [ThumbsUp, "Likes", formatCompact(post.likes)],
            [MessageCircle, "Comments", formatCompact(post.comments)],
            [Share2, "Shares", formatCompact(post.shares)],
            [Eye, "Reach", formatCompact(post.reach)],
          ] as const
        ).map(([Icon, label, value]) => (
          <div key={label}>
            <dt className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
              <Icon size={11} /> {label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function PageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ pageId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { pageId } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.some((entry) => entry.key === rawTab)
    ? (rawTab as Tab)
    : "overview";

  const { pages, configError, loadError } = await getConnectedPages();
  const page = pages.find((entry) => entry.pageId === pageId);

  if (!page) {
    return (
      <>
        <PageHeader title="Page detail" description="Stats for a single page.">
          <Link href="/dashboard/pages" className="btn-secondary gap-2">
            <ArrowLeft size={15} /> All pages
          </Link>
        </PageHeader>
        <Notice error={configError ?? loadError ?? undefined} />
        <EmptyState
          icon={Users}
          title="This page is not connected"
          message="It may have been removed, or the ID in the URL is wrong. Connect it in Settings to monitor it."
        >
          <Link href="/dashboard/settings" className="btn-primary">
            Open settings
          </Link>
        </EmptyState>
      </>
    );
  }

  const snapshot = await loadPageSnapshot(page, {
    sinceDays: 30,
    postLimit: 50,
  });
  const profile = snapshot.profile;
  const recentPosts = snapshot.posts;
  const displayedPosts = recentPosts.slice(0, 20);

  const followerPoints = toChartPoints(snapshot.series[METRIC.fans]);
  const reachPoints = toChartPoints(snapshot.series[METRIC.reach]);
  const engagementPoints = toChartPoints(snapshot.series[METRIC.engagements]);
  const hourBuckets = engagementByHour(recentPosts);
  const dayBuckets = engagementByWeekday(recentPosts);
  const formats = postFormatBreakdown(recentPosts);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/dashboard/pages"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={15} /> All pages
        </Link>
        <RefreshButton />
      </div>

      {/* Page header: cover, avatar, identity */}
      <section className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-blue-400/10 via-emerald-400/10 to-violet-400/10 sm:h-44">
          {profile?.coverUrl && (
            <Image
              src={profile.coverUrl}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-transparent to-transparent" />
        </div>
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <div className="-mt-10 shrink-0">
            {profile?.pictureUrl ? (
              <Image
                src={profile.pictureUrl}
                alt=""
                width={80}
                height={80}
                className="size-20 rounded-2xl border-4 border-[#0d1424] object-cover"
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-2xl border-4 border-[#0d1424] bg-blue-400/20 text-2xl font-semibold text-blue-200">
                {page.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white">
              {profile?.name ?? page.name}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {[
                profile?.category,
                profile ? `${formatNumber(profile.fanCount)} followers` : null,
              ]
                .filter(Boolean)
                .join(" · ") || `Page ${page.pageId}`}
            </p>
          </div>
          {profile?.link && (
            <a
              href={profile.link}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary mb-1 gap-2"
            >
              <Globe size={15} /> View on Facebook
            </a>
          )}
        </div>
      </section>

      <GraphIssues issues={snapshotIssues([snapshot])} />

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-white/5" role="tablist">
        {TABS.map((entry) => (
          <Link
            key={entry.key}
            href={
              entry.key === "overview"
                ? `/dashboard/pages/${pageId}`
                : `/dashboard/pages/${pageId}?tab=${entry.key}`
            }
            aria-current={tab === entry.key ? "page" : undefined}
            className={
              tab === entry.key
                ? "-mb-px border-b-2 border-emerald-300 px-4 py-2.5 text-sm font-semibold text-white"
                : "px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
            }
          >
            {entry.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 space-y-6">
          <ChartCard
            title="Follower growth"
            caption="Total followers per day · last 30 days"
          >
            {followerPoints.length ? (
              <AreaTrendChart
                data={followerPoints}
                valueLabel="followers"
                color="#34d399"
              />
            ) : (
              <NoChartData />
            )}
          </ChartCard>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Reach" caption="Unique daily reach · last 30 days">
              {reachPoints.length ? (
                <AreaTrendChart
                  data={reachPoints}
                  valueLabel="people reached"
                  color="#60a5fa"
                />
              ) : (
                <NoChartData />
              )}
            </ChartCard>
            <ChartCard
              title="Engagement"
              caption="Daily post engagements · last 30 days"
            >
              {engagementPoints.length ? (
                <AreaTrendChart
                  data={engagementPoints}
                  valueLabel="engagements"
                  color="#a78bfa"
                />
              ) : (
                <NoChartData />
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {tab === "posts" && (
        <section className="card mt-6 overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <h2 className="font-semibold text-white">Latest posts</h2>
            <p className="mt-1 text-xs text-slate-400">
              The {displayedPosts.length} most recent published posts on this page
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {displayedPosts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
            {recentPosts.length === 0 && (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="text-sm text-slate-400">
                  No posts could be loaded for this page.
                </p>
                <RefreshButton />
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "insights" && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Best posting hours"
              caption={`Average engagement per post by hour (UTC) · last ${recentPosts.length} posts`}
            >
              {recentPosts.length ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {topBuckets(hourBuckets).map((bucket) => (
                      <span
                        key={bucket.key}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                      >
                        <Clock size={12} /> {bucket.label} ·{" "}
                        {formatCompact(bucket.averageEngagement)} avg
                      </span>
                    ))}
                  </div>
                  <BarsChart
                    data={hourBuckets.map((bucket) => ({
                      label: bucket.label,
                      value: bucket.averageEngagement,
                    }))}
                    valueLabel="avg engagements"
                    color="#34d399"
                    height={220}
                  />
                </>
              ) : (
                <NoChartData />
              )}
            </ChartCard>
            <ChartCard
              title="Best posting days"
              caption={`Average engagement per post by weekday · last ${recentPosts.length} posts`}
            >
              {recentPosts.length ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {topBuckets(dayBuckets).map((bucket) => (
                      <span
                        key={bucket.key}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300"
                      >
                        {bucket.label} · {formatCompact(bucket.averageEngagement)}{" "}
                        avg
                      </span>
                    ))}
                  </div>
                  <BarsChart
                    data={dayBuckets.map((bucket) => ({
                      label: bucket.label.slice(0, 3),
                      value: bucket.averageEngagement,
                    }))}
                    valueLabel="avg engagements"
                    color="#60a5fa"
                    height={220}
                  />
                </>
              ) : (
                <NoChartData />
              )}
            </ChartCard>
          </div>

          <ChartCard
            title="Top post formats"
            caption="Formats ranked by average engagement"
          >
            {formats.length ? (
              <div className="space-y-4">
                {formats.map((entry) => {
                  const best = formats[0];
                  const width = best.averageEngagement
                    ? Math.max(
                        4,
                        Math.round(
                          (entry.averageEngagement / best.averageEngagement) *
                            100,
                        ),
                      )
                    : 4;
                  return (
                    <div key={entry.type} className="flex items-center gap-4">
                      <div className="w-24 shrink-0">
                        <PostTypeBadge type={entry.type} />
                      </div>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-violet-400/70"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <p className="w-44 shrink-0 text-right text-xs text-slate-400">
                        {formatCompact(entry.averageEngagement)} avg ·{" "}
                        {entry.posts} post{entry.posts === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <NoChartData />
            )}
          </ChartCard>
        </div>
      )}
    </>
  );
}
