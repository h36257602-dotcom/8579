"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Goal, Habit, HabitLog, Asset, Diary } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n || 0);

export default function DashboardHome() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [diary, setDiary] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("habits").select("*").eq("active", true).order("created_at"),
        supabase.from("habit_logs").select("*").eq("date", today()),
        supabase.from("assets").select("*"),
        supabase.from("diary").select("*").order("date", { ascending: false }).limit(3),
      ]);
      const names = ["goals", "habits", "habit_logs", "assets", "diary"];
      const [g, h, l, a, d] = results.map((r, i) => {
        if (r.status === "rejected") {
          console.error(`[홈] ${names[i]} 조회 실패`, r.reason);
          return { data: [] };
        }
        if ((r.value as { error?: unknown }).error) {
          console.error(`[홈] ${names[i]} 에러`, (r.value as { error: unknown }).error);
        }
        return r.value;
      });
      setGoals((g.data as Goal[]) ?? []);
      setHabits((h.data as Habit[]) ?? []);
      setLogs((l.data as HabitLog[]) ?? []);
      setAssets((a.data as Asset[]) ?? []);
      setDiary((d.data as Diary[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const doneSet = new Set(logs.filter((x) => x.done).map((x) => x.habit_id));
  const doneCount = habits.filter((h) => doneSet.has(h.id)).length;
  const totalAsset = assets.reduce((s, a) => s + (a.amount || 0), 0);
  const activeGoals = goals.filter((g) => g.status === "active").length;

  if (loading) return <div className="text-zinc-500 text-sm py-20 text-center">불러오는 중…</div>;

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Dashboard</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">나의 모든 것</h1>
        <div className="text-xs text-zinc-500 mt-2">
          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
      </header>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="총 자산" value={`₩${fmt(totalAsset)}`} sub={`${assets.length}개 항목`} href="/assets" />
        <StatCard label="오늘의 습관" value={`${doneCount} / ${habits.length}`} sub="완료" />
        <StatCard label="진행 중 목표" value={`${activeGoals}개`} sub={`전체 ${goals.length}`} />
        <StatCard label="일기" value={`${diary.length > 0 ? diary[0].date : "-"}`} sub="최근 기록" href="/diary" />
      </div>

      {/* 오늘의 습관 */}
      <section>
        <SectionHeader title="오늘의 습관" count={`${doneCount}/${habits.length} 완료`} />
        {habits.length === 0 ? (
          <EmptyState message="습관이 없습니다." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {habits.map((h) => {
              const done = doneSet.has(h.id);
              return (
                <div key={h.id} className={`p-4 rounded-2xl border transition ${done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-900/60 border-zinc-800"}`}>
                  <div className="text-2xl mb-2">{h.emoji || "✨"}</div>
                  <div className="text-sm font-medium">{h.name}</div>
                  <div className={`text-[11px] mt-2 ${done ? "text-emerald-400" : "text-zinc-500"}`}>{done ? "완료" : "미완료"}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 목표 */}
      <section>
        <SectionHeader title="목표" count={`${activeGoals}개 진행중`} />
        {goals.length === 0 ? (
          <EmptyState message="목표가 없습니다." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.slice(0, 4).map((g) => (
              <div key={g.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {g.category && <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{g.category}</div>}
                    <div className="text-base font-semibold">{g.title}</div>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
                {g.description && <div className="text-xs text-zinc-400 mt-2 leading-relaxed">{g.description}</div>}
                {g.target_date && <div className="text-[11px] text-zinc-500 mt-3">목표일: {g.target_date}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 최근 일기 */}
      {diary.length > 0 && (
        <section>
          <SectionHeader title="최근 일기" link="/diary" />
          <div className="space-y-2">
            {diary.map((d) => (
              <Link key={d.id} href="/diary" className="block p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-medium">{d.title || "(제목 없음)"}</div>
                  <div className="text-[11px] text-zinc-500">{d.date}</div>
                </div>
                <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{d.content}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition h-full">
      <div className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-medium">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionHeader({ title, count, link }: { title: string; count?: string; link?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {count && <span className="text-xs text-zinc-500 tabular-nums">{count}</span>}
      {link && <Link href={link} className="text-xs text-zinc-400 hover:text-zinc-100">전체 보기 →</Link>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-xs text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
      {message} <Link href="/login" className="text-zinc-300 underline">로그인</Link>해서 추가하세요.
    </div>
  );
}

function StatusBadge({ status }: { status: Goal["status"] }) {
  const cfg = {
    done: { label: "달성", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    paused: { label: "보류", cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    active: { label: "진행중", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  }[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-md border ${cfg.cls}`}>{cfg.label}</span>;
}
