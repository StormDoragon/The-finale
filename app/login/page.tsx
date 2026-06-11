import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { LoginNotices } from "@/components/login-notices";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";
import {
  getSupabaseConfig,
  getSupabaseConfigStatus,
} from "@/lib/supabase/config";

// Render per request so the page reflects the server's runtime Supabase
// configuration — a static build could disagree with the middleware and
// lock users out on a disabled form.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const status = getSupabaseConfigStatus();
  const config = status.configured ? getSupabaseConfig() : null;
  return (
    <main className="grid min-h-screen bg-[#f6f6f3] lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-14 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.2em] text-emerald-300">
            Your editorial command center
          </p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
            From a useful signal to a publish-ready post.
          </h1>
          <div className="mt-10 space-y-4 text-slate-300">
            {[
              "Collect the trends worth keeping",
              "Create focused Facebook drafts",
              "Review every post before it goes live",
            ].map((text) => (
              <p key={text} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 text-emerald-300" size={19} />{" "}
                {text}
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Liberation OS · Private by design
        </p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <p className="text-sm font-semibold text-emerald-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in to your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Keep your trend-to-post workflow in one quiet place.
          </p>
          <div className="mt-7">
            <Suspense fallback={null}>
              <LoginNotices />
            </Suspense>
          </div>
          {!status.configured && (
            <Notice
              error={status.error}
              message={
                status.error
                  ? undefined
                  : "Demo mode is active. Open the dashboard to preview the workspace, or connect Supabase to enable sign in."
              }
            />
          )}
          <LoginForm
            config={config ? { url: config.url, key: config.key } : null}
          />
          {!status.configured && (
            <Link
              className="mt-4 flex justify-center text-sm font-semibold text-slate-700 underline underline-offset-4"
              href="/dashboard"
            >
              View demo workspace
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
