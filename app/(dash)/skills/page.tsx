"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Skill } from "@/lib/types";

export default function SkillsPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Skill[]>([]);
  const [form, setForm] = useState({ name: "", description: "", category: "", level: 3 });

  const load = async () => {
    const { data } = await supabase.from("skills").select("*").order("level", { ascending: false });
    setItems((data as Skill[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await supabase.from("skills").insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      level: form.level,
    });
    setForm({ name: "", description: "", category: "", level: 3 });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("skills").delete().eq("id", id);
    load();
  };

  const updateLevel = async (id: string, level: number) => {
    await supabase.from("skills").update({ level }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Skills</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">특기</h1>
        <div className="text-xs text-zinc-500 mt-2">{items.length}개 · 1~5 레벨</div>
      </header>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">특기 추가</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름 (예: Python)" className={inputCls} />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="카테고리 (예: 프로그래밍, 언어)" className={inputCls} />
            <div className="col-span-2 flex items-center gap-3">
              <span className="text-xs text-zinc-500">레벨</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, level: n })}
                  className={`w-8 h-8 rounded-md text-xs font-semibold ${form.level >= n ? "bg-gradient-to-br from-violet-500 to-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500"}`}>{n}</button>
              ))}
            </div>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="설명" className={`${inputCls} col-span-2`} />
          </div>
          <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-xs text-zinc-500 py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
          특기가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{s.name}</span>
                  {s.category && <span className="text-[10px] text-zinc-500">· {s.category}</span>}
                </div>
                {s.description && <div className="text-xs text-zinc-400 mt-1">{s.description}</div>}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n}
                    onClick={() => isAdmin && updateLevel(s.id, n)}
                    disabled={!isAdmin}
                    className={`w-6 h-6 rounded text-[10px] font-semibold ${s.level >= n ? "bg-gradient-to-br from-violet-500 to-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500"} ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                  >{n}</button>
                ))}
              </div>
              {isAdmin && (
                <button onClick={() => remove(s.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10">삭제</button>
              )}
            </div>
          ))}
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
