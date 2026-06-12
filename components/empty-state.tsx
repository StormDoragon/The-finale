import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      {Icon && (
        <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-slate-400">
          <Icon size={22} />
        </span>
      )}
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-400">
          {message}
        </p>
      </div>
      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
