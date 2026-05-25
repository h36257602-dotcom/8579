"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Hobby } from "@/lib/types";

export default function HobbiesPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Hobby[]>([]);
  const [form, setForm] = useState({ name: "", description: "", level: "초급", started_at: "" });

  const load = async () => {
    const { data } = await supabase.from("hobbies").select("*").order("created_at", { ascending: false });
    setItems((data as Hobby[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await supabase.from("hobbies").insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      level: form.level || null,
      started_at: form.started_at || null,
    });
    setForm({ name: "", description: "", level: "초급", started_at: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("hobbies").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Hobbies</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">취미</h1>
        <div className="text-xs text-zinc-500 mt-2">{items.length}개</div>
      </header>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">취미 추가</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름 (예: 등산)" className={inputCls} />
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls}>
              <option>입문</option><option>초급</option><option>중급</option><option>고급</option>
            </select>
            <input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} className={inputCls} />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="설명" className={inputCls} />
          </div>
          <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-xs text-zinc-500 py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
          취미가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((h) => (
            <div key={h.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-base font-semibold">{h.name}</div>
                  {h.level && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md border bg-violet-500/15 text-violet-300 border-violet-500/30">{h.level}</span>}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(h.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10">삭제</button>
                )}
              </div>
              {h.description && <div className="text-xs text-zinc-400 mt-2 leading-relaxed">{h.description}</div>}
              {h.started_at && <div className="text-[11px] text-zinc-500 mt-3">시작: {h.started_at}</div>}
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
