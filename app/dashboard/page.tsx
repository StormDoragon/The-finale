import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { StatusPill } from "@/components/status-pill";
import { demoPosts, demoTrends } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { Post, Trend } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  let trends: Trend[] = demoTrends;
  let posts: Post[] = demoPosts;
  let loadError: string | undefined;
  if (supabase) {
    const [trendResult, postResult] = await Promise.all([
      supabase
        .from("trends")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("posts")
        .select("*, trends(title)")
        .order("created_at", { ascending: false }),
    ]);
    if (trendResult.error || postResult.error) {
      console.error("[data] Unable to load dashboard", {
        trends: trendResult.error,
        posts: postResult.error,
      });
      loadError = "Your workspace summary could not be fully loaded. Please refresh and try again.";
    }
    trends = trendResult.data || [];
    posts = (postResult.data as Post[]) || [];
  }
  const stats = [
    {
      label: "Total trends",
      value: trends.length,
      icon: Compass,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Drafts",
      value: posts.filter((p) => p.status === "draft").length,
      icon: FileText,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Approved",
      value: posts.filter((p) => p.status === "approved").length,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Published",
      value: posts.filter((p) => p.status === "published").length,
      icon: Send,
      tone: "bg-violet-50 text-violet-700",
    },
  ];
  return (
    <AppShell
      title="Overview"
      description="A simple view of what is moving through your content workflow."
    >
      <Notice error={loadError} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div
              className={`grid size-10 place-items-center rounded-xl ${tone}`}
            >
              <Icon size={19} />
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Recent trends</h2>
              <p className="mt-1 text-xs text-slate-500">
                Signals you added most recently
              </p>
            </div>
            <Link href="/trends" className="text-sm font-semibold">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {trends.slice(0, 3).map((trend) => (
              <div
                key={trend.id}
                className="flex items-start justify-between gap-5 p-5"
              >
                <div>
                  <p className="font-medium leading-6">{trend.title}</p>
                  <p className="mt-2 text-xs text-slate-500">{trend.source}</p>
                </div>
                <StatusPill status={trend.status} />
              </div>
            ))}
            {!trends.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No trends yet.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-slate-950 p-6 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-300 text-slate-950">
            <Compass size={19} />
          </span>
          <h2 className="mt-8 text-xl font-semibold">
            Found something worth sharing?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Capture the source and your quick take. Liberation OS will turn it
            into a first draft for you to review.
          </p>
          <Link
            href="/trends"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
          >
            Add a trend <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
