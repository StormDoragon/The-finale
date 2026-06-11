"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Notice } from "@/components/notice";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

function connectionMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    error instanceof TypeError ||
    /failed to fetch|load failed|networkerror|network request failed/i.test(
      message,
    )
  ) {
    return "Unable to reach Supabase from this browser. Verify NEXT_PUBLIC_SUPABASE_URL and that the Supabase project is active.";
  }
  return error instanceof Error
    ? error.message
    : "Authentication failed. Please try again.";
}

export type LoginConfig = { url: string; key: string };

export function LoginForm({ config }: { config: LoginConfig | null }) {
  const enabled = config !== null;
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function authenticate(
    form: HTMLFormElement,
    authMode: AuthMode,
  ) {
    setMode(authMode);
    setError(undefined);
    setMessage(undefined);

    try {
      if (!config) {
        throw new Error(
          "Supabase is not configured. Add the public project URL and publishable key, then redeploy.",
        );
      }
      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const supabase = createClient(config.url, config.key);

      if (authMode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setMessage("Check your email to confirm your account.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      router.replace("/dashboard");
      router.refresh();
    } catch (authError) {
      console.error(`[auth] Browser ${authMode} failed`, authError);
      setError(connectionMessage(authError));
    } finally {
      setMode(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authenticate(event.currentTarget, "login");
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
      <Notice message={message} error={error} />
      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="field"
          disabled={!enabled || mode !== null}
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
          autoComplete={
            mode === "signup" ? "new-password" : "current-password"
          }
          className="field"
          disabled={!enabled || mode !== null}
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          minLength={6}
          required
        />
      </div>
      <button
        className="btn-primary w-full"
        disabled={!enabled || mode !== null}
        type="submit"
      >
        {mode === "login" ? "Signing in…" : "Sign in"}{" "}
        <ArrowRight size={17} />
      </button>
      <button
        className="btn-secondary w-full"
        disabled={!enabled || mode !== null}
        onClick={(event) => {
          const form = event.currentTarget.form;
          if (form?.reportValidity()) void authenticate(form, "signup");
        }}
        type="button"
      >
        {mode === "signup" ? "Creating account…" : "Create an account"}
      </button>
    </form>
  );
}
