"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateFacebookDraft,
  hasAnthropicEnv,
  templateFacebookDraft,
} from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import {
  optionalHttpUrl,
  optionalText,
  postTransition,
  requiredText,
  uuid,
  ValidationError,
} from "@/lib/validation";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function validationFailure(error: unknown, path: string): never {
  if (error instanceof ValidationError) redirectWithError(path, error.message);
  throw error;
}

function databaseFailure(
  context: string,
  error: { message: string },
  path: string,
): never {
  console.error(`[data] ${context}`, error);
  redirectWithError(
    path,
    "Something went wrong while saving. Please try again.",
  );
}

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) redirectWithError("/login", "Connect Supabase to save changes.");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (error) console.warn("[auth] Server action rejected", error);
    redirect("/login?error=Please+sign+in+to+continue");
  }
  return { supabase, user: data.user };
}

export async function logout() {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.signOut();
  if (error) console.warn("[auth] Sign out failed", error);
  redirect("/login");
}

export async function addTrend(formData: FormData) {
  const { supabase } = await requireUser();
  let title: string;
  let source: string;
  let url: string | null;
  let summary: string;

  try {
    title = requiredText(formData.get("title"), "Title", 200);
    source = requiredText(formData.get("source"), "Source", 200);
    url = optionalHttpUrl(formData.get("url"));
    summary = requiredText(formData.get("summary"), "Summary", 2000);
  } catch (error) {
    validationFailure(error, "/trends");
  }

  const { error } = await supabase.from("trends").insert({
    title,
    source,
    url,
    summary,
    status: "new",
  });
  if (error) databaseFailure("Unable to add trend", error, "/trends");

  revalidatePath("/trends");
  revalidatePath("/dashboard");
  redirect("/trends?message=Trend+saved");
}

export async function generatePost(formData: FormData) {
  let trendId: string;
  try {
    trendId = uuid(formData.get("trend_id"), "trend");
  } catch (error) {
    validationFailure(error, "/trends");
  }

  await generateDraft(trendId);
  redirect("/queue?message=Draft+added+to+your+queue");
}

export async function generateDraft(trendId: string): Promise<string> {
  const { supabase } = await requireUser();

  const { data: trend, error: trendError } = await supabase
    .from("trends")
    .select("id, title, source, summary, status")
    .eq("id", trendId)
    .maybeSingle();
  if (trendError) databaseFailure("Unable to load trend", trendError, "/trends");
  if (!trend) redirectWithError("/trends", "That trend could not be found.");
  if (trend.status !== "new") {
    redirectWithError("/trends", "A draft has already been generated for that trend.");
  }

  const { data: existingPost, error: existingError } = await supabase
    .from("posts")
    .select("id")
    .eq("trend_id", trendId)
    .limit(1)
    .maybeSingle();
  if (existingError) {
    databaseFailure("Unable to check existing draft", existingError, "/trends");
  }
  if (existingPost) {
    await supabase.from("trends").update({ status: "used" }).eq("id", trendId);
    redirectWithError("/trends", "A draft already exists for that trend.");
  }

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("brand_voice")
    .limit(1)
    .maybeSingle();
  if (settingsError) {
    console.warn("[data] Draft generated without brand voice", settingsError);
  }
  const brandVoice = settings?.brand_voice?.trim() ?? "";

  let content: string;
  if (hasAnthropicEnv()) {
    try {
      content = await generateFacebookDraft(trend, brandVoice);
    } catch (error) {
      console.error("[ai] Draft generation failed", error);
      const message =
        error instanceof Anthropic.APIError
          ? `Draft generation failed (${error.status ?? "API error"}). Please try again.`
          : "Draft generation failed. Please try again.";
      redirectWithError("/trends", message);
    }
  } else {
    console.warn(
      "[ai] ANTHROPIC_API_KEY is not set — using the template draft instead of AI generation.",
    );
    content = templateFacebookDraft(trend);
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      trend_id: trendId,
      platform: "facebook",
      content,
      editorial_note: brandVoice || null,
      status: "draft",
    })
    .select("id")
    .single();
  if (postError || !post) {
    databaseFailure(
      "Unable to create draft",
      postError ?? { message: "Insert returned no row" },
      "/trends",
    );
  }

  const { error: updateError } = await supabase
    .from("trends")
    .update({ status: "used" })
    .eq("id", trendId);
  if (updateError) {
    console.error("[data] Draft created but trend status was not updated", updateError);
  }

  revalidatePath("/trends");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return post.id;
}

export async function updatePostStatus(formData: FormData) {
  const { supabase } = await requireUser();
  let id: string;
  let transition: ReturnType<typeof postTransition>;
  try {
    id = uuid(formData.get("id"), "post");
    transition = postTransition(formData.get("status"));
  } catch (error) {
    validationFailure(error, "/queue");
  }

  const now = new Date().toISOString();
  const timestamps =
    transition.next === "approved"
      ? { approved_at: now }
      : transition.next === "published"
        ? { published_at: now }
        : {};
  const { data, error } = await supabase
    .from("posts")
    .update({ status: transition.next, ...timestamps })
    .eq("id", id)
    .eq("status", transition.current)
    .select("id")
    .maybeSingle();
  if (error) databaseFailure("Unable to update post", error, "/queue");
  if (!data) {
    redirectWithError("/queue", "That post changed before your request. Refresh and try again.");
  }

  revalidatePath("/queue");
  revalidatePath("/dashboard");
}

export async function saveSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  let facebookPageId: string | null;
  let brandVoice: string | null;
  try {
    facebookPageId = optionalText(
      formData.get("facebook_page_id"),
      "Facebook Page ID",
      100,
    );
    brandVoice = optionalText(formData.get("brand_voice"), "Brand voice", 2000);
  } catch (error) {
    validationFailure(error, "/settings");
  }

  const { error } = await supabase.from("settings").upsert(
    {
      owner_id: user.id,
      facebook_page_id: facebookPageId,
      brand_voice: brandVoice,
    },
    { onConflict: "owner_id" },
  );
  if (error) databaseFailure("Unable to save settings", error, "/settings");

  revalidatePath("/settings");
  redirect("/settings?message=Settings+saved");
}
