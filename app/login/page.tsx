import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { login, signUp } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
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
            <Notice message={params.message} error={params.error} />
          </div>
          {!hasSupabaseEnv && (
            <Notice message="Demo mode is active. Open the dashboard to preview the workspace, or connect Supabase to enable sign in." />
          )}
          <form action={login} className="mt-7 space-y-5">
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                className="field"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                className="field"
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <button className="btn-primary w-full" type="submit">
              Sign in <ArrowRight size={17} />
            </button>
            <button
              className="btn-secondary w-full"
              formAction={signUp}
              type="submit"
            >
              Create an account
            </button>
          </form>
          {!hasSupabaseEnv && (
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
