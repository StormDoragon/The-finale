import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { PageSnapshot } from "@/lib/facebook/service";

/** Amber banner listing pages whose Graph API calls failed (stats show "—"). */
export function GraphIssues({ snapshots }: { snapshots: PageSnapshot[] }) {
  const issues = snapshots.filter((snapshot) => snapshot.errors.length > 0);
  if (issues.length === 0) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle size={15} /> Some Facebook data could not be loaded
      </p>
      <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
        {issues.map((snapshot) => (
          <li key={snapshot.page.pageId}>
            <span className="font-medium">{snapshot.page.name}:</span>{" "}
            {snapshot.errors[0].expiredToken ? (
              <>
                token expired —{" "}
                <Link
                  className="underline underline-offset-2"
                  href="/dashboard/settings"
                >
                  update it in Settings
                </Link>
              </>
            ) : (
              snapshot.errors[0].message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
