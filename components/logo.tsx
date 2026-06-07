import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 font-semibold tracking-tight"
    >
      <span
        className={`grid size-9 place-items-center rounded-xl ${light ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`}
      >
        L
      </span>
      <span>
        Liberation OS <span className="font-normal text-slate-400">v0.1</span>
      </span>
    </Link>
  );
}
