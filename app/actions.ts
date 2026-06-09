"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireClient() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?message=Connect+Supabase+to+save+changes");
  return supabase;
}

export async function logout() {
  const supabase = await requireClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addTrend(formData: FormData) {
  const supabase = await requireClient();
  const { error } = await supabase.from("trends").insert({
    title: String(formData.get("title") || ""),
    source: String(formData.get("source") || ""),
    url: String(formData.get("url") || "") || null,
    summary: String(formData.get("summary") || ""),
    status: "new",
  });
  if (error) redirect(`/trends?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/trends");
  revalidatePath("/dashboard");
}

export async function generatePost(formData: FormData) {
  const supabase = await requireClient();
  const trendId = String(formData.get("trend_id"));
  const title = String(formData.get("title"));
  const summary = String(formData.get("summary"));
  const content = `${title}\n\n${summary}\n\nWhat are you noticing in your corner of the world?`;
  const { error } = await supabase.from("posts").insert({
    trend_id: trendId,
    platform: "facebook",
    content,
    status: "draft",
  });
  if (error) redirect(`/trends?error=${encodeURIComponent(error.message)}`);
  await supabase.from("trends").update({ status: "used" }).eq("id", trendId);
  revalidatePath("/trends");
  revalidatePath("/queue");
  redirect("/queue?message=Draft+added+to+your+queue");
}

export async function updatePostStatus(formData: FormData) {
  const supabase = await requireClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const timestamps: Record<string, string | null> = {};
  if (status === "approved") timestamps.approved_at = new Date().toISOString();
  if (status === "published")
    timestamps.published_at = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({ status, ...timestamps })
    .eq("id", id);
  if (error) redirect(`/queue?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/queue");
  revalidatePath("/dashboard");
}

export async function saveSettings(formData: FormData) {
  const supabase = await requireClient();
  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  const values = {
    facebook_page_id: String(formData.get("facebook_page_id") || ""),
    brand_voice: String(formData.get("brand_voice") || ""),
  };
  const query = existing
    ? supabase.from("settings").update(values).eq("id", existing.id)
    : supabase.from("settings").insert(values);
  const { error } = await query;
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings");
  redirect("/settings?message=Settings+saved");
}
