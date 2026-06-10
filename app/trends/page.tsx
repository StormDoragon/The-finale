import { ExternalLink, Plus, Sparkles } from "lucide-react";
import { addTrend, generatePost } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { StatusPill } from "@/components/status-pill";
import { SubmitButton } from "@/components/submit-button";
import { demoTrends } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Trend } from "@/lib/types";

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  let trends: Trend[] = demoTrends;
  if (supabase) {
    const result = await supabase
      .from("trends")
      .select("*")
      .order("created_at", { ascending: false });
    trends = result.data || [];
  }
  return (
    <AppShell
      title="Trends"
      description="Capture useful signals, then turn them into a Facebook draft."
    >
      <Notice {...params} />
      <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
        <section className="card h-fit p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-slate-100">
              <Plus size={18} />
            </span>
            <div>
              <h2 className="font-semibold">Add a trend</h2>
              <p className="text-xs text-slate-500">
                Save only what feels useful.
              </p>
            </div>
          </div>
          <form action={addTrend} className="mt-6 space-y-4">
            <div>
              <label className="label">Trend title</label>
              <input
                className="field"
                name="title"
                placeholder="What are people talking about?"
                required
              />
            </div>
            <div>
              <label className="label">Source</label>
              <input
                className="field"
                name="source"
                placeholder="Newsletter, report, conversation…"
                required
              />
            </div>
            <div>
              <label className="label">
                Source URL{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                className="field"
                name="url"
                type="url"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="label">Your quick summary</label>
              <textarea
                className="field min-h-28 resize-y"
                name="summary"
                placeholder="Why does this matter to your audience?"
                required
              />
            </div>
            <SubmitButton pendingLabel="Saving…" disabled={!hasSupabaseEnv}>
              <Plus size={17} /> Save trend
            </SubmitButton>
          </form>
        </section>
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-semibold">Trend library</h2>
              <p className="mt-1 text-xs text-slate-500">
                {trends.length} saved signals
              </p>
            </div>
          </div>
          {trends.map((trend) => (
            <article key={trend.id} className="card p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={trend.status} />
                    <span className="text-xs text-slate-400">
                      {trend.source}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-7">
                    {trend.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {trend.summary}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
                {trend.url && (
                  <a
                    href={trend.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary gap-2"
                  >
                    Source <ExternalLink size={14} />
                  </a>
                )}
                <form action={generatePost}>
                  <input type="hidden" name="trend_id" value={trend.id} />
                  <input type="hidden" name="title" value={trend.title} />
                  <input type="hidden" name="summary" value={trend.summary} />
                  <SubmitButton
                    pendingLabel="Generating…"
                    disabled={!hasSupabaseEnv}
                  >
                    <Sparkles size={15} /> Generate Facebook draft
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
