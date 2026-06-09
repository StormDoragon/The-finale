type SupabaseConfig = {
  url: string;
  key: string;
  keySource:
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
};

export type SupabaseConfigStatus = {
  configured: boolean;
  error?: string;
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

  if (!url && !key) return null;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing (or set NEXT_PUBLIC_SUPABASE_ANON_KEY for a legacy project)",
    );
  }
  if (
    key === "your-supabase-publishable-key" ||
    key === "your-legacy-supabase-anon-key" ||
    key.startsWith("NEXT_PUBLIC_")
  ) {
    throw new Error("The Supabase API key is still a placeholder or assignment");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL");
  }

  const isPlaceholder =
    parsedUrl.hostname === "your-project.supabase.co" ||
    parsedUrl.hostname === "your-project-ref.supabase.co";
  if (isPlaceholder) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL still uses the placeholder Supabase project URL",
    );
  }

  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must contain only the project origin (for example, https://project-ref.supabase.co)",
    );
  }

  const isLocal =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "[::1]";
  if (parsedUrl.protocol !== "https:" && !isLocal) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS unless Supabase is running locally",
    );
  }

  return {
    url: parsedUrl.origin,
    key,
    keySource: publishableKey
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  };
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  try {
    return { configured: Boolean(getSupabaseConfig()) };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : "Invalid Supabase configuration",
    };
  }
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
