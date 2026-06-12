const ACCENTS = {
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  violet: "bg-violet-400",
} as const;

export function ProgressBar({
  value,
  target,
  accent = "emerald",
}: {
  value: number | null;
  target: number;
  accent?: keyof typeof ACCENTS;
}) {
  const percent =
    value === null || target <= 0
      ? 0
      : Math.min(100, (value / target) * 100);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-white/5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={value ?? undefined}
    >
      <div
        className={`h-full rounded-full ${ACCENTS[accent]}`}
        style={{ width: `${percent > 0 ? Math.max(percent, 2) : 0}%` }}
      />
    </div>
  );
}
