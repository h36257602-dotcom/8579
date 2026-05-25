"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Trip } from "@/lib/types";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);

const statusLabel = { planned: "예정", done: "다녀옴", cancelled: "취소" } as const;
const statusCls = {
  planned:   "bg-violet-500/15 text-violet-300 border-violet-500/30",
  done:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function TravelPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Trip[]>([]);
  const [form, setForm] = useState({ name: "", destination: "", start_date: "", end_date: "", budget: "", note: "" });

  const load = async () => {
    const { data } = await supabase.from("trips").select("*").order("start_date", { ascending: false });
    setItems((data as Trip[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await supabase.from("trips").insert({
      name: form.name.trim(),
      destination: form.destination.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: Number(form.budget) || 0,
      note: form.note.trim() || null,
    });
    setForm({ name: "", destination: "", start_date: "", end_date: "", budget: "", note: "" });
    load();
  };

  const updateStatus = async (id: string, status: Trip["status"]) => {
    await supabase.from("trips").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("trips").delete().eq("id", id);
    load();
  };

  const upcoming = items.filter((t) => t.status === "planned" && (!t.start_date || t.start_date >= today()));
  const past = items.filter((t) => t.status === "done" || (t.end_date && t.end_date < today()));

  const TripCard = ({ t }: { t: Trip }) => {
    const days = t.start_date && t.end_date
      ? Math.max(1, Math.round((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / 86400000) + 1)
      : null;
    return (
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-semibold">{t.name}</div>
            {t.destination && <div className="text-xs text-zinc-400 mt-1">📍 {t.destination}</div>}
          </div>
          {isAdmin ? (
            <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value as Trip["status"])}
              className={`text-[11px] px-2 py-1 rounded border focus:outline-none ${statusCls[t.status]}`}>
              <option value="planned">예정</option>
              <option value="done">다녀옴</option>
              <option value="cancelled">취소</option>
            </select>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${statusCls[t.status]}`}>{statusLabel[t.status]}</span>
          )}
        </div>
        <div className="space-y-1 text-xs">
          {(t.start_date || t.end_date) && (
            <div className="text-zinc-400">
              📅 {t.start_date || "?"} ~ {t.end_date || "?"}
              {days && <span className="text-zinc-500 ml-2">({days}일)</span>}
            </div>
          )}
          {t.budget > 0 && <div className="text-zinc-400">💰 ₩{fmt(t.budget)}</div>}
          {t.note && <div className="text-zinc-400 mt-2 leading-relaxed">{t.note}</div>}
        </div>
        {isAdmin && (
          <button onClick={() => remove(t.id)} className="mt-3 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10">삭제</button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Travel</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">여행</h1>
        <div className="text-xs text-zinc-500 mt-2">{items.length}개 · 예정 {upcoming.length} · 다녀옴 {past.length}</div>
      </header>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">여행 추가</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="여행 이름 (예: 제주 가족여행)" className={inputCls} />
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="목적지 (예: 제주도)" className={inputCls} />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
            <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="예산 (원)" className={inputCls} />
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="메모" className={inputCls} />
          </div>
          <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="text-sm font-semibold mb-3">예정된 여행</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((t) => <TripCard key={t.id} t={t} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div className="text-sm font-semibold mb-3">다녀온 여행</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map((t) => <TripCard key={t.id} t={t} />)}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="text-xs text-zinc-500 py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
          여행 기록이 없습니다.
        </div>
      )}

      {!isAdmin && (
        <div className="text-xs text-zinc-500 text-center">
          추가하려면 <Link href="/admin" className="text-zinc-300 underline">관리자 로그인</Link>
        </div>
      )}
    </div>
  );
}

const inputCls = "bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600";
