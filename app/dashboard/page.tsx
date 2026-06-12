import Link from "next/link";
import { LayoutDashboard, Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PageTokenRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = createAdminClient();
  let pages: PageTokenRow[] = [];
  if (admin) {
    const result = await admin
      .from("page_tokens")
      .select("*")
      .order("created_at", { ascending: true });
    if (result.error) {
      console.error("[data] Unable to load connected pages", result.error);
    }
    pages = (result.data as PageTokenRow[]) ?? [];
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live performance across your connected Facebook pages."
      />
      {pages.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No pages connected yet"
          message="Connect a Facebook page with its access token to start monitoring reach, engagement, and growth."
        >
          <Link href="/dashboard/settings" className="btn-primary">
            <Settings size={16} /> Open settings
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <div key={page.id} className="card p-5">
              <p className="font-semibold text-white">
                {page.page_name || `Page ${page.page_id}`}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {page.page_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
