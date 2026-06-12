import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  FileText,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Percent,
  Send,
  Settings,
  Share2,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GraphIssues, snapshotIssues } from "@/components/graph-issues";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { RefreshButton } from "@/components/refresh-button";
import { StatCard } from "@/components/stat-card";
import {
  countPostsSince,
  followerGrowth,
  METRIC,
  sumPoints,
  topPost,
} from "@/lib/facebook/analysis";
import type { PagePost } from "@/lib/facebook/types";
import { getConnectedPages, loadAllSnapshots } from "@/lib/facebook/service";
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatPercent,
  formatSigned,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Sums per-page values, ignoring pages with no data; null when nothing is known. */
function sumKnown(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length
    ? known.reduce((total, value) => total + value, 0)
    : null;
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[.03] p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon size={13} /> {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function TopPostPanel({ post }: { post: PagePost | null }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-5">
        <div>
          <h2 className="font-semibold text-white">Top post this week</h2>
          <p className="mt-1 text-xs text-slate-400">
            Highest engagement across all connected pages
          </p>
        </div>
        <Trophy className="text-amber-300" size={18} />
      </div>
      {post ? (
        <div className="p-5">
          <div className="flex gap-4">
            {post.thumbnailUrl ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-white/5">
                <Image
                  src={post.thumbnailUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-600">
                <FileText size={26} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {post.pageName} · {formatDate(post.createdTime)}
              </p>
              <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-200">
                {post.message || "(no text)"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              icon={ThumbsUp}
              label="Likes"
              value={formatNumber(post.likes)}
            />
            <MiniStat
              icon={MessageCircle}
              label="Comments"
              value={formatNumber(post.comments)}
            />
            <MiniStat
              icon={Share2}
              label="Shares"
              value={formatNumber(post.shares)}
            />
            <MiniStat icon={Eye} label="Reach" value={formatCompact(post.reach)} />
          </div>
          {post.permalinkUrl && (
            <a
              href={post.permalinkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
            >
              View on Facebook <ArrowRight size={15} />
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-slate-400">
            No recent posts were found for your pages.
          </p>
          <RefreshButton />
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const { pages, configError, loadError } = await getConnectedPages();
  const blockingError = configError ?? loadError;

  if (blockingError || pages.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Live performance across your connected Facebook pages."
        />
        <Notice error={blockingError ?? undefined} />
        {blockingError ? (
          <EmptyState
            icon={LayoutDashboard}
            title="Dashboard data is unavailable"
            message="Once the configuration above is fixed, your page stats will load here."
          >
            <RefreshButton label="Try again" />
          </EmptyState>
        ) : (
          <EmptyState
            icon={LayoutDashboard}
            title="No pages connected yet"
            message="Connect a Facebook page with its access token to start monitoring reach, engagement, and growth."
          >
            <Link href="/dashboard/settings" className="btn-primary">
              <Settings size={16} /> Open settings
            </Link>
          </EmptyState>
        )}
      </>
    );
  }

  const snapshots = await loadAllSnapshots(pages);
  const weekAgo = Date.now() - WEEK_MS;

  const totalFollowers = sumKnown(
    snapshots.map((snapshot) => snapshot.profile?.fanCount ?? null),
  );
  const reach7 = sumKnown(
    snapshots.map((snapshot) => sumPoints(snapshot.series[METRIC.reach], 7)),
  );
  const reach30 = sumKnown(
    snapshots.map((snapshot) => sumPoints(snapshot.series[METRIC.reach])),
  );
  const engagements7 = sumKnown(
    snapshots.map((snapshot) =>
      sumPoints(snapshot.series[METRIC.engagements], 7),
    ),
  );
  const growth7 = sumKnown(
    snapshots.map((snapshot) => followerGrowth(snapshot.series, 7)),
  );
  const allPosts = snapshots.flatMap((snapshot) => snapshot.posts);
  const posts7 = countPostsSince(allPosts, weekAgo);
  const engagementRate =
    reach7 !== null && reach7 > 0 && engagements7 !== null
      ? (engagements7 / reach7) * 100
      : null;
  const bestPost = topPost(allPosts, weekAgo) ?? topPost(allPosts);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live performance across your connected Facebook pages."
      >
        <RefreshButton />
      </PageHeader>
      <GraphIssues issues={snapshotIssues(snapshots)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total followers"
          value={formatCompact(totalFollowers)}
          sub={`Across ${pages.length} connected page${pages.length === 1 ? "" : "s"}`}
          icon={Users}
          accent="emerald"
        />
        <StatCard
          label="Reach · last 7 days"
          value={formatCompact(reach7)}
          sub={`${formatCompact(reach30)} in the last 30 days`}
          icon={Eye}
          accent="blue"
        />
        <StatCard
          label="Engagements · last 7 days"
          value={formatCompact(engagements7)}
          sub="Likes, comments, and shares"
          icon={Heart}
          accent="violet"
        />
        <StatCard
          label="Posts published · last 7 days"
          value={formatNumber(posts7)}
          sub="Across all connected pages"
          icon={Send}
          accent="amber"
        />
        <StatCard
          label="Engagement rate · 7 days"
          value={formatPercent(engagementRate)}
          sub="Engagements ÷ reach"
          icon={Percent}
          accent="rose"
        />
        <StatCard
          label="Follower growth · 7 days"
          value={formatSigned(growth7)}
          sub="New followers this week"
          icon={TrendingUp}
          accent="sky"
        />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <TopPostPanel post={bestPost} />

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="font-semibold text-white">Pages at a glance</h2>
              <p className="mt-1 text-xs text-slate-400">
                Followers and 7-day reach per page
              </p>
            </div>
            <Link
              href="/dashboard/pages"
              className="text-sm font-semibold text-emerald-300"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {snapshots.map((snapshot) => (
              <Link
                key={snapshot.page.pageId}
                href={`/dashboard/pages/${snapshot.page.pageId}`}
                className="flex items-center gap-4 p-4 transition hover:bg-white/[.03]"
              >
                {snapshot.profile?.pictureUrl ? (
                  <Image
                    src={snapshot.profile.pictureUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-400/10 text-sm font-semibold text-blue-300">
                    {snapshot.page.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {snapshot.page.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatCompact(snapshot.profile?.fanCount ?? null)} followers
                    · {formatCompact(sumPoints(snapshot.series[METRIC.reach], 7))}{" "}
                    reach
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-600" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
