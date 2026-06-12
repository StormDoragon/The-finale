import { Link2, ShieldCheck, Trash2 } from "lucide-react";
import { connectPage, disconnectPage } from "@/app/actions";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { verifyToken } from "@/lib/facebook/graph";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { PageTokenRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type TokenStatus = "valid" | "expired" | "error";

const STATUS_STYLES: Record<TokenStatus, string> = {
  valid: "bg-emerald-400/10 text-emerald-300",
  expired: "bg-red-400/10 text-red-300",
  error: "bg-amber-400/10 text-amber-300",
};

const STATUS_LABELS: Record<TokenStatus, string> = {
  valid: "Token valid",
  expired: "Token expired",
  error: "Check failed",
};

function TokenBadge({
  status,
  detail,
}: {
  status: TokenStatus;
  detail?: string;
}) {
  return (
    <span
      title={detail}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const admin = createAdminClient();

  const configError = !hasSupabaseEnv
    ? "Connect Supabase (URL and publishable key) before managing pages."
    : !admin
      ? "Set SUPABASE_SERVICE_ROLE_KEY so page access tokens can be stored securely on the server."
      : undefined;

  let pages: PageTokenRow[] = [];
  let loadError: string | undefined;
  if (admin) {
    const result = await admin
      .from("page_tokens")
      .select("*")
      .order("created_at", { ascending: true });
    if (result.error) {
      console.error("[data] Unable to load page tokens", result.error);
      loadError =
        "Connected pages could not be loaded. Please refresh and try again.";
    } else {
      pages = (result.data as PageTokenRow[]) ?? [];
    }
  }

  // Live token health: each stored token is checked against /me on render.
  const tokenChecks = await Promise.all(
    pages.map(async (page): Promise<{ status: TokenStatus; detail?: string }> => {
      const check = await verifyToken(page.access_token);
      if (check.ok) return { status: "valid" };
      return {
        status: check.error.expiredToken ? "expired" : "error",
        detail: check.error.message,
      };
    }),
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description="Connect Facebook pages and manage their access tokens."
      />
      <Notice
        message={params.message}
        error={params.error || configError || loadError}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_.85fr]">
        <form action={connectPage} className="card p-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-5">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-400/10 text-blue-300">
              <Link2 size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-white">Connect a Facebook page</h2>
              <p className="mt-1 text-xs text-slate-400">
                The token is verified against the Graph API before it is saved.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="page_id">
                Page ID
              </label>
              <input
                className="field"
                id="page_id"
                name="page_id"
                inputMode="numeric"
                maxLength={32}
                required
                placeholder="123456789012345"
              />
            </div>
            <div>
              <label className="label" htmlFor="access_token">
                Page access token
              </label>
              <input
                className="field"
                id="access_token"
                name="access_token"
                type="password"
                maxLength={1000}
                required
                placeholder="EAAB…"
                autoComplete="off"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Use a long-lived Page access token with{" "}
                <code className="text-slate-400">pages_read_engagement</code> and{" "}
                <code className="text-slate-400">read_insights</code>. The page
                name is fetched automatically.
              </p>
            </div>
            <SubmitButton pendingLabel="Verifying…" disabled={!admin}>
              <Link2 size={16} /> Connect page
            </SubmitButton>
          </div>
        </form>

        <section className="card p-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-5">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-white">How tokens are stored</h2>
              <p className="mt-1 text-xs text-slate-400">
                Server-side only, never sent to the browser.
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-400">
            <li>
              Tokens live in the Supabase <code className="text-slate-300">page_tokens</code>{" "}
              table with row level security enabled and no read policies.
            </li>
            <li>
              Only the server reads them, using the service-role key. All Graph
              API calls run in server components and server actions.
            </li>
            <li>
              Every page load re-checks each token against{" "}
              <code className="text-slate-300">/me</code>, so an expired token is
              flagged here immediately.
            </li>
          </ul>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-white/5 p-5">
          <h2 className="font-semibold text-white">Connected pages</h2>
          <p className="mt-1 text-xs text-slate-400">
            {pages.length
              ? `${pages.length} page${pages.length === 1 ? "" : "s"} connected`
              : "Pages you connect appear here."}
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="flex flex-wrap items-center gap-4 p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-400/10 text-base font-semibold text-blue-300">
                {(page.page_name || page.page_id).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {page.page_name || `Page ${page.page_id}`}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                  {page.page_id} · token ••••{page.access_token.slice(-4)}
                </p>
              </div>
              <TokenBadge
                status={tokenChecks[index].status}
                detail={tokenChecks[index].detail}
              />
              <form action={disconnectPage}>
                <input type="hidden" name="id" value={page.id} />
                <SubmitButton pendingLabel="Removing…" className="btn-secondary gap-2">
                  <Trash2 size={15} /> Remove
                </SubmitButton>
              </form>
            </div>
          ))}
          {!pages.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              No pages connected yet.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
