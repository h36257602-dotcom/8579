"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { BodyMetric } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const today = () => new Date().toISOString().slice(0, 10);

export default function BodyMetricsPage() {
  const isAdmin = useAdmin();
  const [items, setItems] = useState<BodyMetric[]>([]);
  const [form, setForm] = useState({
    date: today(),
    weight: "", body_fat: "", muscle_mass: "", bmi: "",
    sleep_score: "", condition_score: "", note: "",
  });

  const load = async () => {
    const { data } = await supabase.from("body_metrics").select("*").order("date", { ascending: false });
    setItems((data as BodyMetric[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      date: form.date,
      weight: form.weight ? Number(form.weight) : null,
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      muscle_mass: form.muscle_mass ? Number(form.muscle_mass) : null,
      bmi: form.bmi ? Number(form.bmi) : null,
      sleep_score: form.sleep_score ? Number(form.sleep_score) : null,
      condition_score: form.condition_score ? Number(form.condition_score) : null,
      note: form.note.trim() || null,
    };
    await supabase.from("body_metrics").upsert(payload, { onConflict: "date" });
    setForm({ ...form, weight: "", body_fat: "", muscle_mass: "", bmi: "", sleep_score: "", condition_score: "", note: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("body_metrics").delete().eq("id", id);
    load();
  };

  const chartData = [...items].reverse().map((b) => ({
    date: b.date.slice(5),
    체중: b.weight,
    체지방: b.body_fat,
    근육량: b.muscle_mass,
  }));

  return (
    <div className="space-y-6 font-mono">
      <header>
        <div className="text-[10px] text-cyan-400/70 tracking-[0.3em]">▸ 신체 측정</div>
        <h1 className="text-3xl font-black tracking-tight mt-1">신체 측정</h1>
        <div className="text-xs text-zinc-500 mt-2 tracking-wider">{items.length}개 기록</div>
      </header>

      {chartData.length > 0 && (
        <div className="rounded-2xl border border-cyan-500/30 bg-zinc-950/80 p-5">
          <div className="text-[11px] text-cyan-400 tracking-[0.2em] mb-3">▸ 추이 · 체중 / 근육량 / 체지방</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#52525b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #22d3ee", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="체중" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="근육량" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="체지방" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-cyan-500/30 bg-zinc-950/80 p-5 space-y-3">
          <div className="text-[11px] text-cyan-400 tracking-[0.2em]">▸ 새 측정 · 같은 날짜는 덮어씁니다</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="날짜"        type="date"   value={form.date}            onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="체중 (kg)"   type="number" value={form.weight}          onChange={(v) => setForm({ ...form, weight: v })} />
            <Field label="체지방 (%)"  type="number" value={form.body_fat}        onChange={(v) => setForm({ ...form, body_fat: v })} />
            <Field label="근육량 (kg)" type="number" value={form.muscle_mass}     onChange={(v) => setForm({ ...form, muscle_mass: v })} />
            <Field label="BMI"         type="number" value={form.bmi}             onChange={(v) => setForm({ ...form, bmi: v })} />
            <Field label="수면 (0~100)" type="number" value={form.sleep_score}    onChange={(v) => setForm({ ...form, sleep_score: v })} />
            <Field label="컨디션 (0~100)" type="number" value={form.condition_score} onChange={(v) => setForm({ ...form, condition_score: v })} />
          </div>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="메모" className={inputCls} />
          <button onClick={save}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 font-bold text-sm tracking-wider"
            style={{ boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)" }}>
            측정값 저장 ▸
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-xs text-zinc-500 py-12 text-center border border-dashed border-zinc-800 rounded-2xl tracking-wider">
          측정 기록이 없습니다 {!isAdmin && <>· <Link href="/login" className="text-cyan-400 underline">로그인</Link></>}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-700 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-zinc-900 text-[11px] tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-3 py-2.5">날짜</th>
                <th className="text-right px-3 py-2.5">체중</th>
                <th className="text-right px-3 py-2.5">체지방%</th>
                <th className="text-right px-3 py-2.5">근육량</th>
                <th className="text-right px-3 py-2.5">BMI</th>
                <th className="text-right px-3 py-2.5">수면</th>
                <th className="text-right px-3 py-2.5">컨디션</th>
                <th className="text-left px-3 py-2.5">메모</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800/60">
                  <td className="px-3 py-2 tabular-nums">{b.date}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-cyan-300">{b.weight ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-rose-300">{b.body_fat ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-300">{b.muscle_mass ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-violet-300">{b.bmi ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-sky-300">{b.sleep_score ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-300">{b.condition_score ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{b.note || ""}</td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => remove(b.id)} className="text-[11px] text-rose-400 hover:text-rose-300">삭제</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5">
      <div className="text-[10px] text-zinc-500 tracking-wider">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step="0.1"
        className="w-full bg-transparent text-cyan-300 text-sm font-bold tabular-nums focus:outline-none" />
    </div>
  );
}

const inputCls = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 text-zinc-100";
