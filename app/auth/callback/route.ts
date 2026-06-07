import { NextResponse } from "next/server";
import { describeError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.warn("[auth] Callback received without an authorization code");
    return NextResponse.redirect(`${origin}/login?error=Invalid+auth+callback`);
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error("[auth] Callback cannot create a Supabase client");
      return NextResponse.redirect(
        `${origin}/login?error=Authentication+is+not+configured`,
      );
    }

    console.info("[auth] exchangeCodeForSession started");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[auth] exchangeCodeForSession rejected", {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
      });
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    console.info("[auth] exchangeCodeForSession completed");
  } catch (error) {
    console.error(
      "[auth] exchangeCodeForSession fetch failed",
      describeError(error),
    );
    return NextResponse.redirect(
      `${origin}/login?error=Unable+to+complete+authentication`,
    );
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
