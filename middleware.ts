import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Next.js statically analyzes this file for `config`; a matcher re-exported
// from another module is silently ignored and the middleware then intercepts
// /_next/static assets, redirecting CSS/JS to /login.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
