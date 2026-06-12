import Image from "next/image";
import Link from "next/link";
import { Coins, Info, Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GraphIssues, snapshotIssues } from "@/components/graph-issues";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { RefreshButton } from "@/components/refresh-button";
import {
  averagePerDay,
  estimateDaysToTarget,
  METRIC,
  seriesDelta,
  sumPoints,
} from "@/lib/facebook/analysis";
import {
  getConnectedPages,
  loadAllSnapshots,
  type PageSnapshot,
} from "@/lib/facebook/service";
import { formatCompact, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const FOLLOWER_TARGET = 10_000;
const REEL_PLAYS_TARGET = 600_000;
const WINDOW_DAYS = 60;

function ratePerDay(snapshot: PageSnapshot): number | null {
  const adds = averagePerDay(snapshot.series[METRIC.fanAdds]);
  if (adds !== null) return adds;
  const fans = snapshot.series[METRIC.fans];
  if (!fans || fans.length < 2) return null;
  const delta = seriesDelta(fans, fans.length - 1);
  return delta === null ? null : delta / (fans.length - 1);
}

function daysLabel(days: number | null, reached: boolean): string {
  if (reached) return "Target reached";
  if (days === null) return "Not enough growth data to estimate";
  return `≈ ${formatNumber(days)} day${days === 1 ? "" : "s"} to go at the current rate`;
}

function ThresholdRow({
  label,
  hint,
  value,
  target,
  perDay,
  perDayUnit,
  accent,
}: {
  label: string;
  hint: string;
  value: number | null;
  target: number;
  perDay: number | null;
  perDayUnit: string;
  accent: "emerald" | "blue";
}) {
  const reached = value !== null && value >= target;
  const days = value === null ? null : estimateDaysToTarget(value, target, perDay);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-white">
            {formatCompact(value)}
          </span>{" "}
          / {formatCompact(target)}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <div className="mt-2.5">
        <ProgressBar value={value} target={target} accent={accent} />
      </div>
      <p
        className={`mt-2 text-xs ${reached ? "font-medium text-emerald-300" : "text-slate-500"}`}
      >
        {daysLabel(days, reached)}
        {!reached && perDay !== null && perDay > 0 && (
          <span> · +{formatCompact(Math.round(perDay))} {perDayUnit}/day</span>
        )}
      </p>
    </div>
  );
}

function EligibilityBadge({
  followersReached,
  playsReached,
  hasData,
}: {
  followersReached: boolean;
  playsReached: boolean;
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
        In-stream ads: unknown
      </span>
    );
  }
  if (followersReached && playsReached) {
    return (
      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        In-stream ads: likely eligible
      </span>
    );
  }
  if (followersReached || playsReached) {
    return (
      <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        In-stream ads: almost there
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
      In-stream ads: not yet eligible
    </span>
  );
}

export default async function MonetizationPage() {
  const { pages, configError, loadError } = await getConnectedPages();
  const blockingError = configError ?? loadError;

  if (blockingError || pages.length === 0) {
    return (
      <>
        <PageHeader
          title="Monetization"
          description="Progress toward Meta's monetization thresholds, per page."
        />
        <Notice error={blockingError ?? undefined} />
        <EmptyState
          icon={Coins}
          title={
            blockingError ? "Monetization data is unavailable" : "No pages connected"
          }
          message={
            blockingError
              ? "Once the configuration above is fixed, threshold progress will load here."
              : "Connect a Facebook page in Settings to track its monetization progress."
          }
        >
          {blockingError ? (
            <RefreshButton label="Try again" />
          ) : (
            <Link href="/dashboard/settings" className="btn-primary">
              <Settings size={16} /> Open settings
            </Link>
          )}
        </EmptyState>
      </>
    );
  }

  const snapshots = await loadAllSnapshots(pages, {
    sinceDays: WINDOW_DAYS,
    postLimit: 0,
    metrics: [METRIC.fans, METRIC.fanAdds, METRIC.videoViews],
  });

  return (
    <>
      <PageHeader
        title="Monetization"
        description="Progress toward Meta's monetization thresholds, per page."
      >
        <RefreshButton />
      </PageHeader>
      <GraphIssues issues={snapshotIssues(snapshots)} />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[.02] px-4 py-3 text-xs leading-5 text-slate-400">
        <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p>
          Estimates only. Reel plays are approximated from the page&apos;s
          daily video views over the last {WINDOW_DAYS} days, and day counts
          assume the current growth rate holds. Meta&apos;s Professional
          Dashboard remains the source of truth for eligibility.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {snapshots.map((snapshot) => {
          const followers = snapshot.profile?.fanCount ?? null;
          const views60 = sumPoints(snapshot.series[METRIC.videoViews]);
          const followerRate = ratePerDay(snapshot);
          const viewsRate = averagePerDay(snapshot.series[METRIC.videoViews]);
          const followersReached =
            followers !== null && followers >= FOLLOWER_TARGET;
          const playsReached = views60 !== null && views60 >= REEL_PLAYS_TARGET;

          return (
            <section key={snapshot.page.pageId} className="card p-6">
              <div className="flex flex-wrap items-center gap-3">
                {snapshot.profile?.pictureUrl ? (
                  <Image
                    src={snapshot.profile.pictureUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-11 place-items-center rounded-xl bg-blue-400/10 text-base font-semibold text-blue-300">
                    {snapshot.page.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-white">
                    {snapshot.page.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {formatNumber(followers)} followers
                  </p>
                </div>
                <EligibilityBadge
                  followersReached={followersReached}
                  playsReached={playsReached}
                  hasData={followers !== null || views60 !== null}
                />
              </div>

              <div className="mt-6 space-y-6">
                <ThresholdRow
                  label="Followers"
                  hint={`Meta requires ${formatCompact(FOLLOWER_TARGET)} followers`}
                  value={followers}
                  target={FOLLOWER_TARGET}
                  perDay={followerRate}
                  perDayUnit="followers"
                  accent="emerald"
                />
                <ThresholdRow
                  label={`Reel plays · last ${WINDOW_DAYS} days`}
                  hint={`Meta requires ${formatCompact(REEL_PLAYS_TARGET)} plays in ${WINDOW_DAYS} days (video views used as proxy)`}
                  value={views60}
                  target={REEL_PLAYS_TARGET}
                  perDay={viewsRate}
                  perDayUnit="views"
                  accent="blue"
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
