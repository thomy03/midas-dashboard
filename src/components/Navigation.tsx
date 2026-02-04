"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Activity, Brain, Settings, History } from "lucide-react";

const navItems = [
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/history", label: "History", icon: History },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/analysis", label: "Analysis", icon: Brain },
  { href: "/control", label: "Control", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/portfolio");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
