import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { GraphError } from "@/lib/facebook/types";
import type { PageSnapshot } from "@/lib/facebook/service";

export type GraphIssue = { name: string; error: GraphError };

export function snapshotIssues(snapshots: PageSnapshot[]): GraphIssue[] {
  return snapshots
    .filter((snapshot) => snapshot.errors.length > 0)
    .map((snapshot) => ({
      name: snapshot.page.name,
      error: snapshot.errors[0],
    }));
}

/** Amber banner listing pages whose Graph API calls failed (stats show "—"). */
export function GraphIssues({ issues }: { issues: GraphIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle size={15} /> Some Facebook data could not be loaded
      </p>
      <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
        {issues.map((issue) => (
          <li key={issue.name}>
            <span className="font-medium">{issue.name}:</span>{" "}
            {issue.error.expiredToken ? (
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
              issue.error.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
