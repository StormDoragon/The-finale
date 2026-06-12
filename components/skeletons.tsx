function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-2.5">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function StatGridSkeleton({
  count = 4,
  columns = 4,
}: {
  count?: number;
  columns?: 3 | 4;
}) {
  const grid =
    columns === 3
      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";
  return (
    <div className={grid}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card space-y-4 p-5">
          <Shimmer className="size-10 rounded-xl" />
          <Shimmer className="h-8 w-24" />
          <Shimmer className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <Shimmer className="h-full w-full" />
    </div>
  );
}

export function RowListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-white/5">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 p-5">
          <Shimmer className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-1/3" />
            <Shimmer className="h-3 w-1/2" />
          </div>
          <Shimmer className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
