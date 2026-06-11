import { Facebook, Save, SlidersHorizontal } from "lucide-react";
import { saveSettings } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  resolveWritingStyle,
  WRITING_STYLE_OPTIONS,
} from "@/lib/writing-styles";

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
  const selectedWritingStyle = resolveWritingStyle(settings?.writing_style);
  if (result?.error) console.error("[data] Unable to load settings", result.error);
  const loadError = result?.error
    ? "Your settings could not be loaded. Please refresh and try again."
    : undefined;
  return (
    <AppShell
      title="Settings"
      description="Keep the essentials for your Facebook publishing workflow."
    >
      <Notice message={params.message} error={params.error || loadError} />
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
            <label className="label" htmlFor="facebook_page_id">
              Facebook Page ID
            </label>
            <input
              className="field"
              id="facebook_page_id"
              name="facebook_page_id"
              maxLength={100}
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
              <h2 className="font-semibold">Writing style &amp; brand voice</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a structure and add guidance for your drafts.
              </p>
            </div>
          </div>
          <fieldset className="mt-5">
            <legend className="label">Writing style</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {WRITING_STYLE_OPTIONS.map((option) => (
                <label
                  className="has-checked:border-slate-900 has-checked:bg-slate-50 cursor-pointer rounded-xl border border-slate-200 p-4 transition hover:border-slate-400"
                  key={option.value}
                >
                  <span className="flex items-start gap-3">
                    <input
                      className="mt-0.5 size-4 accent-slate-900"
                      type="radio"
                      name="writing_style"
                      value={option.value}
                      defaultChecked={selectedWritingStyle === option.value}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 border-t pt-5">
            <label className="label" htmlFor="brand_voice">
              Voice guidance
            </label>
            <textarea
              className="field min-h-36 resize-y"
              id="brand_voice"
              name="brand_voice"
              maxLength={2000}
              defaultValue={
                settings?.brand_voice ||
                "Clear, practical, optimistic, and conversational. Avoid hype and jargon."
              }
              placeholder="How should your posts sound?"
            />
          </div>
        </section>
        <SubmitButton pendingLabel="Saving…" disabled={!hasSupabaseEnv}>
          <Save size={16} /> Save settings
        </SubmitButton>
      </form>
    </AppShell>
  );
}
