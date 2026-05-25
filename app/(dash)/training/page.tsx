"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { levelFromXp, CATEGORY_NEON } from "@/lib/fitness";
import type { Workout, BodyMetric, FitnessProfile } from "@/lib/types";
import { Flame, Activity, Trophy, Heart, Moon, Dumbbell } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function TrainingDashboard() {
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [body, setBody] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, w, b] = await Promise.all([
        supabase.from("fitness_profile").select("*").limit(1).maybeSingle(),
        supabase.from("workouts").select("*").order("date", { ascending: false }).limit(50),
        supabase.from("body_metrics").select("*").order("date", { ascending: false }).limit(30),
      ]);
      setProfile((p.data as FitnessProfile) ?? null);
      setWorkouts((w.data as Workout[]) ?? []);
      setBody((b.data as BodyMetric[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const lv = useMemo(() => levelFromXp(profile?.total_xp ?? 0), [profile]);
  const latestBody = body[0];
  const todayWorkouts = workouts.filter((w) => w.date === today());
  const weekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const weekDuration = weekWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
  const weekVolume = weekWorkouts.reduce((s, w) => s + (w.sets * w.reps * w.weight || 0), 0);
  const totalCalories = workouts.reduce((s, w) => s + (w.calories || 0), 0);
  const prCount = workouts.filter((w) => w.is_pr).length;

  if (loading) {
    return <div className="text-cyan-400 text-base py-20 text-center">선수 데이터를 불러오는 중…</div>;
  }

  return (
    <div className="space-y-6">
      {/* === 레벨 / 칭호 카드 === */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 p-7"
        style={{ boxShadow: "0 0 70px -20px rgba(34, 211, 238, 0.5), inset 0 0 40px rgba(34, 211, 238, 0.06)" }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs text-cyan-400/80 tracking-[0.3em] font-semibold">▸ 선수 상태</div>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-sm text-zinc-400 tracking-widest">레벨</span>
              <motion.span
                key={lv.level}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl md:text-7xl font-black tabular-nums bg-gradient-to-br ${lv.tierColor} bg-clip-text text-transparent`}
              >
                {lv.level}
              </motion.span>
              <span className={`text-base md:text-xl font-bold tracking-wider bg-gradient-to-br ${lv.tierColor} bg-clip-text text-transparent`}>
                {lv.title}
              </span>
            </div>
            <div className="text-sm text-zinc-300 mt-3">
              {profile?.nickname} <span className="text-zinc-500">·</span> {profile?.sport || "종합"}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Pill icon={<Flame size={16} />} label="연속" value={`${profile?.streak_days ?? 0}일`} color="text-amber-300" />
            <Pill icon={<Trophy size={16} />} label="신기록" value={`${prCount}`} color="text-rose-300" />
            <Pill icon={<Dumbbell size={16} />} label="누적 경험치" value={(profile?.total_xp ?? 0).toLocaleString()} color="text-cyan-300" />
          </div>
        </div>

        {/* 경험치 진행바 */}
        <div className="relative mt-7">
          <div className="flex justify-between text-sm text-zinc-300 mb-2">
            <span>경험치 <span className="text-zinc-100 font-semibold">{(profile?.total_xp ?? 0).toLocaleString()}</span> / {lv.nextLevelXp.toLocaleString()}</span>
            <span className="text-cyan-300 font-semibold">다음 레벨 {lv.level + 1}</span>
          </div>
          <div className="relative h-4 bg-zinc-800 border border-zinc-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lv.progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${lv.tierColor} relative`}
              style={{ boxShadow: "0 0 20px rgba(34, 211, 238, 0.7)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
          <div className="text-right text-sm text-cyan-300 mt-1.5 tabular-nums font-semibold">{lv.progressPct.toFixed(1)}%</div>
        </div>
      </motion.div>

      {/* === 신체 지표 그리드 === */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Metric label="체중"     value={latestBody?.weight}          unit="kg" color="cyan"    icon={<Activity size={14} />} />
        <Metric label="골격근량" value={latestBody?.muscle_mass}     unit="kg" color="emerald" icon={<Dumbbell size={14} />} />
        <Metric label="체지방률" value={latestBody?.body_fat}        unit="%"  color="rose"    icon={<Flame size={14} />} />
        <Metric label="BMI"      value={latestBody?.bmi}             unit=""   color="violet"  icon={<Activity size={14} />} />
        <Metric label="컨디션"   value={latestBody?.condition_score} unit=""   color="amber"   icon={<Heart size={14} />} />
        <Metric label="수면점수" value={latestBody?.sleep_score}     unit=""   color="sky"     icon={<Moon size={14} />} />
      </div>

      {/* === 오늘 + 이번주 + 누적 === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HudCard title="오늘" accent="emerald">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-black tabular-nums text-emerald-300">{todayWorkouts.length}</span>
            <span className="text-base text-zinc-400">세션</span>
          </div>
          <div className="mt-4 text-sm text-zinc-400">오늘 획득 경험치</div>
          <div className="text-3xl font-bold text-emerald-300 tabular-nums">+{todayWorkouts.reduce((s, w) => s + w.xp, 0)}</div>
        </HudCard>

        <HudCard title="이번주" accent="cyan">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-400">세션</div>
              <div className="text-3xl md:text-4xl font-black text-cyan-300 tabular-nums">{weekWorkouts.length}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">운동 시간</div>
              <div className="text-3xl md:text-4xl font-black text-cyan-300 tabular-nums">{weekDuration}<span className="text-base text-zinc-400 ml-1">분</span></div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-zinc-400">총 볼륨</div>
              <div className="text-2xl font-bold text-cyan-200 tabular-nums">{weekVolume.toLocaleString()}<span className="text-base text-zinc-400 ml-1">kg</span></div>
            </div>
          </div>
        </HudCard>

        <HudCard title="누적" accent="violet">
          <div className="space-y-3">
            <Row label="총 운동 수" value={workouts.length.toString()} unit="회" />
            <Row label="총 소모 칼로리" value={totalCalories.toLocaleString()} unit="kcal" />
            <Row label="개인 신기록" value={prCount.toString()} unit="회" />
          </div>
        </HudCard>
      </div>

      {/* === 최근 기록 === */}
      <HudCard title="최근 운동 기록" accent="cyan" actionLabel="전체 보기" actionHref="/training/log">
        {workouts.length === 0 ? (
          <div className="text-base text-zinc-400 py-10 text-center">
            운동 데이터가 없습니다 · <Link href="/training/log" className="text-cyan-300 underline">기록 시작</Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/60">
            {workouts.slice(0, 8).map((w) => (
              <div key={w.id} className="py-3.5 flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded border tracking-wider font-medium ${CATEGORY_NEON[w.category] || CATEGORY_NEON.자유운동}`}>
                  {w.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium truncate">
                    {w.name} {w.is_pr && <span className="text-xs text-amber-300 ml-1.5 font-semibold">★ 신기록</span>}
                  </div>
                  <div className="text-sm text-zinc-400 mt-0.5">
                    {w.date}
                    {w.sets > 0 && ` · ${w.sets}세트 × ${w.reps}회`}
                    {w.weight > 0 && ` · ${w.weight}kg`}
                    {w.duration > 0 && ` · ${w.duration}분`}
                    {w.distance > 0 && ` · ${w.distance}km`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-300 tabular-nums">+{w.xp}</div>
                  <div className="text-xs text-zinc-500">경험치</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </HudCard>
    </div>
  );
}

// ============================================================================
// UI 빌딩 블록
// ============================================================================
function Pill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/60 min-w-[110px]">
      <div className={`flex items-center gap-1.5 ${color} text-xs tracking-wider font-semibold`}>{icon}{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color} mt-0.5`}>{value}</div>
    </div>
  );
}

function Metric({ label, value, unit, color, icon }: { label: string; value: number | null | undefined; unit: string; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-300 border-cyan-500/40",
    emerald: "text-emerald-300 border-emerald-500/40",
    rose: "text-rose-300 border-rose-500/40",
    violet: "text-violet-300 border-violet-500/40",
    amber: "text-amber-300 border-amber-500/40",
    sky: "text-sky-300 border-sky-500/40",
  };
  const cls = colorMap[color];
  return (
    <div className={`p-4 rounded-xl border bg-zinc-800/60 ${cls}`} style={{ boxShadow: "0 0 24px -12px currentColor" }}>
      <div className="flex items-center gap-1.5 text-xs tracking-wider opacity-80 font-semibold">{icon}{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-black tabular-nums">{value ?? "—"}</span>
        <span className="text-sm text-zinc-400">{unit}</span>
      </div>
    </div>
  );
}

function HudCard({ title, accent, actionLabel, actionHref, children }: {
  title: string; accent: "cyan" | "emerald" | "violet" | "rose" | "amber";
  actionLabel?: string; actionHref?: string; children: React.ReactNode;
}) {
  const colorMap = {
    cyan:    { border: "border-cyan-500/40",    text: "text-cyan-300",    bar: "bg-cyan-400" },
    emerald: { border: "border-emerald-500/40", text: "text-emerald-300", bar: "bg-emerald-400" },
    violet:  { border: "border-violet-500/40",  text: "text-violet-300",  bar: "bg-violet-400" },
    rose:    { border: "border-rose-500/40",    text: "text-rose-300",    bar: "bg-rose-400" },
    amber:   { border: "border-amber-500/40",   text: "text-amber-300",   bar: "bg-amber-400" },
  };
  const c = colorMap[accent];
  return (
    <div className={`relative rounded-2xl border bg-zinc-800/50 p-6 ${c.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 ${c.bar}`} />
          <h3 className={`text-sm font-bold tracking-wider ${c.text}`}>{title}</h3>
        </div>
        {actionHref && actionLabel && (
          <Link href={actionHref} className={`text-sm tracking-wide ${c.text} hover:underline font-semibold`}>
            {actionLabel} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-xl font-bold text-violet-200 tabular-nums">
        {value}
        {unit && <span className="text-sm text-zinc-400 ml-1">{unit}</span>}
      </span>
    </div>
  );
}
