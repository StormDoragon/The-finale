import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  describeError,
  getSupabaseConfig,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";

export const supabaseConfigStatus = getSupabaseConfigStatus();
export const hasSupabaseEnv = supabaseConfigStatus.configured;

export async function createClient() {
  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error("[auth] Invalid Supabase configuration", describeError(error));
    throw error;
  }

  if (!config) {
    console.warn("[auth] Supabase client not created: environment is incomplete", {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasPublishableKey: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
      ),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    });
    return null;
  }

  console.info("[auth] Creating Supabase server client", {
    supabaseHost: new URL(config.url).host,
    keySource: config.keySource,
  });

  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. Proxy refreshes sessions.
        }
      },
    },
  });
}
