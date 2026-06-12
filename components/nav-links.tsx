"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pages", label: "Pages", icon: Users },
  { href: "/dashboard/posts", label: "Posts", icon: FileText },
  { href: "/dashboard/monetization", label: "Monetization", icon: Coins },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "bg-emerald-400/10 font-semibold text-emerald-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
