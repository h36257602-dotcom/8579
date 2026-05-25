"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, TrendingUp, Wallet, BookOpen, Briefcase, Plane, Dumbbell, LogIn, LogOut, Menu, X, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const menu = [
  { href: "/",          label: "홈",     icon: Home },
  { href: "/invest",    label: "투자",   icon: TrendingUp },
  { href: "/assets",    label: "자산",   icon: Wallet },
  { href: "/training",  label: "운동",   icon: Dumbbell },
  { href: "/diary",     label: "일기",   icon: BookOpen },
  { href: "/work",      label: "업무",   icon: Briefcase },
  { href: "/travel",    label: "여행",   icon: Plane },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-zinc-950 font-bold text-sm">M</div>
          <span className="text-base font-semibold tracking-tight">My Life</span>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기"
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-100">
          <Menu size={22} />
        </button>
      </header>

      <aside className="hidden md:flex w-64 min-h-screen border-r border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 h-screen flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 z-50 w-72 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-2xl">
            <SidebarContent pathname={pathname} onCloseClick={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}

function SidebarContent({ pathname, onCloseClick }: { pathname: string; onCloseClick?: () => void }) {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const isAdmin = profile?.role === "admin";

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    onCloseClick?.();
  };

  return (
    <>
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-zinc-950 font-bold text-base">M</div>
          <div>
            <div className="text-base font-semibold tracking-tight">My Life</div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-widest">Personal Hub</div>
          </div>
        </Link>
        {onCloseClick && (
          <button onClick={onCloseClick} aria-label="메뉴 닫기" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {menu.map((m) => {
          const Icon = m.icon;
          const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
          return (
            <Link key={m.href} href={m.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base transition ${
                active ? "bg-zinc-100 text-zinc-900 font-semibold" : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              }`}>
              <Icon size={17} />
              {m.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base transition border-t border-zinc-800 mt-2 pt-3 ${
              pathname.startsWith("/admin") ? "text-amber-200 font-semibold" : "text-amber-300/80 hover:text-amber-200 hover:bg-zinc-800"
            }`}>
            <Shield size={17} />
            관리자 패널
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        {loading ? (
          <div className="text-xs text-zinc-500 px-3 py-2">불러오는 중…</div>
        ) : user ? (
          <div>
            <div className="px-3 py-1.5 text-xs text-zinc-400 truncate" title={user.email || ""}>
              {user.email}
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg">
              <LogOut size={15} /> 로그아웃
            </button>
          </div>
        ) : (
          <Link href="/login"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg">
            <LogIn size={15} /> 로그인
          </Link>
        )}
      </div>
    </>
  );
}
