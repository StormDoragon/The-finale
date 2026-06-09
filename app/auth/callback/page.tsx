"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const exchangeStarted = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    async function exchangeCode() {
      const authCode = new URL(window.location.href).searchParams.get("code");
      if (!authCode) {
        setError("The authentication link is missing its authorization code.");
        return;
      }

      try {
        const supabase = createClient();
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authCode);
        if (exchangeError) throw exchangeError;
        router.replace("/dashboard");
        router.refresh();
      } catch (authError) {
        console.error("[auth] Browser code exchange failed", authError);
        const message =
          authError instanceof Error ? authError.message : String(authError);
        const isNetworkError =
          authError instanceof TypeError ||
          /failed to fetch|load failed|networkerror|network request failed/i.test(
            message,
          );
        setError(
          isNetworkError
            ? "Unable to reach Supabase. Verify the project URL and confirm the project is active."
            : authError instanceof Error
              ? authError.message
              : "Unable to complete authentication.",
        );
      }
    }

    void exchangeCode();
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f6f3] p-6">
      <section className="card w-full max-w-md p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-2xl font-semibold">Confirming your account</h1>
        <p className="mt-3 text-sm text-slate-500">
          {error ? "We could not complete the sign-in." : "Please wait a moment."}
        </p>
        <div className="mt-6 text-left">
          <Notice error={error} />
        </div>
        {error && (
          <Link className="btn-primary mt-4 w-full" href="/login">
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
