"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

// The URL and key come from the server at request time so sign-in works
// even when the client bundle was built without Supabase env vars.
export function createClient(url: string, key: string) {
  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}
