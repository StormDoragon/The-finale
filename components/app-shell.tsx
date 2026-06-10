import Link from "next/link";
import { BarChart3, Compass, LogOut, Settings, Sparkles } from "lucide-react";
import { logout } from "@/app/actions";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const links = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/trends", label: "Trends", icon: Compass },
  { href: "/queue", label: "Post queue", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-[#f6f6f3] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 p-6 text-white lg:flex">
        <Logo light />
        <nav className="mt-12 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          {!hasSupabaseEnv && (
            <p className="mb-4 rounded-lg bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
              Demo mode · connect Supabase to save changes.
            </p>
          )}
          {hasSupabaseEnv && (
            <form action={logout}>
              <button className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white">
                <LogOut size={17} /> Sign out
              </button>
            </form>
          )}
        </div>
      </aside>
      <main className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white/80 px-5 py-5 backdrop-blur md:px-10 lg:px-12">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <MobileNav />
                <Logo />
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-5 md:p-10 lg:p-12">{children}</div>
      </main>
    </div>
  );
}
