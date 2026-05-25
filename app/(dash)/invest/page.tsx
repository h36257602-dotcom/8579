// @ts-nocheck
"use client";
// ============================================================================
// Wealth Insight — 투자 대시보드 (Supabase 연동)
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";
import {
  LayoutDashboard, Briefcase, Star, LineChart as LineIcon,
  History, NotebookPen, ShieldAlert, Target, Search,
  TrendingUp, TrendingDown, Plus, Trash2, Edit3, X,
  AlertTriangle, CheckCircle2, Activity, Wallet, PieChart as PieIcon,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";

// ============================================================================
// 유틸
// ============================================================================
const fmt = (n) => new Intl.NumberFormat("ko-KR").format(Math.round(n || 0));
const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;
const colorByPL = (n) => n > 0 ? "text-rose-400" : n < 0 ? "text-sky-400" : "text-zinc-400";
const bgByPL = (n) => n > 0 ? "bg-rose-500/10 border-rose-500/30" : n < 0 ? "bg-sky-500/10 border-sky-500/30" : "bg-zinc-500/10 border-zinc-500/30";

// ============================================================================
// UI 공통
// ============================================================================
const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-800/60 backdrop-blur border border-zinc-700 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.35)] ${className}`}>{children}</div>
);

const Stat = ({ label, value, sub, accent, icon: Icon }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs text-zinc-400 uppercase tracking-[0.15em] font-medium">{label}</div>
        <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent || "text-zinc-100"}`}>{value}</div>
        {sub && <div className={`mt-1 text-xs ${accent || "text-zinc-400"}`}>{sub}</div>}
      </div>
      {Icon && <div className="p-2 rounded-lg bg-zinc-700/60 text-zinc-300"><Icon size={18} /></div>}
    </div>
  </Card>
);

const Badge = ({ children, tone = "zinc" }) => {
  const tones = {
    zinc:    "bg-zinc-700 text-zinc-200 border-zinc-600",
    rose:    "bg-rose-500/20 text-rose-200 border-rose-500/40",
    sky:     "bg-sky-500/20 text-sky-200 border-sky-500/40",
    amber:   "bg-amber-500/20 text-amber-200 border-amber-500/40",
    emerald: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    violet:  "bg-violet-500/20 text-violet-200 border-violet-500/40",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${tones[tone]}`}>{children}</span>;
};

const Input = (props) => (
  <input {...props} className={`w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition ${props.className || ""}`} />
);

const Select = ({ children, ...props }) => (
  <select {...props} className={`w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition ${props.className || ""}`}>
    {children}
  </select>
);

const TextArea = (props) => (
  <textarea {...props} className={`w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition ${props.className || ""}`} />
);

const Btn = ({ children, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
    ghost:   "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800 border border-zinc-700",
    danger:  "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/40",
  };
  return (
    <button {...props} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${variants[variant]} ${props.className || ""}`}>
      {children}
    </button>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// 메인
// ============================================================================
export default function WealthInsight() {
  const isAdmin = useAdmin();

  const [holdings, setHoldings]   = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [trades, setTrades]       = useState([]);
  const [memos, setMemos]         = useState([]);
  const [goals, setGoals]         = useState([]);
  const [analysis, setAnalysis]   = useState({});  // code -> row

  const [page, setPage]           = useState("dashboard");
  const [loading, setLoading]     = useState(true);

  const refresh = async () => {
    const [h, w, t, m, g, a] = await Promise.all([
      supabase.from("inv_holdings").select("*").order("created_at"),
      supabase.from("inv_watchlist").select("*").order("created_at"),
      supabase.from("inv_trades").select("*").order("date", { ascending: false }),
      supabase.from("inv_memos").select("*").order("date", { ascending: false }),
      supabase.from("inv_goals").select("*").order("created_at"),
      supabase.from("inv_analysis").select("*"),
    ]);
    setHoldings(h.data || []);
    setWatchlist(w.data || []);
    setTrades(t.data || []);
    setMemos(m.data || []);
    setGoals(g.data || []);
    const aMap = {};
    (a.data || []).forEach(row => { aMap[row.code] = row; });
    setAnalysis(aMap);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // 파생 데이터: 보유 종목 평가/손익
  const enrichedHoldings = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + h.current_price * h.quantity, 0);
    return holdings.map(h => {
      const totalBuy = h.buy_price * h.quantity;
      const value    = h.current_price * h.quantity;
      const pl       = value - totalBuy;
      const plPct    = totalBuy ? (pl / totalBuy) * 100 : 0;
      const weight   = totalValue ? (value / totalValue) * 100 : 0;
      return { ...h, totalBuy, value, pl, plPct, weight };
    });
  }, [holdings]);

  const summary = useMemo(() => {
    const totalBuy   = enrichedHoldings.reduce((s, h) => s + h.totalBuy, 0);
    const totalValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
    const totalPL    = totalValue - totalBuy;
    const totalPct   = totalBuy ? (totalPL / totalBuy) * 100 : 0;
    return { totalBuy, totalValue, totalPL, totalPct, count: enrichedHoldings.length, watchCount: watchlist.length };
  }, [enrichedHoldings, watchlist]);

  const menu = [
    { id: "dashboard", label: "대시보드",   icon: LayoutDashboard },
    { id: "holdings",  label: "보유종목",   icon: Briefcase },
    { id: "watchlist", label: "관심종목",   icon: Star },
    { id: "analysis",  label: "종목분석",   icon: LineIcon },
    { id: "trades",    label: "투자기록",   icon: History },
    { id: "memos",     label: "투자메모",   icon: NotebookPen },
    { id: "risk",      label: "리스크관리", icon: ShieldAlert },
    { id: "goals",     label: "투자목표",   icon: Target },
    { id: "search",    label: "검색/필터",  icon: Search },
  ];

  if (loading) return <div className="text-zinc-400 text-sm py-20 text-center">투자 데이터 불러오는 중…</div>;

  return (
    <div className="space-y-5 -mx-4 md:-mx-8 -my-6 md:-my-8">
      {/* 상단 요약바 */}
      <div className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Portfolio Overview</div>
            <div className="text-base md:text-lg font-semibold tracking-tight mt-0.5">
              총 평가금액 <span className="text-zinc-100 tabular-nums">₩{fmt(summary.totalValue)}</span>
              <span className={`ml-2 md:ml-3 text-sm tabular-nums ${colorByPL(summary.totalPL)}`}>
                {summary.totalPL >= 0 ? "▲" : "▼"} {fmt(Math.abs(summary.totalPL))} ({fmtPct(summary.totalPct)})
              </span>
            </div>
          </div>
          {!isAdmin && <Badge tone="zinc">읽기 전용 · 로그인 시 편집</Badge>}
        </div>

        {/* 가로 탭 */}
        <nav className="px-4 md:px-8 flex gap-1 overflow-x-auto border-t border-zinc-800/60">
          {menu.map(m => {
            const Icon = m.icon;
            const active = page === m.id;
            return (
              <button key={m.id} onClick={() => setPage(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 -mb-px transition ${
                  active ? "border-zinc-100 text-zinc-100 font-semibold" : "border-transparent text-zinc-400 hover:text-zinc-100"
                }`}>
                <Icon size={13} />
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 페이지 라우팅 */}
      <div className="px-4 md:px-8 py-6">
        {page === "dashboard" && <DashboardPage holdings={enrichedHoldings} summary={summary} memos={memos} trades={trades} />}
        {page === "holdings"  && <HoldingsPage  holdings={enrichedHoldings} isAdmin={isAdmin} refresh={refresh} />}
        {page === "watchlist" && <WatchlistPage watchlist={watchlist} isAdmin={isAdmin} refresh={refresh} />}
        {page === "analysis"  && <AnalysisPage  holdings={enrichedHoldings} analysis={analysis} isAdmin={isAdmin} refresh={refresh} />}
        {page === "trades"    && <TradesPage    trades={trades} isAdmin={isAdmin} refresh={refresh} />}
        {page === "memos"     && <MemosPage     memos={memos} isAdmin={isAdmin} refresh={refresh} />}
        {page === "risk"      && <RiskPage      holdings={enrichedHoldings} summary={summary} />}
        {page === "goals"     && <GoalsPage     goals={goals} isAdmin={isAdmin} refresh={refresh} />}
        {page === "search"    && <SearchPage    holdings={enrichedHoldings} watchlist={watchlist} />}
      </div>

      <footer className="px-4 md:px-8 py-6 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
          본 페이지는 개인 투자 기록 및 분석 도구이며, 특정 종목의 매수·매도 추천이 아닙니다.
        </p>
      </footer>
    </div>
  );
}

// ============================================================================
// 대시보드
// ============================================================================
function DashboardPage({ holdings, summary, memos, trades }) {
  const topGain   = [...holdings].sort((a, b) => b.pl - a.pl).slice(0, 5);
  const topWeight = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const risky     = holdings.filter(h => h.plPct < -10);

  const PIE_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
  const pieData = holdings.map(h => ({ name: h.name, value: h.value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="총 투자금" value={`₩${fmt(summary.totalBuy)}`} icon={Wallet} />
        <Stat label="총 평가금액" value={`₩${fmt(summary.totalValue)}`} icon={Briefcase} />
        <Stat label="총 손익" value={`${summary.totalPL >= 0 ? "+" : "-"}₩${fmt(Math.abs(summary.totalPL))}`} accent={colorByPL(summary.totalPL)} icon={summary.totalPL >= 0 ? TrendingUp : TrendingDown} />
        <Stat label="총 수익률" value={fmtPct(summary.totalPct)} accent={colorByPL(summary.totalPL)} icon={Activity} />
      </div>

      {pieData.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">투자 비중</div>
            <PieIcon size={16} className="text-zinc-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => `₩${fmt(v)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {topWeight.map((h, i) => (
                <div key={h.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-zinc-200">{h.name}</span>
                  </div>
                  <span className="text-zinc-400 tabular-nums">{fmtPct(h.weight)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {holdings.length === 0 && (
        <Card className="p-10 text-center">
          <Briefcase size={32} className="mx-auto text-zinc-500 mb-3" />
          <div className="text-sm text-zinc-300">아직 보유 종목이 없습니다</div>
          <div className="text-xs text-zinc-500 mt-1">상단 "보유종목" 탭에서 추가하세요</div>
        </Card>
      )}

      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-rose-400" /> 손익 상위
            </div>
            <div className="space-y-2">
              {topGain.map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-zinc-700/50 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-[11px] text-zinc-500">{h.code}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold tabular-nums ${colorByPL(h.pl)}`}>
                      {h.pl >= 0 ? "+" : "-"}₩{fmt(Math.abs(h.pl))}
                    </div>
                    <div className={`text-[11px] tabular-nums ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <PieIcon size={15} className="text-amber-400" /> 비중 상위
            </div>
            <div className="space-y-2">
              {topWeight.map(h => (
                <div key={h.id} className="py-1.5 border-b border-zinc-700/50 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{h.name}</div>
                    <span className="text-sm text-zinc-300 tabular-nums">{fmtPct(h.weight)}</span>
                  </div>
                  <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${h.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> 위험 종목
            </div>
            {risky.length === 0 ? (
              <div className="text-xs text-zinc-400 py-6 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/60" />
                위험 종목 없음
              </div>
            ) : (
              <div className="space-y-2">
                {risky.map(h => (
                  <div key={h.id} className={`p-2.5 rounded-lg border ${bgByPL(h.pl)}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{h.name}</div>
                      <Badge tone="sky">손실 -10% 초과</Badge>
                    </div>
                    <div className={`text-sm tabular-nums mt-1 ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {memos.length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <NotebookPen size={15} className="text-violet-400" /> 최근 투자 메모
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {memos.slice(0, 3).map(m => (
              <div key={m.id} className="p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-medium">{m.title}</div>
                  <Badge tone={m.priority === "상" ? "rose" : m.priority === "중" ? "amber" : "zinc"}>{m.priority}</Badge>
                </div>
                <div className="text-[11px] text-zinc-500 mb-1">{m.date} · {m.type}</div>
                <div className="text-xs text-zinc-300 line-clamp-2">{m.content}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 보유종목
// ============================================================================
function HoldingsPage({ holdings, isAdmin, refresh }) {
  const [modal, setModal] = useState(null);
  const empty = { code: "", name: "", market: "코스피", buy_date: new Date().toISOString().slice(0, 10), buy_price: 0, quantity: 0, current_price: 0, status: "보유", memo: "" };
  const [form, setForm] = useState(empty);

  const open  = (h) => { setForm(h ? { ...h } : empty); setModal(h ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };

  const save = async () => {
    if (!form.name || !form.code) { alert("종목명/코드를 입력하세요"); return; }
    const item = { ...form, buy_price: +form.buy_price, quantity: +form.quantity, current_price: +form.current_price };
    if (modal === "new") {
      delete item.id;
      await supabase.from("inv_holdings").insert(item);
    } else {
      const { id, created_at, ...rest } = item;
      await supabase.from("inv_holdings").update(rest).eq("id", id);
    }
    close();
    refresh();
  };

  const del = async (id) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("inv_holdings").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">보유 종목</h2>
          <p className="text-xs text-zinc-400 mt-1">총 {holdings.length}개 · ₩{fmt(holdings.reduce((s, h) => s + h.value, 0))}</p>
        </div>
        {isAdmin && <Btn onClick={() => open(null)}><Plus size={14} /> 종목 추가</Btn>}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3">종목</th>
              <th className="text-left px-4 py-3">시장</th>
              <th className="text-right px-4 py-3">매수가</th>
              <th className="text-right px-4 py-3">수량</th>
              <th className="text-right px-4 py-3">현재가</th>
              <th className="text-right px-4 py-3">매수금액</th>
              <th className="text-right px-4 py-3">평가금액</th>
              <th className="text-right px-4 py-3">손익</th>
              <th className="text-right px-4 py-3">수익률</th>
              <th className="text-right px-4 py-3">비중</th>
              <th className="text-center px-4 py-3">상태</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr><td colSpan={12} className="text-center text-xs text-zinc-500 py-10">보유 종목이 없습니다</td></tr>
            ) : holdings.map(h => (
              <tr key={h.id} className="border-t border-zinc-700/60 hover:bg-zinc-900/30 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-100">{h.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{h.code} · {h.buy_date}</div>
                </td>
                <td className="px-4 py-3"><Badge tone="zinc">{h.market}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{fmt(h.buy_price)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{fmt(h.quantity)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-100 font-medium">{fmt(h.current_price)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{fmt(h.totalBuy)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-100 font-medium">{fmt(h.value)}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${colorByPL(h.pl)}`}>
                  {h.pl >= 0 ? "+" : "-"}{fmt(Math.abs(h.pl))}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{fmtPct(h.weight)}</td>
                <td className="px-4 py-3 text-center"><Badge tone={h.status === "보유" ? "emerald" : h.status === "일부매도" ? "amber" : "zinc"}>{h.status}</Badge></td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => open(h)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300"><Edit3 size={13} /></button>
                    <button onClick={() => del(h.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400 ml-1"><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "종목 추가" : "종목 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">종목코드</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">종목명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">시장구분</label>
            <Select value={form.market} onChange={e => setForm({ ...form, market: e.target.value })}>
              <option>코스피</option><option>코스닥</option><option>ETF</option><option>해외주식</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">매수일</label><Input type="date" value={form.buy_date || ""} onChange={e => setForm({ ...form, buy_date: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">매수단가</label><Input type="number" value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">보유수량</label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재가</label><Input type="number" value={form.current_price} onChange={e => setForm({ ...form, current_price: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">투자상태</label>
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>보유</option><option>일부매도</option><option>전량매도</option>
            </Select>
          </div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">투자메모</label><TextArea rows={3} value={form.memo || ""} onChange={e => setForm({ ...form, memo: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="ghost" onClick={close}>취소</Btn>
          <Btn onClick={save}>저장</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 관심종목
// ============================================================================
function WatchlistPage({ watchlist, isAdmin, refresh }) {
  const [modal, setModal] = useState(null);
  const empty = { code: "", name: "", current_price: 0, target_buy: 0, target_sell: 0, reason: "", checkpoint: "", grade: "관심", reg_date: new Date().toISOString().slice(0, 10), memo: "" };
  const [form, setForm] = useState(empty);

  const open  = (w) => { setForm(w ? { ...w } : empty); setModal(w ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save  = async () => {
    if (!form.name) { alert("종목명을 입력하세요"); return; }
    const item = { ...form, current_price: +form.current_price, target_buy: +form.target_buy, target_sell: +form.target_sell };
    if (modal === "new") {
      delete item.id;
      await supabase.from("inv_watchlist").insert(item);
    } else {
      const { id, created_at, ...rest } = item;
      await supabase.from("inv_watchlist").update(rest).eq("id", id);
    }
    close();
    refresh();
  };
  const del = async (id) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("inv_watchlist").delete().eq("id", id);
    refresh();
  };

  const signal = (w) => {
    if (w.target_buy && w.current_price <= w.target_buy) return { tone: "rose", label: "매수 검토" };
    if (w.target_sell && w.current_price >= w.target_sell) return { tone: "sky", label: "매도 검토" };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">관심 종목</h2>
          <p className="text-xs text-zinc-400 mt-1">총 {watchlist.length}개</p>
        </div>
        {isAdmin && <Btn onClick={() => open(null)}><Plus size={14} /> 관심 추가</Btn>}
      </div>

      {watchlist.length === 0 ? (
        <Card className="p-10 text-center text-sm text-zinc-400">관심 종목이 없습니다</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map(w => {
            const sig = signal(w);
            return (
              <Card key={w.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{w.name}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">{w.code}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Badge tone={w.grade === "매수검토" ? "rose" : w.grade === "관찰" ? "amber" : w.grade === "보류" ? "sky" : "zinc"}>{w.grade}</Badge>
                      {sig && <Badge tone={sig.tone}>● {sig.label}</Badge>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex">
                      <button onClick={() => open(w)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300"><Edit3 size={13} /></button>
                      <button onClick={() => del(w.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-400">현재가</span><span className="tabular-nums font-medium">₩{fmt(w.current_price)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">목표 매수가</span><span className="tabular-nums text-rose-300">₩{fmt(w.target_buy)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">목표 매도가</span><span className="tabular-nums text-sky-300">₩{fmt(w.target_sell)}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-700 text-xs space-y-1">
                  {w.reason && <div><span className="text-zinc-500">관심사유:</span> <span className="text-zinc-300">{w.reason}</span></div>}
                  {w.checkpoint && <div><span className="text-zinc-500">체크포인트:</span> <span className="text-zinc-300">{w.checkpoint}</span></div>}
                  {w.memo && <div className="text-zinc-500 italic mt-2">{w.memo}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "관심 종목 추가" : "관심 종목 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">종목코드</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">종목명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재가</label><Input type="number" value={form.current_price} onChange={e => setForm({ ...form, current_price: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">투자등급</label>
            <Select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              <option>관심</option><option>관찰</option><option>매수검토</option><option>보류</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">목표매수가</label><Input type="number" value={form.target_buy} onChange={e => setForm({ ...form, target_buy: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">목표매도가</label><Input type="number" value={form.target_sell} onChange={e => setForm({ ...form, target_sell: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">관심사유</label><Input value={form.reason || ""} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">체크포인트</label><Input value={form.checkpoint || ""} onChange={e => setForm({ ...form, checkpoint: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">메모</label><TextArea rows={2} value={form.memo || ""} onChange={e => setForm({ ...form, memo: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="ghost" onClick={close}>취소</Btn>
          <Btn onClick={save}>저장</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 종목분석
// ============================================================================
function AnalysisPage({ holdings, analysis, isAdmin, refresh }) {
  const [selected, setSelected] = useState(holdings[0]?.code);
  useEffect(() => {
    if (!selected && holdings.length > 0) setSelected(holdings[0].code);
  }, [holdings]);

  const cur = holdings.find(h => h.code === selected);
  const empty = { code: selected, growth: 3, profit: 3, stability: 3, valuation: 3, dividend: 3, per: 0, pbr: 0, roe: 0, debt: 0, revenue_growth: 0, op_growth: 0, dividend_yield: 0, issue: "", risk: "", judgment: "" };
  const a = analysis[selected] || empty;

  const total = (a.growth || 0) + (a.profit || 0) + (a.stability || 0) + (a.valuation || 0) + (a.dividend || 0);
  const judge = total >= 21 ? { label: "적극 검토", tone: "rose" } : total >= 16 ? { label: "보유 또는 관찰", tone: "amber" } : total >= 11 ? { label: "신중 검토", tone: "sky" } : { label: "투자 보류", tone: "zinc" };

  const updateField = async (field, val) => {
    if (!isAdmin) return;
    const existing = analysis[selected];
    const payload = { ...empty, ...existing, [field]: val, code: selected, updated_at: new Date().toISOString() };
    delete payload.id;
    await supabase.from("inv_analysis").upsert(payload, { onConflict: "code" });
    refresh();
  };

  const scoreItems = [
    { key: "growth",    label: "성장성" },
    { key: "profit",    label: "수익성" },
    { key: "stability", label: "안정성" },
    { key: "valuation", label: "저평가" },
    { key: "dividend",  label: "배당매력" },
  ];

  if (holdings.length === 0) {
    return <Card className="p-10 text-center text-sm text-zinc-400">분석할 보유 종목이 없습니다</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold tracking-tight">종목 분석</h2>
        <Select value={selected || ""} onChange={e => setSelected(e.target.value)} className="w-48">
          {holdings.map(h => <option key={h.id} value={h.code}>{h.name}</option>)}
        </Select>
      </div>

      {cur && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
              <div className="text-sm font-semibold mb-4">기본 정보</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><div className="text-[11px] text-zinc-500 uppercase">종목명</div><div className="text-sm font-medium mt-1">{cur.name}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">시장</div><div className="text-sm font-medium mt-1">{cur.market}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">평균단가</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.buy_price)}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">현재가</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.current_price)}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">평가금액</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.value)}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">손익</div><div className={`text-sm font-semibold mt-1 tabular-nums ${colorByPL(cur.pl)}`}>{cur.pl >= 0 ? "+" : "-"}₩{fmt(Math.abs(cur.pl))}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">수익률</div><div className={`text-sm font-semibold mt-1 tabular-nums ${colorByPL(cur.pl)}`}>{fmtPct(cur.plPct)}</div></div>
                <div><div className="text-[11px] text-zinc-500 uppercase">비중</div><div className="text-sm font-medium mt-1 tabular-nums">{fmtPct(cur.weight)}</div></div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">종합 점수</div>
              <div className="text-center py-3">
                <div className={`text-5xl font-bold tabular-nums ${judge.tone === "rose" ? "text-rose-400" : judge.tone === "amber" ? "text-amber-400" : judge.tone === "sky" ? "text-sky-400" : "text-zinc-400"}`}>
                  {total}<span className="text-lg text-zinc-500">/25</span>
                </div>
                <div className="mt-3"><Badge tone={judge.tone}>{judge.label}</Badge></div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="text-sm font-semibold mb-4">재무 지표</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "PER", val: a.per, field: "per", suffix: "" },
                { label: "PBR", val: a.pbr, field: "pbr", suffix: "" },
                { label: "ROE", val: a.roe, field: "roe", suffix: "%" },
                { label: "부채비율", val: a.debt, field: "debt", suffix: "%" },
                { label: "매출성장", val: a.revenue_growth, field: "revenue_growth", suffix: "%" },
                { label: "영업익성장", val: a.op_growth, field: "op_growth", suffix: "%" },
                { label: "배당률", val: a.dividend_yield, field: "dividend_yield", suffix: "%" },
              ].map(item => (
                <div key={item.field} className="p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg">
                  <div className="text-[11px] text-zinc-500 uppercase">{item.label}</div>
                  <input type="number" value={item.val ?? 0} disabled={!isAdmin}
                    onBlur={(e) => updateField(item.field, +e.target.value)}
                    onChange={(e) => { /* local; commits on blur */ }}
                    className="w-full bg-transparent text-zinc-100 text-base font-semibold tabular-nums mt-1 focus:outline-none" />
                  <div className="text-[11px] text-zinc-500">{item.suffix}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold mb-4">5점 평가</div>
            <div className="space-y-3">
              {scoreItems.map(item => (
                <div key={item.key} className="flex items-center gap-4 flex-wrap">
                  <div className="w-20 text-sm text-zinc-300">{item.label}</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} disabled={!isAdmin}
                        onClick={() => updateField(item.key, n)}
                        className={`w-9 h-9 rounded-md text-sm font-semibold transition ${
                          (a[item.key] || 0) >= n ? "bg-gradient-to-br from-rose-500 to-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                        } ${!isAdmin && "cursor-not-allowed"}`}>{n}</button>
                    ))}
                  </div>
                  <div className="text-sm text-zinc-400 ml-auto tabular-nums">{a[item.key] || 0}/5</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">최근 이슈</div>
              <TextArea rows={4} value={a.issue || ""} disabled={!isAdmin}
                onBlur={(e) => updateField("issue", e.target.value)}
                onChange={(e) => {}} placeholder="이슈를 기록하세요" />
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">투자 리스크</div>
              <TextArea rows={4} value={a.risk || ""} disabled={!isAdmin}
                onBlur={(e) => updateField("risk", e.target.value)}
                onChange={(e) => {}} placeholder="리스크를 기록하세요" />
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">투자 판단</div>
              <TextArea rows={4} value={a.judgment || ""} disabled={!isAdmin}
                onBlur={(e) => updateField("judgment", e.target.value)}
                onChange={(e) => {}} placeholder="매수/보유/매도 판단" />
            </Card>
          </div>
          {!isAdmin && <div className="text-xs text-zinc-500 text-center">수정하려면 로그인</div>}
        </>
      )}
    </div>
  );
}

// ============================================================================
// 투자기록
// ============================================================================
function TradesPage({ trades, isAdmin, refresh }) {
  const [modal, setModal] = useState(null);
  const empty = { date: new Date().toISOString().slice(0, 10), name: "", type: "매수", price: 0, quantity: 0, amount: 0, reason: "", feedback: "", learning: "" };
  const [form, setForm] = useState(empty);

  const open  = (t) => { setForm(t ? { ...t } : empty); setModal(t ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save  = async () => {
    const amount = +form.price * +form.quantity;
    const item = { ...form, price: +form.price, quantity: +form.quantity, amount };
    if (modal === "new") {
      delete item.id;
      await supabase.from("inv_trades").insert(item);
    } else {
      const { id, created_at, ...rest } = item;
      await supabase.from("inv_trades").update(rest).eq("id", id);
    }
    close(); refresh();
  };
  const del = async (id) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("inv_trades").delete().eq("id", id);
    refresh();
  };

  const typeTone = { 매수: "rose", 추가매수: "rose", 매도: "sky", 익절: "emerald", 손절: "zinc" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">투자 기록</h2>
          <p className="text-xs text-zinc-400 mt-1">총 {trades.length}건</p>
        </div>
        {isAdmin && <Btn onClick={() => open(null)}><Plus size={14} /> 거래 추가</Btn>}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3">거래일</th>
              <th className="text-left px-4 py-3">종목</th>
              <th className="text-center px-4 py-3">구분</th>
              <th className="text-right px-4 py-3">단가</th>
              <th className="text-right px-4 py-3">수량</th>
              <th className="text-right px-4 py-3">거래금액</th>
              <th className="text-left px-4 py-3">거래사유</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-xs text-zinc-500 py-10">거래 기록이 없습니다</td></tr>
            ) : trades.map(t => (
              <tr key={t.id} className="border-t border-zinc-700/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-200 tabular-nums">{t.date}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-center"><Badge tone={typeTone[t.type] || "zinc"}>{t.type}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(t.price)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(t.quantity)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(t.amount)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{t.reason}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => open(t)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300"><Edit3 size={13} /></button>
                    <button onClick={() => del(t.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "거래 추가" : "거래 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">거래일</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">종목명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">거래구분</label>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>매수</option><option>추가매수</option><option>매도</option><option>익절</option><option>손절</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">거래단가</label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">거래수량</label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">거래사유</label><Input value={form.reason || ""} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">거래 후 느낀 점</label><TextArea rows={2} value={form.feedback || ""} onChange={e => setForm({ ...form, feedback: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">다음 투자에 반영</label><TextArea rows={2} value={form.learning || ""} onChange={e => setForm({ ...form, learning: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="ghost" onClick={close}>취소</Btn>
          <Btn onClick={save}>저장</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 투자메모
// ============================================================================
function MemosPage({ memos, isAdmin, refresh }) {
  const [modal, setModal] = useState(null);
  const empty = { date: new Date().toISOString().slice(0, 10), title: "", content: "", related: "", type: "아이디어", priority: "중" };
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("전체");

  const open  = (m) => { setForm(m ? { ...m } : empty); setModal(m ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save  = async () => {
    if (!form.title) { alert("제목을 입력하세요"); return; }
    if (modal === "new") {
      const { id, created_at, ...rest } = form;
      await supabase.from("inv_memos").insert(rest);
    } else {
      const { id, created_at, ...rest } = form;
      await supabase.from("inv_memos").update(rest).eq("id", id);
    }
    close(); refresh();
  };
  const del = async (id) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("inv_memos").delete().eq("id", id);
    refresh();
  };

  const filtered = filter === "전체" ? memos : memos.filter(m => m.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">투자 메모장</h2>
          <p className="text-xs text-zinc-400 mt-1">아이디어 · 뉴스 · 리스크 · 반성 · 전략</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-32">
            <option>전체</option><option>아이디어</option><option>뉴스</option><option>리스크</option><option>반성</option><option>전략</option>
          </Select>
          {isAdmin && <Btn onClick={() => open(null)}><Plus size={14} /> 메모 추가</Btn>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-zinc-400">메모가 없습니다</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={m.type === "아이디어" ? "rose" : m.type === "리스크" ? "amber" : m.type === "반성" ? "sky" : m.type === "전략" ? "violet" : "zinc"}>{m.type}</Badge>
                    <Badge tone={m.priority === "상" ? "rose" : m.priority === "중" ? "amber" : "zinc"}>중요도 {m.priority}</Badge>
                  </div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{m.date} · {m.related}</div>
                </div>
                {isAdmin && (
                  <div>
                    <button onClick={() => open(m)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300"><Edit3 size={13} /></button>
                    <button onClick={() => del(m.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <div className="text-sm text-zinc-200 leading-relaxed mt-3 whitespace-pre-wrap">{m.content}</div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "메모 추가" : "메모 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">작성일</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">관련 종목</label><Input value={form.related || ""} onChange={e => setForm({ ...form, related: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">유형</label>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>아이디어</option><option>뉴스</option><option>리스크</option><option>반성</option><option>전략</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">중요도</label>
            <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option>상</option><option>중</option><option>하</option>
            </Select>
          </div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">제목</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">내용</label><TextArea rows={6} value={form.content || ""} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="ghost" onClick={close}>취소</Btn>
          <Btn onClick={save}>저장</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 리스크관리
// ============================================================================
function RiskPage({ holdings, summary }) {
  const checks = [
    {
      title: "특정 종목 비중 30% 초과",
      pass: !holdings.some(h => h.weight > 30),
      detail: holdings.filter(h => h.weight > 30).map(h => `${h.name} ${fmtPct(h.weight)}`).join(", ") || "양호"
    },
    {
      title: "손실률 -10% 초과 종목",
      pass: !holdings.some(h => h.plPct < -10),
      detail: holdings.filter(h => h.plPct < -10).map(h => `${h.name} ${fmtPct(h.plPct)}`).join(", ") || "양호"
    },
    {
      title: "손실률 -20% 초과 종목",
      pass: !holdings.some(h => h.plPct < -20),
      detail: holdings.filter(h => h.plPct < -20).map(h => `${h.name} ${fmtPct(h.plPct)}`).join(", ") || "양호"
    },
    {
      title: "특정 시장 집중도",
      pass: (() => {
        if (holdings.length === 0) return true;
        const byMarket = {};
        holdings.forEach(h => { byMarket[h.market] = (byMarket[h.market] || 0) + h.value; });
        const max = Math.max(...Object.values(byMarket));
        return max / summary.totalValue < 0.7;
      })(),
      detail: (() => {
        if (holdings.length === 0) return "보유 종목 없음";
        const byMarket = {};
        holdings.forEach(h => { byMarket[h.market] = (byMarket[h.market] || 0) + h.value; });
        return Object.entries(byMarket).map(([k, v]) => `${k} ${fmtPct((v / summary.totalValue) * 100)}`).join(" · ");
      })()
    },
  ];

  const passCount = checks.filter(c => c.pass).length;
  const riskScore = Math.round((passCount / checks.length) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">리스크 관리</h2>
        <p className="text-xs text-zinc-400 mt-1">포트폴리오 위험도 점검</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-widest">포트폴리오 건강도</div>
            <div className="text-5xl font-bold tabular-nums mt-2">{riskScore}<span className="text-2xl text-zinc-500">/100</span></div>
            <div className="text-xs text-zinc-400 mt-2">{passCount}/{checks.length} 항목 통과</div>
          </div>
          <div className="w-32 h-32 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#3f3f46" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={riskScore >= 75 ? "#10b981" : riskScore >= 50 ? "#f59e0b" : "#f43f5e"}
                strokeWidth="8" strokeDasharray={`${(riskScore / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((c, i) => (
          <Card key={i} className={`p-5 border ${c.pass ? "border-emerald-500/30" : "border-amber-500/40"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${c.pass ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                {c.pass ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.title}</div>
                <div className="text-xs text-zinc-300 mt-1">{c.detail}</div>
                <Badge tone={c.pass ? "emerald" : "amber"}>{c.pass ? "양호" : "주의"}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {holdings.length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold mb-4">종목별 수익률</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={holdings.map(h => ({ name: h.name, value: h.plPct }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
              <YAxis stroke="#a1a1aa" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => fmtPct(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {holdings.map((h, i) => <Cell key={i} fill={h.plPct >= 0 ? "#f43f5e" : "#3b82f6"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 투자목표
// ============================================================================
function GoalsPage({ goals, isAdmin, refresh }) {
  const [modal, setModal] = useState(null);
  const empty = { name: "", target: 0, current: 0, deadline: "", status: "진행중" };
  const [form, setForm] = useState(empty);

  const open  = (g) => { setForm(g ? { ...g, deadline: g.deadline || "" } : empty); setModal(g ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save  = async () => {
    if (!form.name) { alert("목표명을 입력하세요"); return; }
    const item = { ...form, target: +form.target, current: +form.current, deadline: form.deadline || null };
    if (modal === "new") {
      const { id, created_at, ...rest } = item;
      await supabase.from("inv_goals").insert(rest);
    } else {
      const { id, created_at, ...rest } = item;
      await supabase.from("inv_goals").update(rest).eq("id", id);
    }
    close(); refresh();
  };
  const del = async (id) => {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("inv_goals").delete().eq("id", id);
    refresh();
  };

  const monthsLeft = (deadline) => {
    if (!deadline) return 0;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">투자 목표</h2>
          <p className="text-xs text-zinc-400 mt-1">장기·단기 자산 목표</p>
        </div>
        {isAdmin && <Btn onClick={() => open(null)}><Plus size={14} /> 목표 추가</Btn>}
      </div>

      {goals.length === 0 ? (
        <Card className="p-10 text-center text-sm text-zinc-400">목표가 없습니다</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.target ? (g.current / g.target) * 100 : 0;
            const months = monthsLeft(g.deadline);
            const monthly = Math.max(0, (g.target - g.current) / months);
            return (
              <Card key={g.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-semibold">{g.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">목표일 {g.deadline || "—"} · {months}개월 남음</div>
                  </div>
                  {isAdmin && (
                    <div className="flex">
                      <button onClick={() => open(g)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300"><Edit3 size={13} /></button>
                      <button onClick={() => del(g.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <div className="text-xs text-zinc-400">현재</div>
                      <div className="text-xl font-semibold tabular-nums">₩{fmt(g.current)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">목표</div>
                      <div className="text-xl font-semibold tabular-nums text-zinc-300">₩{fmt(g.target)}</div>
                    </div>
                  </div>
                  <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-zinc-400">달성률</span>
                    <span className="font-semibold tabular-nums">{fmtPct(pct)}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-700 flex justify-between text-xs">
                  <span className="text-zinc-400">월 필요 투자금</span>
                  <span className="font-semibold tabular-nums text-amber-300">₩{fmt(monthly)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "목표 추가" : "목표 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-zinc-400">목표명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 1억 만들기" /></div>
          <div><label className="text-xs text-zinc-400">목표금액</label><Input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재금액</label><Input type="number" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">목표기간</label><Input type="date" value={form.deadline || ""} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">진행상태</label>
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>진행중</option><option>달성</option><option>중단</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="ghost" onClick={close}>취소</Btn>
          <Btn onClick={save}>저장</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 검색/필터
// ============================================================================
function SearchPage({ holdings, watchlist }) {
  const [q, setQ]   = useState("");
  const [market, setMarket]           = useState("전체");
  const [plFilter, setPlFilter]       = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [lossFilter, setLossFilter]   = useState("전체");

  const filtered = holdings.filter(h => {
    if (q && !h.name.includes(q) && !h.code.includes(q)) return false;
    if (market !== "전체" && h.market !== market) return false;
    if (plFilter === "수익" && h.pl <= 0) return false;
    if (plFilter === "손실" && h.pl >= 0) return false;
    if (statusFilter !== "전체" && h.status !== statusFilter) return false;
    if (lossFilter === "-10% 이상" && h.plPct > -10) return false;
    if (lossFilter === "-20% 이상" && h.plPct > -20) return false;
    return true;
  });

  const filteredWatch = watchlist.filter(w => {
    if (q && !w.name.includes(q) && !w.code.includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">검색 / 필터</h2>
        <p className="text-xs text-zinc-400 mt-1">조건별 종목 조회</p>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">종목명/코드</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="검색어 입력" />
            </div>
          </div>
          <div><label className="text-xs text-zinc-400">시장</label>
            <Select value={market} onChange={e => setMarket(e.target.value)}>
              <option>전체</option><option>코스피</option><option>코스닥</option><option>ETF</option><option>해외주식</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">수익/손실</label>
            <Select value={plFilter} onChange={e => setPlFilter(e.target.value)}>
              <option>전체</option><option>수익</option><option>손실</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">상태</label>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>전체</option><option>보유</option><option>일부매도</option><option>전량매도</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">손실률 기준</label>
            <Select value={lossFilter} onChange={e => setLossFilter(e.target.value)}>
              <option>전체</option><option>-10% 이상</option><option>-20% 이상</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Filter size={14} /> 보유 종목 결과 ({filtered.length})</div>
        {filtered.length === 0 ? (
          <div className="text-xs text-zinc-500 py-8 text-center">조건에 맞는 종목이 없습니다.</div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{h.name} <span className="text-[11px] text-zinc-500 font-mono ml-1">{h.code}</span></div>
                  <div className="text-xs text-zinc-400 mt-0.5">{h.market} · {h.status}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold tabular-nums ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</div>
                  <div className="text-[11px] text-zinc-500 tabular-nums">₩{fmt(h.value)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {q && (
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3">관심 종목 결과 ({filteredWatch.length})</div>
          <div className="space-y-1.5">
            {filteredWatch.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-700 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{w.name} <span className="text-[11px] text-zinc-500 font-mono ml-1">{w.code}</span></div>
                  <div className="text-xs text-zinc-400 mt-0.5">{w.reason}</div>
                </div>
                <Badge tone={w.grade === "매수검토" ? "rose" : "zinc"}>{w.grade}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
