"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 lg:hidden"
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
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/5 bg-[#0a101e] p-6 text-white"
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
            <div className="mt-10">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
