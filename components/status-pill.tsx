export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    used: "bg-slate-100 text-slate-600",
    draft: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    published: "bg-violet-50 text-violet-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || styles.used}`}
    >
      {status}
    </span>
  );
}
