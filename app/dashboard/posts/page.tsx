import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  FileText,
  Filter,
  Settings,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GraphIssues, type GraphIssue } from "@/components/graph-issues";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { PostTypeBadge } from "@/components/post-badges";
import { RefreshButton } from "@/components/refresh-button";
import { engagementOf } from "@/lib/facebook/analysis";
import { getPagePosts } from "@/lib/facebook/graph";
import { getConnectedPages } from "@/lib/facebook/service";
import type { PagePost, PostType } from "@/lib/facebook/types";
import { formatCompact, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;
const TYPES: PostType[] = ["photo", "video", "reel", "link", "text"];
const SORTS = [
  { value: "date", label: "Newest first" },
  { value: "reach", label: "Highest reach" },
  { value: "engagement", label: "Most engagement" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function sortPosts(posts: PagePost[], sort: Sort): PagePost[] {
  const sorted = [...posts];
  if (sort === "reach") {
    sorted.sort((a, b) => (b.reach ?? -1) - (a.reach ?? -1));
  } else if (sort === "engagement") {
    sorted.sort((a, b) => engagementOf(b) - engagementOf(a));
  } else {
    sorted.sort(
      (a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime),
    );
  }
  return sorted;
}

export default async function PostsMonitor({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    range?: string;
    type?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const { pages, configError, loadError } = await getConnectedPages();
  const blockingError = configError ?? loadError;

  const pageFilter = pages.some((page) => page.pageId === params.page)
    ? (params.page as string)
    : "all";
  const rangeDays = RANGES.some((range) => range.value === params.range)
    ? Number(params.range)
    : 30;
  const typeFilter = TYPES.includes(params.type as PostType)
    ? (params.type as PostType)
    : "all";
  const sort: Sort = SORTS.some((entry) => entry.value === params.sort)
    ? (params.sort as Sort)
    : "date";

  function hrefWithSort(nextSort: Sort) {
    const query = new URLSearchParams();
    if (pageFilter !== "all") query.set("page", pageFilter);
    query.set("range", String(rangeDays));
    if (typeFilter !== "all") query.set("type", typeFilter);
    query.set("sort", nextSort);
    return `/dashboard/posts?${query.toString()}`;
  }

  let posts: PagePost[] = [];
  const issues: GraphIssue[] = [];
  if (!blockingError && pages.length > 0) {
    const targets =
      pageFilter === "all"
        ? pages
        : pages.filter((page) => page.pageId === pageFilter);
    const results = await Promise.all(
      targets.map((page) =>
        getPagePosts(page.pageId, page.name, page.accessToken, 50),
      ),
    );
    results.forEach((result, index) => {
      if (result.ok) {
        posts.push(...result.data);
      } else {
        issues.push({ name: targets[index].name, error: result.error });
      }
    });

    const cutoff = Date.now() - rangeDays * DAY_MS;
    posts = posts.filter((post) => Date.parse(post.createdTime) >= cutoff);
    if (typeFilter !== "all") {
      posts = posts.filter((post) => post.type === typeFilter);
    }
    posts = sortPosts(posts, sort).slice(0, 100);
  }

  const SortHeader = ({ label, value }: { label: string; value: Sort }) => (
    <Link
      href={hrefWithSort(value)}
      className={`inline-flex items-center gap-1 ${
        sort === value ? "text-white" : "hover:text-slate-200"
      }`}
    >
      {label}
      {sort === value && <ArrowDown size={12} />}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Posts"
        description="Every recent post across your connected pages, in one feed."
      >
        <RefreshButton />
      </PageHeader>
      <Notice error={blockingError ?? undefined} />
      <GraphIssues issues={issues} />

      {pages.length === 0 && !blockingError ? (
        <EmptyState
          icon={FileText}
          title="No pages connected"
          message="Connect a Facebook page in Settings to monitor its posts here."
        >
          <Link href="/dashboard/settings" className="btn-primary">
            <Settings size={16} /> Open settings
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Filters (plain GET form — server-rendered, no client JS) */}
          <form
            method="get"
            className="card mb-6 flex flex-wrap items-end gap-4 p-4"
          >
            <input type="hidden" name="sort" value={sort} />
            <div className="min-w-40 flex-1 sm:flex-none">
              <label className="label" htmlFor="filter-page">
                Page
              </label>
              <select
                id="filter-page"
                name="page"
                defaultValue={pageFilter}
                className="field"
              >
                <option value="all">All pages</option>
                {pages.map((page) => (
                  <option key={page.pageId} value={page.pageId}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-36 flex-1 sm:flex-none">
              <label className="label" htmlFor="filter-range">
                Date range
              </label>
              <select
                id="filter-range"
                name="range"
                defaultValue={String(rangeDays)}
                className="field"
              >
                {RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-32 flex-1 sm:flex-none">
              <label className="label" htmlFor="filter-type">
                Post type
              </label>
              <select
                id="filter-type"
                name="type"
                defaultValue={typeFilter}
                className="field"
              >
                <option value="all">All types</option>
                {TYPES.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-40 flex-1 sm:flex-none">
              <label className="label" htmlFor="filter-sort">
                Sort by
              </label>
              <select
                id="filter-sort"
                name="sort"
                defaultValue={sort}
                className="field"
              >
                {SORTS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary gap-2">
              <Filter size={15} /> Apply
            </button>
          </form>

          <section className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5 font-medium">Page</th>
                    <th className="px-5 py-3.5 font-medium">Post</th>
                    <th className="px-5 py-3.5 font-medium">
                      <SortHeader label="Date" value="date" />
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Likes
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Comments
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      Shares
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium">
                      <SortHeader label="Reach" value="reach" />
                    </th>
                    <th className="px-5 py-3.5 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/[.02]">
                      <td className="max-w-36 truncate px-5 py-4 text-slate-300">
                        {post.pageName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {post.thumbnailUrl ? (
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                              <Image
                                src={post.thumbnailUrl}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-600">
                              <FileText size={16} />
                            </div>
                          )}
                          <p className="line-clamp-2 max-w-72 text-slate-200">
                            {post.message || "(no text)"}
                          </p>
                          {post.permalinkUrl && (
                            <a
                              href={post.permalinkUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open post on Facebook"
                              className="shrink-0 text-slate-500 transition hover:text-emerald-300"
                            >
                              <ArrowUpRight size={15} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {formatDate(post.createdTime)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-200">
                        {formatCompact(post.likes)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-200">
                        {formatCompact(post.comments)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-200">
                        {formatCompact(post.shares)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-200">
                        {formatCompact(post.reach)}
                      </td>
                      <td className="px-5 py-4">
                        <PostTypeBadge type={post.type} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {posts.length === 0 && (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="text-sm text-slate-400">
                  {blockingError
                    ? "Posts will appear once the configuration above is fixed."
                    : "No posts match these filters. Posts are loaded from each page's 50 most recent."}
                </p>
                <RefreshButton label="Try again" />
              </div>
            )}
          </section>
          {posts.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Showing {posts.length} post{posts.length === 1 ? "" : "s"} ·
              loaded from each page&apos;s 50 most recent
            </p>
          )}
        </>
      )}
    </>
  );
}
