type SupabaseConfig = {
  url: string;
  key: string;
  keySource:
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
};

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const key = publishableKey || anonKey;

  if (!url || !key) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS unless Supabase is running locally",
    );
  }

  return {
    url: parsedUrl.toString().replace(/\/$/, ""),
    key,
    keySource: publishableKey
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  };
}

export function getSiteUrl() {
  const configuredUrl = readEnv("NEXT_PUBLIC_SITE_URL");
  const vercelUrl =
    readEnv("VERCEL_PROJECT_PRODUCTION_URL") || readEnv("VERCEL_URL");
  const siteUrl =
    configuredUrl ||
    (vercelUrl
      ? vercelUrl.startsWith("http")
        ? vercelUrl
        : `https://${vercelUrl}`
      : null);

  return (siteUrl || "http://localhost:3000").replace(/\/$/, "");
}

export function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const cause = error.cause;
  return {
    name: error.name,
    message: error.message,
    ...(cause instanceof Error
      ? { cause: { name: cause.name, message: cause.message } }
      : cause
        ? { cause: String(cause) }
        : {}),
  };
}
