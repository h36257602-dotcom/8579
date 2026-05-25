"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { WorkItem } from "@/lib/types";

const statusLabel = { todo: "할 일", doing: "진행중", done: "완료" } as const;
const statusCls = {
  todo:  "bg-zinc-800 text-zinc-300 border-zinc-700",
  doing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  done:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};
const priorityCls = {
  high:   "bg-rose-500/15 text-rose-300 border-rose-500/30",
  normal: "bg-zinc-800 text-zinc-400 border-zinc-700",
  low:    "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export default function WorkPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [filter, setFilter] = useState<"all" | WorkItem["status"]>("all");
  const [form, setForm] = useState({ title: "", project: "", priority: "normal" as WorkItem["priority"], due_date: "", note: "" });

  const load = async () => {
    const { data } = await supabase.from("work_items").select("*").order("created_at", { ascending: false });
    setItems((data as WorkItem[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    await supabase.from("work_items").insert({
      title: form.title.trim(),
      project: form.project.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      note: form.note.trim() || null,
    });
    setForm({ title: "", project: "", priority: "normal", due_date: "", note: "" });
    load();
  };

  const updateStatus = async (id: string, status: WorkItem["status"]) => {
    await supabase.from("work_items").update({
      status,
      done_at: status === "done" ? new Date().toISOString() : null,
    }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("work_items").delete().eq("id", id);
    load();
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const counts = {
    all: items.length,
    todo: items.filter((i) => i.status === "todo").length,
    doing: items.filter((i) => i.status === "doing").length,
    done: items.filter((i) => i.status === "done").length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Work</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">업무</h1>
        <div className="text-xs text-zinc-500 mt-2">{counts.all}개 항목 · {counts.todo} 할 일 · {counts.doing} 진행중 · {counts.done} 완료</div>
      </header>

      <div className="flex gap-2 text-xs">
        {(["all", "todo", "doing", "done"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg border ${filter === s ? "bg-zinc-100 text-zinc-900 border-zinc-100" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"}`}>
            {s === "all" ? "전체" : statusLabel[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">업무 추가</div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="할 일 제목" className={`${inputCls} w-full`} />
          <div className="grid grid-cols-3 gap-2">
            <input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="프로젝트" className={inputCls} />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WorkItem["priority"] })} className={inputCls}>
              <option value="low">낮음</option><option value="normal">보통</option><option value="high">높음</option>
            </select>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
          </div>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="메모 (선택)" className={`${inputCls} w-full`} />
          <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-xs text-zinc-500 py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
          업무가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <div key={w.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${w.status === "done" ? "line-through text-zinc-500" : ""}`}>{w.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${priorityCls[w.priority]}`}>
                      {w.priority === "high" ? "긴급" : w.priority === "low" ? "낮음" : "보통"}
                    </span>
                    {w.project && <span className="text-[11px] text-zinc-500">· {w.project}</span>}
                    {w.due_date && <span className="text-[11px] text-zinc-500">· 마감 {w.due_date}</span>}
                  </div>
                  {w.note && <div className="text-xs text-zinc-400 mt-1">{w.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select value={w.status} onChange={(e) => updateStatus(w.id, e.target.value as WorkItem["status"])}
                      className={`text-[11px] px-2 py-1 rounded border focus:outline-none ${statusCls[w.status]}`}>
                      <option value="todo">할 일</option>
                      <option value="doing">진행중</option>
                      <option value="done">완료</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${statusCls[w.status]}`}>{statusLabel[w.status]}</span>
                  )}
                  {isAdmin && (
                    <button onClick={() => remove(w.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10">삭제</button>
                  )}
                </div>
              </div>
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
