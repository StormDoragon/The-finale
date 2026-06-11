import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { PostCard } from "@/components/post-card";
import { demoPosts } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

const TABS = ["all", "draft", "approved", "published", "rejected"] as const;
type Tab = (typeof TABS)[number];

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab: Tab = TABS.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : "all";

  const supabase = await createClient();
  let posts: Post[] = demoPosts;
  let loadError: string | undefined;
  if (supabase) {
    const result = await supabase
      .from("posts")
      .select("*, trends(title)")
      .order("created_at", { ascending: false });
    if (result.error) {
      console.error("[data] Unable to load post queue", result.error);
      loadError = "Your post queue could not be loaded. Please refresh and try again.";
      posts = [];
    } else {
      posts = (result.data as Post[]) || [];
    }
  }

  const visible =
    activeTab === "all" ? posts : posts.filter((p) => p.status === activeTab);

  return (
    <AppShell
      title="Post queue"
      description="Review every draft and decide when it is ready to publish."
    >
      <Notice message={params.message} error={params.error || loadError} />

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const count =
            tab === "all"
              ? posts.length
              : posts.filter((p) => p.status === tab).length;
          const isActive = tab === activeTab;
          return (
            <Link
              key={tab}
              href={`/queue?tab=${tab}`}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "border bg-white text-slate-500 hover:border-slate-400"
              }`}
            >
              {tab === "all"
                ? "All"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
              · {count}
            </Link>
          );
        })}
      </div>

      <div className="space-y-5">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} actionsEnabled={hasSupabaseEnv} />
        ))}
        {!visible.length && (
          <div className="card py-16 text-center">
            <p className="font-medium">
              {activeTab === "all"
                ? "Your queue is clear."
                : `No ${activeTab} posts.`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {activeTab === "all"
                ? "Generate a draft from one of your trends."
                : "Switch to a different tab to see other posts."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
