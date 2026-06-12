import type { LucideIcon } from "lucide-react";

// Stat cards skip the shared .card class: the scoped dark theme pins its
// border color, while these need per-accent borders.
const ACCENTS = {
  emerald: {
    chip: "bg-emerald-400/10 text-emerald-300",
    border: "border-emerald-400/25",
  },
  blue: { chip: "bg-blue-400/10 text-blue-300", border: "border-blue-400/25" },
  violet: {
    chip: "bg-violet-400/10 text-violet-300",
    border: "border-violet-400/25",
  },
  amber: {
    chip: "bg-amber-400/10 text-amber-300",
    border: "border-amber-400/25",
  },
  rose: { chip: "bg-rose-400/10 text-rose-300", border: "border-rose-400/25" },
  sky: { chip: "bg-sky-400/10 text-sky-300", border: "border-sky-400/25" },
} as const;

export type StatAccent = keyof typeof ACCENTS;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: StatAccent;
}) {
  const styles = ACCENTS[accent];
  return (
    <div
      className={`rounded-2xl border bg-[#0d1424] p-5 shadow-[0_1px_2px_rgba(2,6,23,0.6)] ${styles.border}`}
    >
      <span
        className={`grid size-10 place-items-center rounded-xl ${styles.chip}`}
      >
        <Icon size={19} />
      </span>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
