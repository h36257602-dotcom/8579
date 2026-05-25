"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import { calcWorkoutXp, levelFromXp, WORKOUT_CATEGORIES, BODY_PARTS, CONDITIONS, CATEGORY_NEON, CATEGORY_CONFIG } from "@/lib/fitness";
import type { Workout, FitnessProfile } from "@/lib/types";
import { Zap, Trophy } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function WorkoutLogPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [filter, setFilter] = useState<string>("전체");
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const [form, setForm] = useState({
    date: today(),
    category: "웨이트",
    name: "",
    body_part: "가슴",
    sets: 0, reps: 0, weight: 0,
    duration: 0, distance: 0, calories: 0,
    rpe: 7,
    condition: "보통",
    memo: "",
    is_pr: false,
  });

  const load = async () => {
    const [w, p] = await Promise.all([
      supabase.from("workouts").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("fitness_profile").select("*").limit(1).maybeSingle(),
    ]);
    setItems((w.data as Workout[]) ?? []);
    setProfile((p.data as FitnessProfile) ?? null);
  };
  useEffect(() => { load(); }, []);

  const predictedXp = calcWorkoutXp({
    duration: form.duration,
    sets: form.sets,
    reps: form.reps,
    weight: form.weight,
    distance: form.distance,
    rpe: form.rpe,
    is_pr: form.is_pr,
  });

  const add = async () => {
    if (!form.name.trim()) { alert("운동명을 입력하세요"); return; }
    const xp = predictedXp;

    await supabase.from("workouts").insert({
      date: form.date,
      category: form.category,
      name: form.name.trim(),
      body_part: form.body_part || null,
      sets: form.sets, reps: form.reps, weight: form.weight,
      duration: form.duration, distance: form.distance, calories: form.calories,
      rpe: form.rpe || null,
      condition: form.condition || null,
      memo: form.memo.trim() || null,
      xp,
      is_pr: form.is_pr,
    });

    if (profile) {
      const newXp = profile.total_xp + xp;
      const oldLevel = levelFromXp(profile.total_xp).level;
      const newLevel = levelFromXp(newXp).level;

      let streak = profile.streak_days;
      const last = profile.last_workout_date;
      if (last !== form.date) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (last === yStr) streak += 1;
        else if (!last || last < yStr) streak = 1;
      }

      await supabase.from("fitness_profile").update({
        total_xp: newXp,
        streak_days: streak,
        last_workout_date: form.date,
        updated_at: new Date().toISOString(),
      }).eq("id", profile.id);

      setXpToast(xp);
      setTimeout(() => setXpToast(null), 2500);
      if (newLevel > oldLevel) {
        setLevelUpTo(newLevel);
        setTimeout(() => setLevelUpTo(null), 3500);
      }
    }

    setForm({ ...form, name: "", sets: 0, reps: 0, weight: 0, duration: 0, distance: 0, calories: 0, memo: "", is_pr: false });
    load();
  };

  const remove = async (w: Workout) => {
    if (!confirm("삭제할까요? (경험치는 회수되지 않습니다)")) return;
    await supabase.from("workouts").delete().eq("id", w.id);
    load();
  };

  const filtered = filter === "전체" ? items : items.filter((i) => i.category === filter);
  const counts: Record<string, number> = { 전체: items.length };
  WORKOUT_CATEGORIES.forEach((c) => { counts[c] = items.filter((i) => i.category === c).length; });

  return (
    <div className="space-y-6">
      {/* 경험치 토스트 */}
      <AnimatePresence>
        {xpToast !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-50 px-6 py-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/50 backdrop-blur"
            style={{ boxShadow: "0 0 40px rgba(34, 211, 238, 0.5)" }}
          >
            <div className="flex items-center gap-3">
              <Zap className="text-cyan-300" size={22} />
              <div>
                <div className="text-sm text-cyan-200 tracking-wider font-semibold">경험치 획득</div>
                <div className="text-3xl font-black text-cyan-100 tabular-nums">+{xpToast}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 레벨업 이펙트 */}
      <AnimatePresence>
        {levelUpTo !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="px-14 py-10 rounded-2xl bg-zinc-900/95 border-2 border-amber-400 backdrop-blur"
              style={{ boxShadow: "0 0 100px rgba(251, 191, 36, 0.7)" }}>
              <div className="text-center">
                <Trophy className="mx-auto text-amber-300 mb-3" size={56} />
                <div className="text-base text-amber-200 tracking-[0.4em] font-bold">레벨 업</div>
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-rose-400 to-violet-500 mt-3">
                  Lv.{levelUpTo}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <div className="text-xs text-cyan-300/80 tracking-[0.3em] font-semibold">▸ 운동 기록</div>
        <h1 className="text-4xl font-black tracking-tight mt-1.5">운동 기록</h1>
      </header>

      {/* 필터 (클릭 시 입력 폼 카테고리도 함께 변경) */}
      <div className="flex flex-wrap gap-1.5">
        <FilterBtn label="전체" count={counts.전체} active={filter === "전체"} onClick={() => setFilter("전체")} />
        {WORKOUT_CATEGORIES.map((c) => (
          <FilterBtn
            key={c}
            label={c}
            count={counts[c]}
            active={filter === c}
            onClick={() => {
              setFilter(c);
              // 입력 폼도 해당 카테고리로 전환 + 부위 자동 보정
              const cfg = CATEGORY_CONFIG[c];
              const defaultPart = cfg?.bodyParts?.[0] ?? form.body_part;
              setForm((f) => ({ ...f, category: c, body_part: defaultPart }));
            }}
          />
        ))}
      </div>

      {/* 입력 폼 */}
      {isAdmin && (() => {
        const cfg = CATEGORY_CONFIG[form.category] ?? CATEGORY_CONFIG.자유운동;
        const showField = (f: string) => cfg.fields.includes(f as never);
        const tone = ACCENT_TONE[cfg.accent] ?? ACCENT_TONE.cyan;
        const bodyPartList = cfg.bodyParts || BODY_PARTS;

        return (
          <div className={`relative rounded-2xl border bg-zinc-800/50 p-6 space-y-4 ${CATEGORY_NEON[form.category]?.split(" ")[1] || "border-cyan-500/40"}`}
            style={{ boxShadow: "inset 0 0 40px rgba(34, 211, 238, 0.06)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`text-sm px-2.5 py-1 rounded border tracking-wider font-semibold ${CATEGORY_NEON[form.category]}`}>
                  {form.category}
                </span>
                <span className="text-sm text-zinc-300 font-semibold">새 기록</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400 tracking-wider">예상 경험치</div>
                <div className={`text-3xl font-black tabular-nums ${tone.text300}`}>+{predictedXp}</div>
              </div>
            </div>

            {/* 카테고리 선택 + 날짜 */}
            <div className="grid grid-cols-3 gap-2">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputCls} col-span-2`}>
                {WORKOUT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* 운동명 + 추천 칩 */}
            <div>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={cfg.placeholder} className={`${inputCls} w-full`} />
              {cfg.presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {cfg.presets.map((p) => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, name: p })}
                      className={`text-xs px-2.5 py-1.5 rounded border tracking-wide font-medium transition ${
                        form.name === p
                          ? `${CATEGORY_NEON[form.category]} border-current`
                          : "bg-zinc-800/70 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 카테고리 전용 필드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {showField("body_part") && (
                <LabeledSelect label="부위" value={form.body_part} options={[...bodyPartList]}
                  onChange={(v) => setForm({ ...form, body_part: v })} />
              )}

              {showField("sets") && <NumInput label="세트" value={form.sets} onChange={(v) => setForm({ ...form, sets: v })} />}
              {showField("reps") && <NumInput label="반복" value={form.reps} onChange={(v) => setForm({ ...form, reps: v })} />}
              {showField("weight") && <NumInput label="무게 (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />}
              {showField("duration") && <NumInput label="시간 (분)" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />}
              {showField("distance") && <NumInput label="거리 (km)" value={form.distance} onChange={(v) => setForm({ ...form, distance: v })} />}
              {showField("calories") && <NumInput label="칼로리" value={form.calories} onChange={(v) => setForm({ ...form, calories: v })} />}

              <LabeledSelect label="컨디션" value={form.condition} options={[...CONDITIONS]}
                onChange={(v) => setForm({ ...form, condition: v })} />
            </div>

            {/* 강도 슬라이더 */}
            {showField("rpe") && (
              <div className="flex items-center gap-3 px-1">
                <span className="text-sm text-zinc-300 w-20 font-semibold">강도 (RPE)</span>
                <input type="range" min={1} max={10} value={form.rpe}
                  onChange={(e) => setForm({ ...form, rpe: Number(e.target.value) })}
                  className={`flex-1 ${tone.accent}`} />
                <span className={`text-lg font-bold tabular-nums w-14 text-right ${tone.text400}`}>
                  {form.rpe} / 10
                </span>
              </div>
            )}

            <textarea rows={2} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="메모…" className={`${inputCls} w-full`} />

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_pr} onChange={(e) => setForm({ ...form, is_pr: e.target.checked })}
                  className="accent-amber-400 w-4 h-4" />
                <span className={`font-semibold ${form.is_pr ? "text-amber-300" : "text-zinc-400"}`}>
                  ★ 개인 신기록 (+200 경험치)
                </span>
              </label>
              <button onClick={add}
                className={`px-7 py-2.5 rounded-lg bg-gradient-to-r ${tone.gradient} text-zinc-950 font-bold text-base tracking-wide hover:opacity-90 transition`}
                style={{ boxShadow: "0 0 24px rgba(34, 211, 238, 0.4)" }}>
                기록 저장 ▸
              </button>
            </div>
          </div>
        );
      })()}

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <div className="text-base text-zinc-400 py-14 text-center border border-dashed border-zinc-700 rounded-2xl">
          기록이 없습니다 {!isAdmin && <>· <Link href="/login" className="text-cyan-300 underline">로그인</Link></>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-cyan-500/50 transition"
            >
              <div className="flex items-start gap-3">
                <span className={`text-xs px-2.5 py-1 rounded border tracking-wider font-medium ${CATEGORY_NEON[w.category] || CATEGORY_NEON.자유운동}`}>
                  {w.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold">{w.name}</span>
                    {w.is_pr && <span className="text-xs text-amber-300 font-bold tracking-wider">★ 신기록</span>}
                    {w.body_part && <span className="text-sm text-zinc-400">· {w.body_part}</span>}
                    {w.rpe && <span className="text-sm text-rose-300">· 강도 {w.rpe}</span>}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {w.date}
                    {w.sets > 0 && ` · ${w.sets}세트 × ${w.reps}회`}
                    {w.weight > 0 && ` · ${w.weight}kg`}
                    {w.duration > 0 && ` · ${w.duration}분`}
                    {w.distance > 0 && ` · ${w.distance}km`}
                    {w.calories > 0 && ` · ${w.calories}kcal`}
                  </div>
                  {w.memo && <div className="text-sm text-zinc-300 mt-2">{w.memo}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-cyan-300 tabular-nums">+{w.xp}</div>
                  <div className="text-xs text-zinc-500">경험치</div>
                  {isAdmin && (
                    <button onClick={() => remove(w)} className="mt-2 text-xs text-rose-300 hover:text-rose-200">삭제</button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-2 text-sm tracking-wide font-medium rounded-md border transition ${
        active
          ? "bg-cyan-500/25 border-cyan-400/70 text-cyan-100"
          : "bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500"
      }`}>
      {label} <span className="opacity-70 ml-0.5">{count}</span>
    </button>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2">
      <div className="text-xs text-zinc-400">{label}</div>
      <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-transparent text-cyan-200 text-lg font-bold tabular-nums focus:outline-none" />
    </div>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2">
      <div className="text-xs text-zinc-400">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-cyan-200 text-base font-bold focus:outline-none">
        {options.map((o) => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
      </select>
    </div>
  );
}

const inputCls = "bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-cyan-400 text-zinc-100";

// 카테고리 강조색 정적 매핑 (Tailwind purge 회피)
const ACCENT_TONE: Record<string, { text300: string; text400: string; accent: string; gradient: string }> = {
  rose:    { text300: "text-rose-300",    text400: "text-rose-400",    accent: "accent-rose-500",    gradient: "from-rose-500 to-violet-500" },
  cyan:    { text300: "text-cyan-300",    text400: "text-cyan-400",    accent: "accent-cyan-500",    gradient: "from-cyan-500 to-violet-500" },
  amber:   { text300: "text-amber-300",   text400: "text-amber-400",   accent: "accent-amber-500",   gradient: "from-amber-500 to-rose-500" },
  emerald: { text300: "text-emerald-300", text400: "text-emerald-400", accent: "accent-emerald-500", gradient: "from-emerald-500 to-cyan-500" },
  sky:     { text300: "text-sky-300",     text400: "text-sky-400",     accent: "accent-sky-500",     gradient: "from-sky-500 to-violet-500" },
  blue:    { text300: "text-blue-300",    text400: "text-blue-400",    accent: "accent-blue-500",    gradient: "from-blue-500 to-cyan-500" },
  red:     { text300: "text-red-300",     text400: "text-red-400",     accent: "accent-red-500",     gradient: "from-red-500 to-amber-500" },
  violet:  { text300: "text-violet-300",  text400: "text-violet-400",  accent: "accent-violet-500",  gradient: "from-violet-500 to-cyan-500" },
  teal:    { text300: "text-teal-300",    text400: "text-teal-400",    accent: "accent-teal-500",    gradient: "from-teal-500 to-emerald-500" },
  zinc:    { text300: "text-zinc-300",    text400: "text-zinc-400",    accent: "accent-zinc-500",    gradient: "from-zinc-500 to-zinc-700" },
};
