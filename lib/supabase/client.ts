"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Add the public project URL and publishable key, then redeploy.",
    );
  }

  browserClient ??= createBrowserClient(config.url, config.key);
  return browserClient;
}
