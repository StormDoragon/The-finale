import { Check, Facebook, Send, X } from "lucide-react";
import Link from "next/link";
import { updatePostStatus } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { StatusPill } from "@/components/status-pill";
import { SubmitButton } from "@/components/submit-button";
import { demoPosts } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

const TABS = ["all", "draft", "approved", "published", "rejected"] as const;
type Tab = (typeof TABS)[number];

function Action({
  id,
  status,
  children,
  primary = false,
}: {
  id: string;
  status: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <form action={updatePostStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        pendingLabel="…"
        disabled={!hasSupabaseEnv}
        className={primary ? "btn-primary" : "btn-secondary"}
      >
        {children}
      </SubmitButton>
    </form>
  );
}

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
          <article key={post.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-slate-50/60 px-5 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Facebook size={16} className="text-blue-600" /> Facebook{" "}
                {post.trends?.title && (
                  <>
                    <span>·</span>
                    <span className="max-w-64 truncate">
                      {post.trends.title}
                    </span>
                  </>
                )}
              </div>
              <StatusPill status={post.status} />
            </div>
            <div className="p-5 md:p-7">
              {post.editorial_note && (
                <div className="mb-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                  <span className="font-semibold">Voice guidance:</span>{" "}
                  {post.editorial_note}
                </div>
              )}
              <p className="max-w-3xl whitespace-pre-line text-[15px] leading-7 text-slate-700">
                {post.content}
              </p>
              <div className="mt-7 flex flex-wrap gap-3 border-t pt-5">
                {post.status === "draft" && (
                  <>
                    <Action id={post.id} status="approved" primary>
                      <Check size={16} /> Approve
                    </Action>
                    <Action id={post.id} status="rejected">
                      <X size={15} /> Reject
                    </Action>
                  </>
                )}
                {post.status === "approved" && (
                  <Action id={post.id} status="published" primary>
                    <Send size={15} /> Mark as published
                  </Action>
                )}
                {post.status === "published" && (
                  <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <Check size={15} /> Publishing complete
                  </p>
                )}
              </div>
            </div>
          </article>
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
