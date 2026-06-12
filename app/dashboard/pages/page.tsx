import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Settings, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { RefreshButton } from "@/components/refresh-button";
import { getPageProfile } from "@/lib/facebook/graph";
import type { GraphResult, PageProfile } from "@/lib/facebook/types";
import { getConnectedPages } from "@/lib/facebook/service";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PagesOverview() {
  const { pages, configError, loadError } = await getConnectedPages();
  const blockingError = configError ?? loadError;

  let profiles: GraphResult<PageProfile>[] = [];
  if (!blockingError && pages.length > 0) {
    profiles = await Promise.all(
      pages.map((page) => getPageProfile(page.pageId, page.accessToken)),
    );
  }

  return (
    <>
      <PageHeader
        title="Pages"
        description="Every Facebook page connected to Liberation OS."
      >
        <RefreshButton />
      </PageHeader>
      <Notice error={blockingError ?? undefined} />

      {pages.length === 0 && !blockingError && (
        <EmptyState
          icon={Users}
          title="No pages connected"
          message="Add a page with its access token in Settings to see it here."
        >
          <Link href="/dashboard/settings" className="btn-primary">
            <Settings size={16} /> Open settings
          </Link>
        </EmptyState>
      )}

      {blockingError && (
        <EmptyState
          icon={Users}
          title="Pages are unavailable"
          message="Once the configuration above is fixed, your connected pages will load here."
        >
          <RefreshButton label="Try again" />
        </EmptyState>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pages.map((page, index) => {
          const result = profiles[index];
          const profile = result?.ok ? result.data : null;
          return (
            <Link
              key={page.pageId}
              href={`/dashboard/pages/${page.pageId}`}
              className="card group p-5 transition hover:border-emerald-400/30"
            >
              <div className="flex items-center gap-4">
                {profile?.pictureUrl ? (
                  <Image
                    src={profile.pictureUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-400/10 text-xl font-semibold text-blue-300">
                    {page.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {profile?.name ?? page.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {profile?.category ?? `Page ${page.pageId}`}
                  </p>
                </div>
              </div>
              {profile ? (
                <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                  {formatNumber(profile.fanCount)}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    followers
                  </span>
                </p>
              ) : (
                <p className="mt-5 text-sm leading-6 text-amber-300/90">
                  {result && !result.ok && result.error.expiredToken
                    ? "Token expired — update it in Settings."
                    : "Stats could not be loaded for this page."}
                </p>
              )}
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                View stats{" "}
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-0.5"
                />
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
