"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/training",      label: "대시보드" },
  { href: "/training/log",  label: "운동 기록" },
  { href: "/training/body", label: "신체 측정" },
];

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-zinc-700">
        {tabs.map((t) => {
          const active = t.href === "/training" ? pathname === "/training" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-5 py-3 text-base font-semibold tracking-wide border-b-2 -mb-px transition ${
                active ? "border-cyan-400 text-cyan-300" : "border-transparent text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
