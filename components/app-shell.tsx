import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash min-h-screen bg-[#070d1a] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/5 bg-[#0a101e] p-6 lg:flex">
        <Logo light />
        <div className="mt-12">
          <NavLinks />
        </div>
        <div className="mt-auto">
          {!hasSupabaseEnv && (
            <p className="mb-4 rounded-lg bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
              Supabase is not connected. Live data and settings are unavailable.
            </p>
          )}
          {hasSupabaseEnv && (
            <form action={logout}>
              <button className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 transition hover:text-white">
                <LogOut size={17} /> Sign out
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a101e]/90 px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Logo light />
            <MobileNav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
