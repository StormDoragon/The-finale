import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client used to read and write the page_tokens table.
 *
 * page_tokens has row level security enabled with no policies, so the
 * browser key can never read an access token; only server code holding the
 * service-role key can. Never import this module from a client component.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const hasServiceRoleEnv = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);
