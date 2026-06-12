"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPageProfile } from "@/lib/facebook/graph";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  facebookPageId,
  pageAccessToken,
  uuid,
  ValidationError,
} from "@/lib/validation";

const SETTINGS_PATH = "/dashboard/settings";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function validationFailure(error: unknown, path: string): never {
  if (error instanceof ValidationError) redirectWithError(path, error.message);
  throw error;
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

function requireAdminClient() {
  const admin = createAdminClient();
  if (!admin) {
    redirectWithError(
      SETTINGS_PATH,
      "SUPABASE_SERVICE_ROLE_KEY is not configured, so page tokens cannot be stored.",
    );
  }
  return admin;
}

export async function logout() {
  const supabase = await createClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn("[auth] Sign out failed", error);
  }
  redirect("/login");
}

export async function connectPage(formData: FormData) {
  await requireUser();
  let pageId: string;
  let accessToken: string;
  try {
    pageId = facebookPageId(formData.get("page_id"));
    accessToken = pageAccessToken(formData.get("access_token"));
  } catch (error) {
    validationFailure(error, SETTINGS_PATH);
  }

  // Prove the token actually works for this page before storing anything.
  const profile = await getPageProfile(pageId, accessToken);
  if (!profile.ok) {
    const reason = profile.error.expiredToken
      ? "the access token is expired or has been invalidated."
      : profile.error.message;
    redirectWithError(SETTINGS_PATH, `Facebook rejected the connection: ${reason}`);
  }

  const admin = requireAdminClient();
  const { error } = await admin.from("page_tokens").upsert(
    {
      page_id: pageId,
      page_name: profile.data.name,
      access_token: accessToken,
    },
    { onConflict: "page_id" },
  );
  if (error) {
    console.error("[data] Unable to store page token", error);
    redirectWithError(
      SETTINGS_PATH,
      "The page could not be saved. Please try again.",
    );
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard");
  redirect(
    `${SETTINGS_PATH}?message=${encodeURIComponent(`Connected ${profile.data.name}`)}`,
  );
}

export async function disconnectPage(formData: FormData) {
  await requireUser();
  let id: string;
  try {
    id = uuid(formData.get("id"), "page");
  } catch (error) {
    validationFailure(error, SETTINGS_PATH);
  }

  const admin = requireAdminClient();
  const { error } = await admin.from("page_tokens").delete().eq("id", id);
  if (error) {
    console.error("[data] Unable to remove page", error);
    redirectWithError(
      SETTINGS_PATH,
      "The page could not be removed. Please try again.",
    );
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard");
  redirect(`${SETTINGS_PATH}?message=Page+removed`);
}
