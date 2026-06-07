import { Facebook, Save, SlidersHorizontal } from "lucide-react";
import { saveSettings } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const result = supabase
    ? await supabase.from("settings").select("*").limit(1).maybeSingle()
    : null;
  const settings = result?.data;
  return (
    <AppShell
      title="Settings"
      description="Keep the essentials for your Facebook publishing workflow."
    >
      <Notice {...params} />
      <form action={saveSettings} className="max-w-2xl space-y-6">
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b pb-5">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Facebook size={19} />
            </span>
            <div>
              <h2 className="font-semibold">Facebook page</h2>
              <p className="mt-1 text-xs text-slate-500">
                Stored now for a future publishing connection.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="label">Facebook Page ID</label>
            <input
              className="field"
              name="facebook_page_id"
              defaultValue={settings?.facebook_page_id || ""}
              placeholder="123456789012345"
            />
            <p className="mt-2 text-xs leading-5 text-slate-400">
              No post will be sent automatically in v0.1.
            </p>
          </div>
        </section>
        <section className="card p-6">
          <div className="flex items-center gap-3 border-b pb-5">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <SlidersHorizontal size={19} />
            </span>
            <div>
              <h2 className="font-semibold">Brand voice</h2>
              <p className="mt-1 text-xs text-slate-500">
                A short note to guide your drafts.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label className="label">Voice guidance</label>
            <textarea
              className="field min-h-36 resize-y"
              name="brand_voice"
              defaultValue={
                settings?.brand_voice ||
                "Clear, practical, optimistic, and conversational. Avoid hype and jargon."
              }
              placeholder="How should your posts sound?"
            />
          </div>
        </section>
        <button className="btn-primary" disabled={!hasSupabaseEnv}>
          <Save size={16} /> Save settings
        </button>
      </form>
    </AppShell>
  );
}
