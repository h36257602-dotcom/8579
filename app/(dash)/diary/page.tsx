"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Diary } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function DiaryPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Diary[]>([]);
  const [form, setForm] = useState({ date: today(), title: "", content: "", mood: "보통" });

  const load = async () => {
    const { data } = await supabase.from("diary").select("*").order("date", { ascending: false });
    setItems((data as Diary[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.content.trim()) { alert("내용을 입력하세요."); return; }
    await supabase.from("diary").insert({
      date: form.date,
      title: form.title.trim() || null,
      content: form.content.trim(),
      mood: form.mood || null,
    });
    setForm({ date: today(), title: "", content: "", mood: "보통" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("diary").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Diary</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">일기</h1>
        <div className="text-xs text-zinc-500 mt-2">{items.length}개의 기록</div>
      </header>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">새 일기</div>
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="제목 (선택)" className={`${inputCls} col-span-2`} />
          </div>
          <textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="오늘 있었던 일, 느낀 것…"
            className={`${inputCls} w-full resize-y`}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">기분</span>
            {["좋음", "보통", "나쁨", "행복", "우울", "분노"].map((m) => (
              <button key={m} onClick={() => setForm({ ...form, mood: m })}
                className={`px-2.5 py-1 text-xs rounded-md border ${form.mood === m ? "bg-violet-500/20 text-violet-200 border-violet-500/40" : "bg-zinc-950 text-zinc-400 border-zinc-800"}`}>
                {m}
              </button>
            ))}
            <button onClick={add} className="ml-auto bg-zinc-100 text-zinc-900 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-white">저장</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-xs text-zinc-500 py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
          기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <article key={d.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-zinc-500 tabular-nums">{d.date}{d.mood && ` · ${d.mood}`}</div>
                  {d.title && <div className="text-base font-semibold mt-1">{d.title}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(d.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10">삭제</button>
                )}
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{d.content}</div>
            </article>
          ))}
        </div>
      )}

      {!isAdmin && (
        <div className="text-xs text-zinc-500 text-center">
          쓰려면 <Link href="/admin" className="text-zinc-300 underline">관리자 로그인</Link>
        </div>
      )}
    </div>
  );
}

const inputCls = "bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600";
