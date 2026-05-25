"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { Trip, TripDay, TripPlace, TripExpense } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, Plus, Trash2, MapPin, Calendar, Wallet, FileText, BarChart3 } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n || 0);

const PLACE_CATEGORIES = ["명소", "식당", "카페", "숙소", "쇼핑", "교통", "기타"] as const;
const EXPENSE_CATEGORIES = ["항공", "숙소", "식사", "교통", "관광", "쇼핑", "기타"] as const;
const MOODS = ["최고", "좋음", "보통", "별로", "최악"] as const;

const MOOD_EMOJI: Record<string, string> = { 최고: "🤩", 좋음: "😊", 보통: "🙂", 별로: "😐", 최악: "😞" };
const PLACE_EMOJI: Record<string, string> = { 명소: "🗺️", 식당: "🍴", 카페: "☕", 숙소: "🏨", 쇼핑: "🛍️", 교통: "🚗", 기타: "📍" };
const EXPENSE_COLOR: Record<string, string> = {
  항공: "#f43f5e", 숙소: "#8b5cf6", 식사: "#f59e0b",
  교통: "#3b82f6", 관광: "#10b981", 쇼핑: "#ec4899", 기타: "#71717a",
};

type Tab = "timeline" | "expenses" | "reviews" | "summary";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const isAdmin = useAdmin();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("timeline");

  const refresh = async () => {
    const [t, d, p, e] = await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).maybeSingle(),
      supabase.from("trip_days").select("*").eq("trip_id", tripId).order("date"),
      supabase.from("trip_places").select("*").eq("trip_id", tripId).order("date").order("time"),
      supabase.from("trip_expenses").select("*").eq("trip_id", tripId).order("date"),
    ]);
    setTrip((t.data as Trip) ?? null);
    setDays((d.data as TripDay[]) ?? []);
    setPlaces((p.data as TripPlace[]) ?? []);
    setExpenses((e.data as TripExpense[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [tripId]);

  // 여행 전체 일자 목록 생성 (start ~ end)
  const dateRange = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return [];
    const out: string[] = [];
    const s = new Date(trip.start_date);
    const e = new Date(trip.end_date);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, [trip]);

  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) return <div className="text-zinc-400 text-sm py-20 text-center">불러오는 중…</div>;
  if (!trip) return <div className="text-zinc-400 text-sm py-20 text-center">여행을 찾을 수 없습니다</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 헤더 */}
      <header>
        <Link href="/travel" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-3">
          <ArrowLeft size={15} /> 여행 목록
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
            <div className="text-sm text-zinc-300 mt-2">
              {trip.destination && <span className="mr-3">📍 {trip.destination}</span>}
              {trip.start_date && (
                <span>📅 {trip.start_date} ~ {trip.end_date} <span className="text-zinc-500">({dateRange.length}일)</span></span>
              )}
            </div>
          </div>
          <StatusBadge status={trip.status} />
        </div>
      </header>

      {/* 빠른 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="일정" value={`${dateRange.length}일`} color="violet" />
        <MiniStat label="방문 장소" value={`${places.length}곳`} color="cyan" />
        <MiniStat label="총 지출" value={`₩${fmt(totalExpense)}`} color="rose" />
        <MiniStat label="예산" value={trip.budget > 0 ? `₩${fmt(trip.budget)}` : "—"} color="emerald" sub={trip.budget > 0 ? `${Math.round((totalExpense / trip.budget) * 100)}% 사용` : ""} />
      </div>

      {/* 탭 */}
      <nav className="flex gap-1 border-b border-zinc-700 overflow-x-auto">
        {([
          { id: "timeline", label: "타임라인", icon: Calendar },
          { id: "expenses", label: "지출", icon: Wallet },
          { id: "reviews",  label: "후기",  icon: FileText },
          { id: "summary",  label: "요약",  icon: BarChart3 },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
                active ? "border-violet-400 text-violet-200 font-semibold" : "border-transparent text-zinc-400 hover:text-zinc-100"
              }`}>
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "timeline" && <TimelineTab tripId={tripId} dateRange={dateRange} places={places} isAdmin={isAdmin} refresh={refresh} />}
      {tab === "expenses" && <ExpensesTab tripId={tripId} expenses={expenses} totalExpense={totalExpense} isAdmin={isAdmin} refresh={refresh} />}
      {tab === "reviews"  && <ReviewsTab  tripId={tripId} dateRange={dateRange} days={days} isAdmin={isAdmin} refresh={refresh} />}
      {tab === "summary"  && <SummaryTab  trip={trip} days={days} places={places} expenses={expenses} dateRange={dateRange} />}
    </div>
  );
}

// ============================================================================
// 타임라인 탭
// ============================================================================
function TimelineTab({ tripId, dateRange, places, isAdmin, refresh }: {
  tripId: string; dateRange: string[]; places: TripPlace[]; isAdmin: boolean; refresh: () => void;
}) {
  const [adding, setAdding] = useState<string | null>(null); // 추가 폼이 열린 날짜
  const [form, setForm] = useState({ time: "", name: "", category: "명소", rating: 0, note: "" });

  const addPlace = async (date: string) => {
    if (!form.name.trim()) return;
    await supabase.from("trip_places").insert({
      trip_id: tripId,
      date,
      time: form.time.trim() || null,
      name: form.name.trim(),
      category: form.category,
      rating: form.rating || null,
      note: form.note.trim() || null,
    });
    setForm({ time: "", name: "", category: "명소", rating: 0, note: "" });
    setAdding(null);
    refresh();
  };

  const removePlace = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("trip_places").delete().eq("id", id);
    refresh();
  };

  if (dateRange.length === 0) {
    return <div className="text-sm text-zinc-400 py-10 text-center border border-dashed border-zinc-700 rounded-2xl">
      여행 시작일/종료일을 먼저 설정하세요 (여행 목록에서 수정)
    </div>;
  }

  return (
    <div className="space-y-4">
      {dateRange.map((date, idx) => {
        const dayPlaces = places.filter((p) => p.date === date);
        const isAddingThis = adding === date;
        const d = new Date(date);
        const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
        return (
          <div key={date} className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-xs text-zinc-400">Day {idx + 1}</div>
                <div className="text-lg font-semibold">{date} <span className="text-sm text-zinc-400">({weekday}요일)</span></div>
              </div>
              <div className="text-sm text-zinc-400">{dayPlaces.length}곳 방문</div>
            </div>

            {dayPlaces.length === 0 ? (
              <div className="text-xs text-zinc-500 py-3 text-center">기록된 장소가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {dayPlaces.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-700">
                    <div className="text-2xl">{PLACE_EMOJI[p.category || "기타"]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.time && <span className="text-xs text-violet-300 font-mono">{p.time}</span>}
                        <span className="text-base font-semibold">{p.name}</span>
                        {p.category && <span className="text-xs text-zinc-400">· {p.category}</span>}
                        {p.rating && <span className="text-xs text-amber-300">{"★".repeat(p.rating)}</span>}
                      </div>
                      {p.note && <div className="text-sm text-zinc-300 mt-1">{p.note}</div>}
                    </div>
                    {isAdmin && (
                      <button onClick={() => removePlace(p.id)} className="text-xs text-rose-300 hover:text-rose-200 p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 추가 폼 */}
            {isAdmin && (
              <div className="mt-3">
                {!isAddingThis ? (
                  <button onClick={() => setAdding(date)}
                    className="w-full text-sm text-zinc-300 hover:text-zinc-100 py-2 border border-dashed border-zinc-700 hover:border-violet-500/50 rounded-lg flex items-center justify-center gap-1.5">
                    <Plus size={14} /> 장소 추가
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-zinc-900/50 border border-violet-500/40 rounded-xl space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} />
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputCls} col-span-2`}>
                        {PLACE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="장소명 (예: 에펠탑)" className={`${inputCls} w-full`} autoFocus />
                    <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="메모 (선택)" className={`${inputCls} w-full`} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-400">평점</span>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setForm({ ...form, rating: form.rating === n ? 0 : n })}
                            className={`text-lg ${form.rating >= n ? "text-amber-300" : "text-zinc-600"}`}>★</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setAdding(null); setForm({ time: "", name: "", category: "명소", rating: 0, note: "" }); }}
                          className="px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-100">취소</button>
                        <button onClick={() => addPlace(date)}
                          className="px-4 py-1.5 bg-violet-500 text-zinc-50 rounded-lg text-sm font-semibold hover:bg-violet-400">저장</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 지출 탭
// ============================================================================
function ExpensesTab({ tripId, expenses, totalExpense, isAdmin, refresh }: {
  tripId: string; expenses: TripExpense[]; totalExpense: number; isAdmin: boolean; refresh: () => void;
}) {
  const [form, setForm] = useState({ date: "", category: "식사", item: "", amount: "", note: "" });

  const add = async () => {
    if (!form.item.trim()) return;
    await supabase.from("trip_expenses").insert({
      trip_id: tripId,
      date: form.date || null,
      category: form.category,
      item: form.item.trim(),
      amount: Number(form.amount) || 0,
      note: form.note.trim() || null,
    });
    setForm({ date: "", category: "식사", item: "", amount: "", note: "" });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("trip_expenses").delete().eq("id", id);
    refresh();
  };

  // 카테고리별 합계
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    name: c,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter((x) => x.value > 0);

  return (
    <div className="space-y-5">
      {/* 합계 + 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
          <div className="text-sm text-zinc-400">총 지출</div>
          <div className="text-4xl font-bold tabular-nums text-rose-300 mt-2">₩{fmt(totalExpense)}</div>
          <div className="text-sm text-zinc-400 mt-2">{expenses.length}건</div>
        </div>
        {byCategory.length > 0 && (
          <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
            <div className="text-sm font-semibold mb-3">카테고리별</div>
            <div className="grid grid-cols-2 gap-3">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30} paddingAngle={2}>
                    {byCategory.map((d) => <Cell key={d.name} fill={EXPENSE_COLOR[d.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => `₩${fmt(Number(v))}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 text-xs">
                {byCategory.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: EXPENSE_COLOR[d.name] }} />
                      <span className="text-zinc-300">{d.name}</span>
                    </div>
                    <span className="tabular-nums text-zinc-400">₩{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdmin && (
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5 space-y-3">
          <div className="text-sm font-semibold">지출 추가</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="항목 (예: 점심)" className={inputCls} />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액(원)" className={inputCls} />
          </div>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="메모 (선택)" className={`${inputCls} w-full`} />
          <button onClick={add} className="w-full bg-rose-500 text-zinc-50 rounded-lg py-2 text-sm font-semibold hover:bg-rose-400">추가</button>
        </div>
      )}

      {/* 목록 */}
      {expenses.length === 0 ? (
        <div className="text-sm text-zinc-400 py-10 text-center border border-dashed border-zinc-700 rounded-2xl">지출 기록이 없습니다</div>
      ) : (
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3">날짜</th>
                <th className="text-left px-4 py-3">카테고리</th>
                <th className="text-left px-4 py-3">항목</th>
                <th className="text-right px-4 py-3">금액</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-zinc-700/60">
                  <td className="px-4 py-3 text-zinc-300 tabular-nums">{e.date || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: `${EXPENSE_COLOR[e.category || "기타"]}66`, color: EXPENSE_COLOR[e.category || "기타"] }}>
                      {e.category || "기타"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{e.item}{e.note && <div className="text-xs text-zinc-400 mt-0.5">{e.note}</div>}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-300">₩{fmt(e.amount)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(e.id)} className="text-xs text-rose-300 hover:text-rose-200">삭제</button>
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

// ============================================================================
// 후기 탭 (일자별 한줄 후기)
// ============================================================================
function ReviewsTab({ tripId, dateRange, days, isAdmin, refresh }: {
  tripId: string; dateRange: string[]; days: TripDay[]; isAdmin: boolean; refresh: () => void;
}) {
  if (dateRange.length === 0) {
    return <div className="text-sm text-zinc-400 py-10 text-center border border-dashed border-zinc-700 rounded-2xl">
      여행 시작일/종료일을 먼저 설정하세요
    </div>;
  }

  return (
    <div className="space-y-4">
      {dateRange.map((date, idx) => {
        const day = days.find((d) => d.date === date);
        return (
          <ReviewCard key={date} tripId={tripId} date={date} dayIndex={idx + 1} day={day} isAdmin={isAdmin} refresh={refresh} />
        );
      })}
    </div>
  );
}

function ReviewCard({ tripId, date, dayIndex, day, isAdmin, refresh }: {
  tripId: string; date: string; dayIndex: number; day: TripDay | undefined; isAdmin: boolean; refresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    one_liner: day?.one_liner || "",
    mood: day?.mood || "보통",
    note: day?.note || "",
  });

  useEffect(() => {
    setForm({
      one_liner: day?.one_liner || "",
      mood: day?.mood || "보통",
      note: day?.note || "",
    });
  }, [day]);

  const save = async () => {
    await supabase.from("trip_days").upsert({
      trip_id: tripId,
      date,
      one_liner: form.one_liner.trim() || null,
      mood: form.mood,
      note: form.note.trim() || null,
    }, { onConflict: "trip_id,date" });
    setEditing(false);
    refresh();
  };

  return (
    <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-xs text-zinc-400">Day {dayIndex}</div>
          <div className="text-base font-semibold">{date}</div>
        </div>
        <div className="text-2xl">{MOOD_EMOJI[day?.mood || "보통"]}</div>
      </div>

      {!editing ? (
        <>
          {day?.one_liner ? (
            <blockquote className="text-lg text-zinc-100 leading-relaxed italic">"{day.one_liner}"</blockquote>
          ) : (
            <div className="text-sm text-zinc-500 italic">— 한줄 후기 없음 —</div>
          )}
          {day?.note && <div className="text-sm text-zinc-300 mt-3 leading-relaxed whitespace-pre-wrap">{day.note}</div>}
          {isAdmin && (
            <button onClick={() => setEditing(true)}
              className="mt-4 text-xs text-violet-300 hover:text-violet-200">
              {day ? "수정" : "+ 작성"}
            </button>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <input value={form.one_liner} onChange={(e) => setForm({ ...form, one_liner: e.target.value })}
            placeholder="한줄 후기" className={`${inputCls} w-full`} />
          <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="자세한 메모 (선택)" className={`${inputCls} w-full`} />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button key={m} onClick={() => setForm({ ...form, mood: m })}
                  className={`px-2.5 py-1 text-sm rounded-md border ${form.mood === m ? "bg-violet-500/30 text-violet-100 border-violet-400/60" : "bg-zinc-900 text-zinc-400 border-zinc-700"}`}>
                  {MOOD_EMOJI[m]} {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-100">취소</button>
              <button onClick={save} className="px-4 py-1.5 bg-violet-500 text-zinc-50 rounded-lg text-sm font-semibold hover:bg-violet-400">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 요약 탭
// ============================================================================
function SummaryTab({ trip, days, places, expenses, dateRange }: {
  trip: Trip; days: TripDay[]; places: TripPlace[]; expenses: TripExpense[]; dateRange: string[];
}) {
  const placesByCategory = PLACE_CATEGORIES.map((c) => ({
    name: c,
    count: places.filter((p) => p.category === c).length,
  })).filter((x) => x.count > 0);

  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const avgDaily = dateRange.length > 0 ? totalExpense / dateRange.length : 0;
  const bestRated = [...places].filter((p) => p.rating && p.rating >= 4).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const moodCount = MOODS.map((m) => ({ mood: m, count: days.filter((d) => d.mood === m).length }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="총 일수" value={`${dateRange.length}일`} color="violet" />
        <MiniStat label="장소" value={`${places.length}곳`} color="cyan" />
        <MiniStat label="기록한 후기" value={`${days.length}일`} color="emerald" />
        <MiniStat label="일 평균 지출" value={`₩${fmt(avgDaily)}`} color="rose" />
      </div>

      {placesByCategory.length > 0 && (
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
          <div className="text-sm font-semibold mb-3">카테고리별 방문</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {placesByCategory.map((c) => (
              <div key={c.name} className="p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg text-center">
                <div className="text-2xl">{PLACE_EMOJI[c.name]}</div>
                <div className="text-sm text-zinc-300 mt-1">{c.name}</div>
                <div className="text-xl font-bold text-zinc-100 tabular-nums">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bestRated.length > 0 && (
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
          <div className="text-sm font-semibold mb-3">⭐ 베스트 장소 (평점 4점 이상)</div>
          <div className="space-y-2">
            {bestRated.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-700">
                <div className="text-2xl">{PLACE_EMOJI[p.category || "기타"]}</div>
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-400">{p.date} · {p.category}</div>
                </div>
                <div className="text-amber-300 text-sm">{"★".repeat(p.rating || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-5">
        <div className="text-sm font-semibold mb-3">하루 컨디션 분포</div>
        <div className="grid grid-cols-5 gap-2">
          {moodCount.map((m) => (
            <div key={m.mood} className="p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg text-center">
              <div className="text-2xl">{MOOD_EMOJI[m.mood]}</div>
              <div className="text-xs text-zinc-400 mt-1">{m.mood}</div>
              <div className="text-lg font-bold text-zinc-100">{m.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UI helpers
// ============================================================================
function MiniStat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-300 border-violet-500/30",
    cyan: "text-cyan-300 border-cyan-500/30",
    rose: "text-rose-300 border-rose-500/30",
    emerald: "text-emerald-300 border-emerald-500/30",
  };
  return (
    <div className={`p-4 rounded-xl bg-zinc-800/60 border ${colorMap[color]}`}>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Trip["status"] }) {
  const cfg = {
    planned: { label: "예정", cls: "bg-violet-500/20 text-violet-200 border-violet-500/40" },
    done: { label: "다녀옴", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40" },
    cancelled: { label: "취소", cls: "bg-zinc-700 text-zinc-400 border-zinc-600" },
  }[status];
  return <span className={`text-xs px-2.5 py-1 rounded-md border ${cfg.cls}`}>{cfg.label}</span>;
}

const inputCls = "bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50";
