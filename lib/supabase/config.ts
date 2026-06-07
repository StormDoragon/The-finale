type SupabaseConfig = {
  url: string;
  key: string;
  keySource:
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
};

function readEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = readEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const anonKey = readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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

  if (parsedUrl.hostname === "your-project.supabase.co") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL still uses the placeholder Supabase project URL",
    );
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
  const configuredUrl = readEnv(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelUrl =
    readEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    readEnv(process.env.VERCEL_URL);
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
