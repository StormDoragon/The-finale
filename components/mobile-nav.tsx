"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Compass, Menu, Settings, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/logo";

const links = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/trends", label: "Trends", icon: Compass },
  { href: "/queue", label: "Post queue", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-lg border bg-white lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950 p-6 text-white"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between">
              <Logo light />
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-10 space-y-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon size={18} /> {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
