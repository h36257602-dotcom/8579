"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Asset } from "@/lib/types";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n || 0);

// 5개 고정 중분류
const CATEGORIES = ["부동산", "고정자산", "현금자산", "주식투자", "기타자산"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLOR: Record<Category, string> = {
  부동산:   "from-amber-500 to-rose-500",
  고정자산: "from-sky-500 to-violet-500",
  현금자산: "from-emerald-500 to-teal-500",
  주식투자: "from-rose-500 to-pink-500",
  기타자산: "from-zinc-500 to-zinc-700",
};

export default function AssetsPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<Asset[]>([]);
  const [form, setForm] = useState<{ name: string; category: Category; amount: string; note: string }>({
    name: "", category: "현금자산", amount: "", note: "",
  });

  const load = async () => {
    const { data } = await supabase.from("assets").select("*").order("amount", { ascending: false });
    setItems((data as Asset[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    await supabase.from("assets").insert({
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount) || 0,
      note: form.note.trim() || null,
    });
    setForm({ name: "", category: "현금자산", amount: "", note: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("assets").delete().eq("id", id);
    load();
  };

  const updateAmount = async (id: string, amount: number) => {
    await supabase.from("assets").update({ amount, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const updateCategory = async (id: string, category: string) => {
    await supabase.from("assets").update({ category }).eq("id", id);
    load();
  };

  const total = items.reduce((s, a) => s + (a.amount || 0), 0);

  // 5개 카테고리 기준 그룹화 (없는 것은 0)
  const grouped: Record<string, Asset[]> = {};
  CATEGORIES.forEach((c) => { grouped[c] = []; });
  items.forEach((a) => {
    const k = (CATEGORIES as readonly string[]).includes(a.category || "") ? (a.category as string) : "기타자산";
    grouped[k].push(a);
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Assets</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">자산</h1>
        <div className="mt-3 text-3xl font-bold tabular-nums text-emerald-400">₩{fmt(total)}</div>
        <div className="text-xs text-zinc-500 mt-1">{items.length}개 항목 · 5개 분류</div>
      </header>

      {/* 5개 분류 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.map((c) => {
          const sum = grouped[c].reduce((s, a) => s + (a.amount || 0), 0);
          const pct = total > 0 ? (sum / total) * 100 : 0;
          return (
            <div key={c} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-xs text-zinc-400 font-medium">{c}</div>
              <div className="text-lg font-semibold tabular-nums mt-1">₩{fmt(sum)}</div>
              <div className="text-[11px] text-zinc-500 mt-1 tabular-nums">{pct.toFixed(1)}% · {grouped[c].length}개</div>
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${CATEGORY_COLOR[c]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-sm font-semibold">자산 추가</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름 (예: 국민은행 예금)" className={inputCls} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액 (원)" className={inputCls} />
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="메모 (선택)" className={inputCls} />
          </div>
          <button onClick={add} className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-white">추가</button>
        </div>
      )}

      {/* 분류별 항목 리스트 */}
      <div className="space-y-5">
        {CATEGORIES.map((c) => {
          const list = grouped[c];
          if (list.length === 0 && !isAdmin) return null;
          const sum = list.reduce((s, a) => s + (a.amount || 0), 0);
          return (
            <section key={c}>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${CATEGORY_COLOR[c]}`} />
                  {c}
                  <span className="text-xs text-zinc-500 font-normal">· {list.length}개</span>
                </h2>
                <div className="text-sm tabular-nums text-zinc-300">₩{fmt(sum)}</div>
              </div>

              {list.length === 0 ? (
                <div className="p-4 text-xs text-zinc-500 text-center border border-dashed border-zinc-800 rounded-xl">
                  항목이 없습니다.
                </div>
              ) : (
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <tbody>
                      {list.map((a) => (
                        <tr key={a.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/30">
                          <td className="px-4 py-3 font-medium w-1/3">{a.name}</td>
                          <td className="px-4 py-3 text-right tabular-nums w-40">
                            {isAdmin ? (
                              <input
                                type="number"
                                defaultValue={a.amount}
                                onBlur={(e) => { const v = Number(e.target.value); if (v !== a.amount) updateAmount(a.id, v); }}
                                className="w-full text-right bg-transparent border-b border-zinc-700 focus:outline-none focus:border-zinc-400 tabular-nums"
                              />
                            ) : <span className="font-medium">₩{fmt(a.amount)}</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{a.note || ""}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right whitespace-nowrap w-44">
                              <select
                                value={a.category || "기타자산"}
                                onChange={(e) => updateCategory(a.id, e.target.value)}
                                className="text-[11px] bg-zinc-950 border border-zinc-800 rounded px-2 py-1 focus:outline-none mr-1"
                              >
                                {CATEGORIES.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
                              </select>
                              <button onClick={() => remove(a.id)} className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10">삭제</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {!isAdmin && (
        <div className="text-xs text-zinc-500 text-center">
          수정하려면 <Link href="/admin" className="text-zinc-300 underline">관리자 로그인</Link>
        </div>
      )}
    </div>
  );
}

const inputCls = "bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600";
