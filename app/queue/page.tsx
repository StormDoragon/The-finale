import { Check, Facebook, Send, X } from "lucide-react";
import { updatePostStatus } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { StatusPill } from "@/components/status-pill";
import { demoPosts } from "@/lib/demo-data";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

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
      <button
        disabled={!hasSupabaseEnv}
        className={primary ? "btn-primary" : "btn-secondary"}
      >
        {children}
      </button>
    </form>
  );
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  let posts: Post[] = demoPosts;
  if (supabase) {
    const result = await supabase
      .from("posts")
      .select("*, trends(title)")
      .order("created_at", { ascending: false });
    posts = (result.data as Post[]) || [];
  }
  const active = posts.filter((post) => post.status !== "rejected");
  return (
    <AppShell
      title="Post queue"
      description="Review every draft and decide when it is ready to publish."
    >
      <Notice {...params} />
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {["All", "Draft", "Approved", "Published"].map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${i === 0 ? "bg-slate-950 text-white" : "border bg-white text-slate-500"}`}
          >
            {label} {i === 0 && `· ${active.length}`}
          </span>
        ))}
      </div>
      <div className="space-y-5">
        {active.map((post) => (
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
        {!active.length && (
          <div className="card py-16 text-center">
            <p className="font-medium">Your queue is clear.</p>
            <p className="mt-2 text-sm text-slate-500">
              Generate a draft from one of your trends.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
