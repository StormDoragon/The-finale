import type {
  GraphResult,
  PageProfile,
  RawPageProfile,
} from "@/lib/facebook/types";

/**
 * Server-side Facebook Graph API client.
 *
 * Every function returns a GraphResult instead of throwing, so pages can
 * always render an empty state instead of crashing. Access tokens must never
 * reach the browser: only import this module from server components, server
 * actions, or route handlers.
 */
const GRAPH_BASE = "https://graph.facebook.com/v19.0";

type RawErrorBody = { error?: { message?: string; code?: number } };

export async function graphGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  accessToken: string,
): Promise<GraphResult<T>> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  url.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    console.error("[graph] Request failed before reaching Facebook", error);
    return {
      ok: false,
      error: {
        message: "Could not reach the Facebook Graph API.",
        expiredToken: false,
      },
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body; fall through to the status check below.
  }

  const graphError = (payload as RawErrorBody | null)?.error;
  if (!response.ok || graphError) {
    return {
      ok: false,
      error: {
        message:
          graphError?.message ??
          `Graph API request failed with status ${response.status}.`,
        code: graphError?.code,
        expiredToken: graphError?.code === 190,
      },
    };
  }
  return { ok: true, data: payload as T };
}

const PAGE_PROFILE_FIELDS = [
  "id",
  "name",
  "category",
  "fan_count",
  "followers_count",
  "about",
  "link",
  "picture.width(200).height(200)",
  "cover",
].join(",");

export async function getPageProfile(
  pageId: string,
  accessToken: string,
): Promise<GraphResult<PageProfile>> {
  const result = await graphGet<RawPageProfile>(
    pageId,
    { fields: PAGE_PROFILE_FIELDS },
    accessToken,
  );
  if (!result.ok) return result;
  const raw = result.data;
  return {
    ok: true,
    data: {
      id: raw.id,
      name: raw.name,
      category: raw.category ?? null,
      fanCount: raw.fan_count ?? 0,
      followersCount: raw.followers_count ?? null,
      about: raw.about ?? null,
      link: raw.link ?? null,
      pictureUrl: raw.picture?.data?.url ?? null,
      coverUrl: raw.cover?.source ?? null,
    },
  };
}

/** Calls /me to confirm a stored token is still live. */
export async function verifyToken(
  accessToken: string,
): Promise<GraphResult<{ id: string; name?: string }>> {
  return graphGet<{ id: string; name?: string }>(
    "me",
    { fields: "id,name" },
    accessToken,
  );
}
