"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Goal, Habit, HabitLog } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  // 새로고침해도 로그인 유지 (sessionStorage)
  useEffect(() => {
    if (sessionStorage.getItem("admin_ok") === "1") setUnlocked(true);
  }, []);

  const tryLogin = async () => {
    setErr("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    const { ok } = await res.json();
    if (ok) {
      sessionStorage.setItem("admin_ok", "1");
      setUnlocked(true);
    } else {
      setErr("비밀번호가 틀렸습니다.");
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] mb-2">Admin</div>
          <h1 className="text-xl font-semibold mb-6">관리자 로그인</h1>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="비밀번호"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-600"
            autoFocus
          />
          {err && <div className="text-xs text-rose-400 mt-2">{err}</div>}
          <button onClick={tryLogin} className="w-full mt-4 bg-zinc-100 text-zinc-900 rounded-lg py-2.5 text-sm font-medium hover:bg-white transition">
            들어가기
          </button>
          <Link href="/" className="block text-center text-xs text-zinc-500 mt-4 hover:text-zinc-300">← 홈으로</Link>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [tab, setTab] = useState<"habits" | "goals">("habits");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Admin</div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">관리자 패널</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/" className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">홈 보기</Link>
            <button
              onClick={() => { sessionStorage.removeItem("admin_ok"); location.reload(); }}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400"
            >로그아웃</button>
          </div>
        </header>

        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          {(["habits", "goals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >{t === "habits" ? "습관" : "목표"}</button>
          ))}
        </div>

        {tab === "habits" ? <HabitManager /> : <GoalManager />}
      </div>
    </div>
  );
}

// ============================================================================
// 습관 관리
// ============================================================================
function HabitManager() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const load = async () => {
    const [h, l] = await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").eq("date", today()),
    ]);
    setHabits((h.data as Habit[]) ?? []);
    setLogs((l.data as HabitLog[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("habits").insert({ name: name.trim(), emoji: emoji.trim() || null });
    setName(""); setEmoji("");
    load();
  };

  const toggle = async (habit_id: string) => {
    const existing = logs.find((l) => l.habit_id === habit_id);
    if (existing) {
      await supabase.from("habit_logs").update({ done: !existing.done }).eq("id", existing.id);
    } else {
      await supabase.from("habit_logs").insert({ habit_id, date: today(), done: true });
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("정말 삭제할까요? (지난 기록도 함께 삭제됩니다)")) return;
    await supabase.from("habits").delete().eq("id", id);
    load();
  };

  const toggleActive = async (h: Habit) => {
    await supabase.from("habits").update({ active: !h.active }).eq("id", h.id);
    load();
  };

  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.habit_id));

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm font-semibold mb-3">새 습관 추가</div>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🏃"
            className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-zinc-600"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="예: 30분 운동하기"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
          />
          <button onClick={add} className="px-4 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white">추가</button>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">오늘의 체크 ({today()})</div>
        {habits.filter((h) => h.active).length === 0 ? (
          <div className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-xl">활성 습관이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {habits.filter((h) => h.active).map((h) => {
              const done = doneSet.has(h.id);
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-900/60 border-zinc-800"}`}>
                  <button
                    onClick={() => toggle(h.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold transition ${done ? "bg-emerald-500 border-emerald-500 text-zinc-950" : "border-zinc-600 hover:border-zinc-400"}`}
                  >{done ? "✓" : ""}</button>
                  <span className="text-lg">{h.emoji || "✨"}</span>
                  <span className="flex-1 text-sm">{h.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">전체 습관 관리</div>
        <div className="space-y-2">
          {habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-lg">{h.emoji || "✨"}</span>
              <span className={`flex-1 text-sm ${!h.active && "text-zinc-500 line-through"}`}>{h.name}</span>
              <button onClick={() => toggleActive(h)} className="text-[11px] text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800">
                {h.active ? "비활성화" : "활성화"}
              </button>
              <button onClick={() => remove(h.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10">삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 목표 관리
// ============================================================================
function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "", target_date: "" });

  const load = async () => {
    const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
    setGoals((data as Goal[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    await supabase.from("goals").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      target_date: form.target_date || null,
    });
    setForm({ title: "", description: "", category: "", target_date: "" });
    load();
  };

  const updateStatus = async (id: string, status: Goal["status"]) => {
    await supabase.from("goals").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("goals").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="text-sm font-semibold">새 목표 추가</div>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="목표 제목 (예: 책 12권 읽기)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
        />
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="설명 (선택)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="카테고리 (예: 건강, 커리어)"
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
          />
          <input
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
          />
        </div>
        <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
      </div>

      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {g.category && <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{g.category}</div>}
                <div className="text-sm font-semibold">{g.title}</div>
                {g.description && <div className="text-xs text-zinc-400 mt-1">{g.description}</div>}
                {g.target_date && <div className="text-[11px] text-zinc-500 mt-2">목표일: {g.target_date}</div>}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <select
                  value={g.status}
                  onChange={(e) => updateStatus(g.id, e.target.value as Goal["status"])}
                  className="text-[11px] bg-zinc-950 border border-zinc-800 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="active">진행중</option>
                  <option value="done">달성</option>
                  <option value="paused">보류</option>
                </select>
                <button onClick={() => remove(g.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10">삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
