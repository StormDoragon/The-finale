import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { describeError, getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  let config: ReturnType<typeof getSupabaseConfig>;

  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error("[auth] Proxy configuration error", describeError(error));
    return NextResponse.next({ request });
  }

  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  console.info("[auth] Creating Supabase proxy client", {
    supabaseHost: new URL(config.url).host,
    keySource: config.keySource,
    pathname: request.nextUrl.pathname,
  });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let isAuthenticated = false;
  try {
    const result = await supabase.auth.getUser();
    isAuthenticated = Boolean(result.data.user);
    if (result.error) {
      console.warn("[auth] Proxy getUser rejected", {
        name: result.error.name,
        message: result.error.message,
        status: result.error.status,
        code: result.error.code,
      });
    }
  } catch (error) {
    console.error("[auth] Proxy getUser fetch failed", describeError(error));
    if (isLogin || isAuthCallback) return response;

    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "?error=Unable+to+reach+the+authentication+service";
    return NextResponse.redirect(target);
  }

  if (!isAuthenticated && !isLogin && !isAuthCallback) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    return NextResponse.redirect(target);
  }
  if (isAuthenticated && isLogin) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    return NextResponse.redirect(target);
  }
  return response;
}
