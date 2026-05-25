// @ts-nocheck
"use client";
// ============================================================================
// Wealth Insight - 개인 투자관리 대시보드
// ----------------------------------------------------------------------------
// 본 파일은 Claude.ai의 React 아티팩트 환경에서 그대로 실행되도록 작성되었습니다.
// Next.js + TypeScript 프로젝트로 옮기는 방법:
//   1) `app/page.tsx` 를 만들고 파일 최상단에 `"use client";` 를 추가
//   2) 아래 코드를 그대로 붙여넣기 (확장자 .tsx)
//   3) `npm i recharts lucide-react` 후 Tailwind 설정만 맞추면 동작
//   4) localStorage 부분은 `lib/storage.ts` 로 분리하면 추후 DB 교체 용이
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import {
  LayoutDashboard, Briefcase, Star, LineChart as LineIcon,
  History, NotebookPen, ShieldAlert, Target, Search,
  TrendingUp, TrendingDown, Plus, Trash2, Edit3, X,
  AlertTriangle, CheckCircle2, Activity, Wallet, PieChart as PieIcon,
  Filter, Database
} from "lucide-react";

// ============================================================================
// [1] 데이터 레이어 - 추후 DB 교체를 위해 한 곳에 모았습니다.
//     실제 프로젝트에서는 lib/storage.ts 로 분리하세요.
// ============================================================================
const STORAGE_KEY = "wealth_insight_v1";

const SAMPLE_DATA = {
  holdings: [
    { id: "h1", code: "005930", name: "삼성전자", market: "코스피", buyDate: "2024-03-15", buyPrice: 72000, quantity: 50, currentPrice: 78500, status: "보유", memo: "장기 보유 핵심 자산" },
    { id: "h2", code: "000660", name: "SK하이닉스", market: "코스피", buyDate: "2024-05-02", buyPrice: 185000, quantity: 15, currentPrice: 213000, status: "보유", memo: "AI 메모리 사이클 수혜" },
    { id: "h3", code: "005380", name: "현대차", market: "코스피", buyDate: "2024-01-22", buyPrice: 245000, quantity: 8, currentPrice: 228000, status: "보유", memo: "배당 매력 + 전기차 전환" },
    { id: "h4", code: "035420", name: "NAVER", market: "코스피", buyDate: "2023-11-10", buyPrice: 215000, quantity: 12, currentPrice: 198000, status: "일부매도", memo: "AI 사업 전환 관찰 중" },
    { id: "h5", code: "035720", name: "카카오", market: "코스피", buyDate: "2023-09-04", buyPrice: 52000, quantity: 40, currentPrice: 41500, status: "보유", memo: "손실 누적, 추가 진입 보류" },
    { id: "h6", code: "360750", name: "TIGER 미국S&P500", market: "ETF", buyDate: "2024-06-18", buyPrice: 16500, quantity: 200, currentPrice: 18200, status: "보유", memo: "월별 적립식 - 핵심 패시브" },
  ],
  watchlist: [
    { id: "w1", code: "207940", name: "삼성바이오로직스", currentPrice: 920000, targetBuy: 850000, targetSell: 1100000, reason: "CDMO 수주 모멘텀", checkpoint: "분기 가이던스", grade: "매수검토", regDate: "2024-08-12", memo: "환율 영향 점검 필요" },
    { id: "w2", code: "012450", name: "한화에어로스페이스", currentPrice: 285000, targetBuy: 240000, targetSell: 360000, reason: "방산 수출 사이클", checkpoint: "수주 잔고", grade: "관찰", regDate: "2024-07-25", memo: "유럽 수주 동향" },
    { id: "w3", code: "373220", name: "LG에너지솔루션", currentPrice: 365000, targetBuy: 340000, targetSell: 450000, reason: "전기차 회복", checkpoint: "북미 IRA 영향", grade: "관심", regDate: "2024-09-01", memo: "" },
  ],
  trades: [
    { id: "t1", date: "2024-03-15", name: "삼성전자", type: "매수", price: 72000, quantity: 50, amount: 3600000, reason: "분기 실적 바닥 통과", feedback: "분할 매수 잘했음", learning: "공포 구간 분할매수 원칙 유지" },
    { id: "t2", date: "2024-05-02", name: "SK하이닉스", type: "매수", price: 185000, quantity: 15, amount: 2775000, reason: "HBM 가이던스 상향", feedback: "타이밍 적절", learning: "" },
    { id: "t3", date: "2024-07-20", name: "NAVER", type: "익절", price: 218000, quantity: 4, amount: 872000, reason: "기술적 저항선 도달", feedback: "절반 익절 후 추세 지속", learning: "익절은 분할로" },
    { id: "t4", date: "2024-09-08", name: "카카오", type: "손절", price: 43000, quantity: 0, amount: 0, reason: "추가매수 보류 결정", feedback: "손절 못한 점 반성", learning: "손실 -15% 기준선 사전 설정" },
  ],
  memos: [
    { id: "m1", date: "2024-09-12", title: "9월 시장 코멘트", content: "FOMC 이후 변동성 확대. 환율 1380원 부근 관찰.", related: "전반", type: "전략", priority: "상" },
    { id: "m2", date: "2024-09-05", title: "반도체 사이클 점검", content: "HBM 공급 부족 지속. 메모리 가격 반등 시그널 확인.", related: "SK하이닉스, 삼성전자", type: "아이디어", priority: "상" },
    { id: "m3", date: "2024-08-28", title: "카카오 보유 반성", content: "비중 조절 실패. 손실 누적 시 룰베이스 매도 필요.", related: "카카오", type: "반성", priority: "중" },
  ],
  goals: [
    { id: "g1", name: "1억 자산 달성", target: 100000000, current: 42000000, deadline: "2027-12-31", status: "진행중" },
    { id: "g2", name: "배당 월 50만원", target: 6000000, current: 1850000, deadline: "2028-12-31", status: "진행중" },
  ],
  analysis: {
    "005930": { growth: 4, profit: 4, stability: 5, valuation: 4, dividend: 3, per: 14.2, pbr: 1.3, roe: 9.8, debt: 28.5, revenueGrowth: 12.5, opGrowth: 18.2, dividendYield: 2.1, issue: "HBM 양산 및 파운드리 회복", risk: "중국 메모리 추격", judgment: "장기 보유 유지" },
    "000660": { growth: 5, profit: 5, stability: 3, valuation: 3, dividend: 2, per: 8.5, pbr: 2.1, roe: 24.5, debt: 42.1, revenueGrowth: 38.2, opGrowth: 152.4, dividendYield: 1.2, issue: "HBM3E 양산 본격화", risk: "메모리 사이클 변동성", judgment: "비중 유지, 추세 추종" },
  }
};

// localStorage 추상화 - 추후 fetch/axios 로 교체하면 DB 연동 가능
const storage = {
  load: () => {
    if (typeof window === "undefined") return SAMPLE_DATA;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA; }
  },
  save: (data) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  },
  reset: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ============================================================================
// [2] 유틸 함수
// ============================================================================
const fmt = (n) => new Intl.NumberFormat("ko-KR").format(Math.round(n || 0));
const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;

// 한국 주식 색상 감각: 상승 = 빨강, 하락 = 파랑
const colorByPL = (n) => {
  if (n > 0) return "text-rose-400";
  if (n < 0) return "text-sky-400";
  return "text-zinc-400";
};
const bgByPL = (n) => {
  if (n > 0) return "bg-rose-500/10 border-rose-500/30";
  if (n < 0) return "bg-sky-500/10 border-sky-500/30";
  return "bg-zinc-500/10 border-zinc-500/30";
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ============================================================================
// [3] 공통 UI 컴포넌트 - 카드, 배지 등
// ============================================================================
const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.35)] ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, sub, accent, icon: Icon }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-medium">{label}</div>
        <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent || "text-zinc-100"}`}>{value}</div>
        {sub && <div className={`mt-1 text-xs ${accent || "text-zinc-500"}`}>{sub}</div>}
      </div>
      {Icon && <div className="p-2 rounded-lg bg-zinc-800/60 text-zinc-400"><Icon size={18} /></div>}
    </div>
  </Card>
);

const Badge = ({ children, tone = "zinc" }) => {
  const tones = {
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${tones[tone]}`}>{children}</span>;
};

const Input = (props) => (
  <input {...props} className={`w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition ${props.className || ""}`} />
);

const Select = ({ children, ...props }) => (
  <select {...props} className={`w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition ${props.className || ""}`}>
    {children}
  </select>
);

const TextArea = (props) => (
  <textarea {...props} className={`w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition ${props.className || ""}`} />
);

const Btn = ({ children, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-zinc-100 text-zinc-900 hover:bg-white",
    ghost: "bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800 border border-zinc-700",
    danger: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30",
  };
  return (
    <button {...props} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${variants[variant]} ${props.className || ""}`}>
      {children}
    </button>
  );
};

// 모달
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
// [4] 메인 컴포넌트
// ============================================================================
export default function WealthInsight() {
  const [data, setData] = useState(SAMPLE_DATA);
  const [page, setPage] = useState("dashboard");
  const [hydrated, setHydrated] = useState(false);

  // 초기 로드
  useEffect(() => {
    setData(storage.load());
    setHydrated(true);
  }, []);

  // 변경 시 자동 저장
  useEffect(() => {
    if (hydrated) storage.save(data);
  }, [data, hydrated]);

  // ----- 파생 계산: 보유 종목 평가/손익 -----
  const enrichedHoldings = useMemo(() => {
    const totalValue = data.holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
    return data.holdings.map(h => {
      const totalBuy = h.buyPrice * h.quantity;
      const value = h.currentPrice * h.quantity;
      const pl = value - totalBuy;
      const plPct = totalBuy ? (pl / totalBuy) * 100 : 0;
      const weight = totalValue ? (value / totalValue) * 100 : 0;
      return { ...h, totalBuy, value, pl, plPct, weight };
    });
  }, [data.holdings]);

  const summary = useMemo(() => {
    const totalBuy = enrichedHoldings.reduce((s, h) => s + h.totalBuy, 0);
    const totalValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
    const totalPL = totalValue - totalBuy;
    const totalPct = totalBuy ? (totalPL / totalBuy) * 100 : 0;
    return { totalBuy, totalValue, totalPL, totalPct, count: enrichedHoldings.length, watchCount: data.watchlist.length };
  }, [enrichedHoldings, data.watchlist]);

  const update = (key, fn) => setData(d => ({ ...d, [key]: fn(d[key]) }));

  // ----- 사이드바 메뉴 -----
  const menu = [
    { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
    { id: "holdings", label: "보유종목", icon: Briefcase },
    { id: "watchlist", label: "관심종목", icon: Star },
    { id: "analysis", label: "종목분석", icon: LineIcon },
    { id: "trades", label: "투자기록", icon: History },
    { id: "memos", label: "투자메모", icon: NotebookPen },
    { id: "risk", label: "리스크관리", icon: ShieldAlert },
    { id: "goals", label: "투자목표", icon: Target },
    { id: "search", label: "검색/필터", icon: Search },
  ];

  return (
    <div className="space-y-5 -mx-8 -my-8">
      {/* 상단 요약 바 */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">Portfolio Overview</div>
            <div className="text-lg font-semibold tracking-tight mt-0.5">
              총 평가금액 <span className="text-zinc-100 tabular-nums">₩{fmt(summary.totalValue)}</span>
              <span className={`ml-3 text-sm tabular-nums ${colorByPL(summary.totalPL)}`}>
                {summary.totalPL >= 0 ? "▲" : "▼"} {fmt(Math.abs(summary.totalPL))} ({fmtPct(summary.totalPct)})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="amber">SAMPLE DATA</Badge>
            <button onClick={() => { if (confirm("샘플 데이터로 초기화할까요?")) { storage.reset(); setData(SAMPLE_DATA); } }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition">
              <Database size={12} /> 초기화
            </button>
          </div>
        </div>

        {/* 가로 탭 메뉴 */}
        <nav className="px-8 flex gap-1 overflow-x-auto border-t border-zinc-900/60">
          {menu.map(m => {
            const Icon = m.icon;
            const active = page === m.id;
            return (
              <button key={m.id} onClick={() => setPage(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 -mb-px transition ${
                  active ? "border-zinc-100 text-zinc-100 font-medium" : "border-transparent text-zinc-500 hover:text-zinc-200"
                }`}>
                <Icon size={13} />
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 페이지별 라우팅 */}
      <div className="px-8 py-6">
        {page === "dashboard" && <DashboardPage holdings={enrichedHoldings} summary={summary} data={data} />}
        {page === "holdings" && <HoldingsPage holdings={enrichedHoldings} update={update} />}
        {page === "watchlist" && <WatchlistPage watchlist={data.watchlist} update={update} />}
        {page === "analysis" && <AnalysisPage holdings={enrichedHoldings} analysis={data.analysis} setData={setData} />}
        {page === "trades" && <TradesPage trades={data.trades} update={update} />}
        {page === "memos" && <MemosPage memos={data.memos} update={update} />}
        {page === "risk" && <RiskPage holdings={enrichedHoldings} summary={summary} />}
        {page === "goals" && <GoalsPage goals={data.goals} update={update} summary={summary} />}
        {page === "search" && <SearchPage holdings={enrichedHoldings} watchlist={data.watchlist} />}
      </div>

      <footer className="px-8 py-8 border-t border-zinc-900">
        <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
          본 페이지는 개인 투자 기록 및 분석을 위한 관리 도구이며, 특정 종목의 매수·매도 추천을 의미하지 않습니다.
        </p>
        <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">© Wealth Insight · Personal Investment Lab</p>
      </footer>
    </div>
  );
}

// ============================================================================
// [5] 대시보드 페이지
// ============================================================================
function DashboardPage({ holdings, summary, data }) {
  // 손익 TOP 5
  const topGain = [...holdings].sort((a, b) => b.pl - a.pl).slice(0, 5);
  const topLoss = [...holdings].sort((a, b) => a.pl - b.pl).slice(0, 5);
  const topWeight = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const risky = holdings.filter(h => h.plPct < -10);

  const PIE_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
  const pieData = holdings.map(h => ({ name: h.name, value: h.value }));

  // 월별 가상 자산 추이 (실제 환경에서는 거래 데이터에서 계산)
  const trend = useMemo(() => {
    const months = ["4월", "5월", "6월", "7월", "8월", "9월", "10월"];
    return months.map((m, i) => ({
      month: m,
      value: Math.round(summary.totalValue * (0.85 + i * 0.025) + (Math.random() - 0.5) * 1000000),
      invest: Math.round(summary.totalBuy * (0.88 + i * 0.02))
    }));
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="총 투자금" value={`₩${fmt(summary.totalBuy)}`} icon={Wallet} />
        <Stat label="총 평가금액" value={`₩${fmt(summary.totalValue)}`} icon={Briefcase} />
        <Stat label="총 손익" value={`${summary.totalPL >= 0 ? "+" : "-"}₩${fmt(Math.abs(summary.totalPL))}`} accent={colorByPL(summary.totalPL)} icon={summary.totalPL >= 0 ? TrendingUp : TrendingDown} />
        <Stat label="총 수익률" value={fmtPct(summary.totalPct)} accent={colorByPL(summary.totalPL)} icon={Activity} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="보유 종목" value={`${summary.count}개`} sub="포트폴리오 구성" />
        <Stat label="관심 종목" value={`${summary.watchCount}개`} sub="추적 중" />
        <Stat label="투자 기록" value={`${data.trades.length}건`} sub="누적 거래" />
        <Stat label="메모" value={`${data.memos.length}건`} sub="투자 노트" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">자산 성장 추이</div>
              <div className="text-xs text-zinc-500 mt-0.5">월별 평가금액 변화</div>
            </div>
            <Badge tone="zinc">7개월</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => `₩${fmt(v)}`} />
              <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} fill="url(#g1)" />
              <Line type="monotone" dataKey="invest" stroke="#71717a" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">투자 비중</div>
              <div className="text-xs text-zinc-500 mt-0.5">종목별 자산 배분</div>
            </div>
            <PieIcon size={16} className="text-zinc-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => `₩${fmt(v)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
            {topWeight.map((h, i) => (
              <div key={h.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-zinc-300">{h.name}</span>
                </div>
                <span className="text-zinc-500 tabular-nums">{fmtPct(h.weight)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-rose-400" /> 손익 상위
          </div>
          <div className="space-y-2">
            {topGain.map(h => (
              <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="text-xs font-medium">{h.name}</div>
                  <div className="text-[10px] text-zinc-500">{h.code}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold tabular-nums ${colorByPL(h.pl)}`}>
                    {h.pl >= 0 ? "+" : "-"}₩{fmt(Math.abs(h.pl))}
                  </div>
                  <div className={`text-[10px] tabular-nums ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</div>
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
              <div key={h.id} className="py-1.5 border-b border-zinc-800/50 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium">{h.name}</div>
                  <span className="text-xs text-zinc-400 tabular-nums">{fmtPct(h.weight)}</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
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
            <div className="text-xs text-zinc-500 py-6 text-center">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/50" />
              위험 종목 없음
            </div>
          ) : (
            <div className="space-y-2">
              {risky.map(h => (
                <div key={h.id} className={`p-2.5 rounded-lg border ${bgByPL(h.pl)}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{h.name}</div>
                    <Badge tone="sky">손실 -10% 초과</Badge>
                  </div>
                  <div className={`text-xs tabular-nums mt-1 ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 오늘의 메모 */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <NotebookPen size={15} className="text-violet-400" /> 최근 투자 메모
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.memos.slice(0, 3).map(m => (
            <div key={m.id} className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-medium">{m.title}</div>
                <Badge tone={m.priority === "상" ? "rose" : m.priority === "중" ? "amber" : "zinc"}>{m.priority}</Badge>
              </div>
              <div className="text-[11px] text-zinc-500 mb-1">{m.date} · {m.type}</div>
              <div className="text-xs text-zinc-400 line-clamp-2">{m.content}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// [6] 보유종목 페이지
// ============================================================================
function HoldingsPage({ holdings, update }) {
  const [modal, setModal] = useState(null); // null | "new" | holding obj
  const empty = { code: "", name: "", market: "코스피", buyDate: new Date().toISOString().slice(0, 10), buyPrice: 0, quantity: 0, currentPrice: 0, status: "보유", memo: "" };
  const [form, setForm] = useState(empty);

  const open = (h) => { setForm(h || empty); setModal(h ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };

  const save = () => {
    if (!form.name || !form.code) { alert("종목명/코드를 입력하세요"); return; }
    const item = { ...form, buyPrice: +form.buyPrice, quantity: +form.quantity, currentPrice: +form.currentPrice };
    if (modal === "new") update("holdings", arr => [...arr, { ...item, id: uid() }]);
    else update("holdings", arr => arr.map(h => h.id === item.id ? item : h));
    close();
  };

  const del = (id) => { if (confirm("삭제할까요?")) update("holdings", arr => arr.filter(h => h.id !== id)); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">보유 종목</h2>
          <p className="text-xs text-zinc-500 mt-1">총 {holdings.length}개 종목 · ₩{fmt(holdings.reduce((s, h) => s + h.value, 0))}</p>
        </div>
        <Btn onClick={() => open(null)}><Plus size={14} /> 종목 추가</Btn>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-500">
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
                <th className="text-center px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => (
                <tr key={h.id} className="border-t border-zinc-800/60 hover:bg-zinc-900/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100">{h.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{h.code} · {h.buyDate}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone="zinc">{h.market}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(h.buyPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(h.quantity)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-100 font-medium">{fmt(h.currentPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{fmt(h.totalBuy)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-100 font-medium">{fmt(h.value)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${colorByPL(h.pl)}`}>
                    {h.pl >= 0 ? "+" : "-"}{fmt(Math.abs(h.pl))}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${colorByPL(h.pl)}`}>{fmtPct(h.plPct)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{fmtPct(h.weight)}</td>
                  <td className="px-4 py-3 text-center"><Badge tone={h.status === "보유" ? "emerald" : h.status === "일부매도" ? "amber" : "zinc"}>{h.status}</Badge></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => open(h)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"><Edit3 size={13} /></button>
                    <button onClick={() => del(h.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400 ml-1"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <div><label className="text-xs text-zinc-400">매수일</label><Input type="date" value={form.buyDate} onChange={e => setForm({ ...form, buyDate: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">매수단가</label><Input type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">보유수량</label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재가</label><Input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">투자상태</label>
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>보유</option><option>일부매도</option><option>전량매도</option>
            </Select>
          </div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">투자메모</label><TextArea rows={3} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} /></div>
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
// [7] 관심종목 페이지
// ============================================================================
function WatchlistPage({ watchlist, update }) {
  const [modal, setModal] = useState(null);
  const empty = { code: "", name: "", currentPrice: 0, targetBuy: 0, targetSell: 0, reason: "", checkpoint: "", grade: "관심", regDate: new Date().toISOString().slice(0, 10), memo: "" };
  const [form, setForm] = useState(empty);

  const open = (w) => { setForm(w || empty); setModal(w ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save = () => {
    const item = { ...form, currentPrice: +form.currentPrice, targetBuy: +form.targetBuy, targetSell: +form.targetSell };
    if (modal === "new") update("watchlist", arr => [...arr, { ...item, id: uid() }]);
    else update("watchlist", arr => arr.map(x => x.id === item.id ? item : x));
    close();
  };
  const del = (id) => { if (confirm("삭제할까요?")) update("watchlist", arr => arr.filter(w => w.id !== id)); };

  // 신호 판정
  const signal = (w) => {
    if (w.targetBuy && w.currentPrice <= w.targetBuy) return { tone: "rose", label: "매수 검토" };
    if (w.targetSell && w.currentPrice >= w.targetSell) return { tone: "sky", label: "매도 검토" };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">관심 종목</h2>
          <p className="text-xs text-zinc-500 mt-1">총 {watchlist.length}개 관찰</p>
        </div>
        <Btn onClick={() => open(null)}><Plus size={14} /> 관심 추가</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.map(w => {
          const sig = signal(w);
          return (
            <Card key={w.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{w.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{w.code}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Badge tone={w.grade === "매수검토" ? "rose" : w.grade === "관찰" ? "amber" : w.grade === "보류" ? "sky" : "zinc"}>{w.grade}</Badge>
                    {sig && <Badge tone={sig.tone}>● {sig.label}</Badge>}
                  </div>
                </div>
                <div className="flex">
                  <button onClick={() => open(w)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"><Edit3 size={13} /></button>
                  <button onClick={() => del(w.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">현재가</span><span className="tabular-nums font-medium">₩{fmt(w.currentPrice)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">목표 매수가</span><span className="tabular-nums text-rose-400">₩{fmt(w.targetBuy)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">목표 매도가</span><span className="tabular-nums text-sky-400">₩{fmt(w.targetSell)}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 text-xs space-y-1">
                <div><span className="text-zinc-500">관심사유:</span> <span className="text-zinc-300">{w.reason}</span></div>
                <div><span className="text-zinc-500">체크포인트:</span> <span className="text-zinc-300">{w.checkpoint}</span></div>
                {w.memo && <div className="text-zinc-500 text-[11px] italic mt-2">{w.memo}</div>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "관심 종목 추가" : "관심 종목 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">종목코드</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">종목명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재가</label><Input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">투자등급</label>
            <Select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              <option>관심</option><option>관찰</option><option>매수검토</option><option>보류</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">목표매수가</label><Input type="number" value={form.targetBuy} onChange={e => setForm({ ...form, targetBuy: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">목표매도가</label><Input type="number" value={form.targetSell} onChange={e => setForm({ ...form, targetSell: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">관심사유</label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">체크포인트</label><Input value={form.checkpoint} onChange={e => setForm({ ...form, checkpoint: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">메모</label><TextArea rows={2} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} /></div>
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
// [8] 종목분석 페이지
// ============================================================================
function AnalysisPage({ holdings, analysis, setData }) {
  const [selected, setSelected] = useState(holdings[0]?.code);
  const cur = holdings.find(h => h.code === selected);
  const a = analysis[selected] || { growth: 3, profit: 3, stability: 3, valuation: 3, dividend: 3, per: 0, pbr: 0, roe: 0, debt: 0, revenueGrowth: 0, opGrowth: 0, dividendYield: 0, issue: "", risk: "", judgment: "" };

  const total = (a.growth || 0) + (a.profit || 0) + (a.stability || 0) + (a.valuation || 0) + (a.dividend || 0);
  const judge = total >= 21 ? { label: "적극 검토", tone: "rose" } : total >= 16 ? { label: "보유 또는 관찰", tone: "amber" } : total >= 11 ? { label: "신중 검토", tone: "sky" } : { label: "투자 보류", tone: "zinc" };

  const updateField = (field, val) => {
    setData(d => ({ ...d, analysis: { ...d.analysis, [selected]: { ...a, [field]: val } } }));
  };

  const scoreItems = [
    { key: "growth", label: "성장성" },
    { key: "profit", label: "수익성" },
    { key: "stability", label: "안정성" },
    { key: "valuation", label: "저평가" },
    { key: "dividend", label: "배당매력" },
  ];

  // 모의 차트 데이터
  const chartData = useMemo(() => {
    if (!cur) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      m: `${i + 1}월`,
      price: Math.round(cur.currentPrice * (0.85 + Math.random() * 0.3))
    }));
  }, [cur]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">종목 분석</h2>
        <Select value={selected} onChange={e => setSelected(e.target.value)} className="w-48">
          {holdings.map(h => <option key={h.id} value={h.code}>{h.name}</option>)}
        </Select>
      </div>

      {cur && (
        <>
          {/* 기본 정보 + 투자 요약 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
              <div className="text-sm font-semibold mb-4">기본 정보 & 투자 요약</div>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">종목명</div><div className="text-sm font-medium mt-1">{cur.name}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">시장</div><div className="text-sm font-medium mt-1">{cur.market}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">평균단가</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.buyPrice)}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">현재가</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.currentPrice)}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">평가금액</div><div className="text-sm font-medium mt-1 tabular-nums">₩{fmt(cur.value)}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">손익</div><div className={`text-sm font-semibold mt-1 tabular-nums ${colorByPL(cur.pl)}`}>{cur.pl >= 0 ? "+" : "-"}₩{fmt(Math.abs(cur.pl))}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">수익률</div><div className={`text-sm font-semibold mt-1 tabular-nums ${colorByPL(cur.pl)}`}>{fmtPct(cur.plPct)}</div></div>
                <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">비중</div><div className="text-sm font-medium mt-1 tabular-nums">{fmtPct(cur.weight)}</div></div>
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

          {/* 재무 분석 */}
          <Card className="p-5">
            <div className="text-sm font-semibold mb-4">재무 분석</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "PER", val: a.per, field: "per", suffix: "" },
                { label: "PBR", val: a.pbr, field: "pbr", suffix: "" },
                { label: "ROE", val: a.roe, field: "roe", suffix: "%" },
                { label: "부채비율", val: a.debt, field: "debt", suffix: "%" },
                { label: "매출성장", val: a.revenueGrowth, field: "revenueGrowth", suffix: "%" },
                { label: "영업익성장", val: a.opGrowth, field: "opGrowth", suffix: "%" },
                { label: "배당률", val: a.dividendYield, field: "dividendYield", suffix: "%" },
              ].map(item => (
                <div key={item.field} className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</div>
                  <input type="number" value={item.val} onChange={e => updateField(item.field, +e.target.value)}
                    className="w-full bg-transparent text-zinc-100 text-base font-semibold tabular-nums mt-1 focus:outline-none" />
                  <div className="text-[10px] text-zinc-600">{item.suffix}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 차트 분석 */}
          <Card className="p-5">
            <div className="text-sm font-semibold mb-4">차트 분석 <span className="text-[10px] text-zinc-500 ml-2">(샘플 데이터)</span></div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="m" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => `₩${fmt(v)}`} />
                <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 점수 평가 */}
          <Card className="p-5">
            <div className="text-sm font-semibold mb-4">5점 평가</div>
            <div className="space-y-3">
              {scoreItems.map(item => (
                <div key={item.key} className="flex items-center gap-4">
                  <div className="w-20 text-xs text-zinc-400">{item.label}</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => updateField(item.key, n)}
                        className={`w-8 h-8 rounded-md text-xs font-semibold transition ${
                          (a[item.key] || 0) >= n ? "bg-gradient-to-br from-rose-500 to-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                        }`}>{n}</button>
                    ))}
                  </div>
                  <div className="text-xs text-zinc-500 ml-auto tabular-nums">{a[item.key] || 0}/5</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 리스크 + 판단 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">최근 이슈</div>
              <TextArea rows={4} value={a.issue} onChange={e => updateField("issue", e.target.value)} placeholder="최근 이슈를 기록하세요" />
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">투자 리스크</div>
              <TextArea rows={4} value={a.risk} onChange={e => updateField("risk", e.target.value)} placeholder="리스크를 기록하세요" />
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold mb-3">나의 투자 판단</div>
              <TextArea rows={4} value={a.judgment} onChange={e => updateField("judgment", e.target.value)} placeholder="매수/보유/매도 판단 메모" />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// [9] 투자기록 페이지
// ============================================================================
function TradesPage({ trades, update }) {
  const [modal, setModal] = useState(null);
  const empty = { date: new Date().toISOString().slice(0, 10), name: "", type: "매수", price: 0, quantity: 0, amount: 0, reason: "", feedback: "", learning: "" };
  const [form, setForm] = useState(empty);

  const open = (t) => { setForm(t || empty); setModal(t ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save = () => {
    const amount = +form.price * +form.quantity;
    const item = { ...form, price: +form.price, quantity: +form.quantity, amount };
    if (modal === "new") update("trades", arr => [{ ...item, id: uid() }, ...arr]);
    else update("trades", arr => arr.map(x => x.id === item.id ? item : x));
    close();
  };
  const del = (id) => { if (confirm("삭제할까요?")) update("trades", arr => arr.filter(t => t.id !== id)); };

  const typeTone = { 매수: "rose", 추가매수: "rose", 매도: "sky", 익절: "emerald", 손절: "zinc" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">투자 기록</h2>
          <p className="text-xs text-zinc-500 mt-1">총 {trades.length}건의 거래</p>
        </div>
        <Btn onClick={() => open(null)}><Plus size={14} /> 거래 추가</Btn>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">거래일</th>
              <th className="text-left px-4 py-3">종목</th>
              <th className="text-center px-4 py-3">구분</th>
              <th className="text-right px-4 py-3">단가</th>
              <th className="text-right px-4 py-3">수량</th>
              <th className="text-right px-4 py-3">거래금액</th>
              <th className="text-left px-4 py-3">거래사유</th>
              <th className="text-center px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} className="border-t border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-300 tabular-nums">{t.date}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-center"><Badge tone={typeTone[t.type] || "zinc"}>{t.type}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(t.price)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(t.quantity)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(t.amount)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{t.reason}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => open(t)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"><Edit3 size={13} /></button>
                  <button onClick={() => del(t.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                </td>
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
          <div className="col-span-2"><label className="text-xs text-zinc-400">거래사유</label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">거래 후 느낀 점</label><TextArea rows={2} value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-zinc-400">다음 투자에 반영할 점</label><TextArea rows={2} value={form.learning} onChange={e => setForm({ ...form, learning: e.target.value })} /></div>
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
// [10] 투자메모 페이지
// ============================================================================
function MemosPage({ memos, update }) {
  const [modal, setModal] = useState(null);
  const empty = { date: new Date().toISOString().slice(0, 10), title: "", content: "", related: "", type: "아이디어", priority: "중" };
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("전체");

  const open = (m) => { setForm(m || empty); setModal(m ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save = () => {
    if (modal === "new") update("memos", arr => [{ ...form, id: uid() }, ...arr]);
    else update("memos", arr => arr.map(x => x.id === form.id ? form : x));
    close();
  };
  const del = (id) => { if (confirm("삭제할까요?")) update("memos", arr => arr.filter(m => m.id !== id)); };

  const filtered = filter === "전체" ? memos : memos.filter(m => m.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">투자 메모장</h2>
          <p className="text-xs text-zinc-500 mt-1">아이디어 · 뉴스 · 리스크 · 반성 · 전략</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-32">
            <option>전체</option><option>아이디어</option><option>뉴스</option><option>리스크</option><option>반성</option><option>전략</option>
          </Select>
          <Btn onClick={() => open(null)}><Plus size={14} /> 메모 추가</Btn>
        </div>
      </div>

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
              <div>
                <button onClick={() => open(m)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"><Edit3 size={13} /></button>
                <button onClick={() => del(m.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed mt-3">{m.content}</div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "메모 추가" : "메모 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400">작성일</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">관련 종목</label><Input value={form.related} onChange={e => setForm({ ...form, related: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">메모 유형</label>
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
          <div className="col-span-2"><label className="text-xs text-zinc-400">내용</label><TextArea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
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
// [11] 리스크 관리 페이지
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
        const byMarket = {};
        holdings.forEach(h => { byMarket[h.market] = (byMarket[h.market] || 0) + h.value; });
        const max = Math.max(...Object.values(byMarket));
        return max / summary.totalValue < 0.7;
      })(),
      detail: (() => {
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
        <p className="text-xs text-zinc-500 mt-1">포트폴리오 위험도 점검</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">포트폴리오 건강도</div>
            <div className="text-5xl font-bold tabular-nums mt-2">{riskScore}<span className="text-2xl text-zinc-500">/100</span></div>
            <div className="text-xs text-zinc-500 mt-2">{passCount}/{checks.length} 항목 통과</div>
          </div>
          <div className="w-32 h-32 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={riskScore >= 75 ? "#10b981" : riskScore >= 50 ? "#f59e0b" : "#f43f5e"}
                strokeWidth="8" strokeDasharray={`${(riskScore / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((c, i) => (
          <Card key={i} className={`p-5 border ${c.pass ? "border-emerald-500/20" : "border-amber-500/30"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${c.pass ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
                {c.pass ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.title}</div>
                <div className="text-xs text-zinc-400 mt-1">{c.detail}</div>
                <Badge tone={c.pass ? "emerald" : "amber"}>{c.pass ? "양호" : "주의"}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 종목별 수익률 막대 */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">종목별 수익률</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={holdings.map(h => ({ name: h.name, value: h.plPct }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} formatter={(v) => fmtPct(v)} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {holdings.map((h, i) => <Cell key={i} fill={h.plPct >= 0 ? "#f43f5e" : "#3b82f6"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ============================================================================
// [12] 투자목표 페이지
// ============================================================================
function GoalsPage({ goals, update, summary }) {
  const [modal, setModal] = useState(null);
  const empty = { name: "", target: 0, current: 0, deadline: "", status: "진행중" };
  const [form, setForm] = useState(empty);

  const open = (g) => { setForm(g || empty); setModal(g ? "edit" : "new"); };
  const close = () => { setModal(null); setForm(empty); };
  const save = () => {
    const item = { ...form, target: +form.target, current: +form.current };
    if (modal === "new") update("goals", arr => [...arr, { ...item, id: uid() }]);
    else update("goals", arr => arr.map(x => x.id === item.id ? item : x));
    close();
  };
  const del = (id) => { if (confirm("삭제할까요?")) update("goals", arr => arr.filter(g => g.id !== id)); };

  // 월 필요 투자금 계산
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
          <p className="text-xs text-zinc-500 mt-1">장기·단기 자산 목표 관리</p>
        </div>
        <Btn onClick={() => open(null)}><Plus size={14} /> 목표 추가</Btn>
      </div>

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
                  <div className="text-xs text-zinc-500 mt-1">목표일 {g.deadline} · {months}개월 남음</div>
                </div>
                <div className="flex">
                  <button onClick={() => open(g)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"><Edit3 size={13} /></button>
                  <button onClick={() => del(g.id)} className="p-1.5 hover:bg-zinc-800 rounded text-rose-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-xs text-zinc-500">현재</div>
                    <div className="text-xl font-semibold tabular-nums">₩{fmt(g.current)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">목표</div>
                    <div className="text-xl font-semibold tabular-nums text-zinc-400">₩{fmt(g.target)}</div>
                  </div>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-zinc-500">달성률</span>
                  <span className="font-semibold tabular-nums">{fmtPct(pct)}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between text-xs">
                <span className="text-zinc-500">월 필요 투자금</span>
                <span className="font-semibold tabular-nums text-amber-400">₩{fmt(monthly)}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "new" ? "목표 추가" : "목표 수정"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-zinc-400">목표명</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 1억 만들기" /></div>
          <div><label className="text-xs text-zinc-400">목표금액</label><Input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">현재금액</label><Input type="number" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} /></div>
          <div><label className="text-xs text-zinc-400">목표기간</label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
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
// [13] 검색/필터 페이지
// ============================================================================
function SearchPage({ holdings, watchlist }) {
  const [q, setQ] = useState("");
  const [market, setMarket] = useState("전체");
  const [plFilter, setPlFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [lossFilter, setLossFilter] = useState("전체");

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
        <p className="text-xs text-zinc-500 mt-1">조건별 보유·관심 종목 조회</p>
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
          <div><label className="text-xs text-zinc-400">시장구분</label>
            <Select value={market} onChange={e => setMarket(e.target.value)}>
              <option>전체</option><option>코스피</option><option>코스닥</option><option>ETF</option><option>해외주식</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">수익/손실</label>
            <Select value={plFilter} onChange={e => setPlFilter(e.target.value)}>
              <option>전체</option><option>수익</option><option>손실</option>
            </Select>
          </div>
          <div><label className="text-xs text-zinc-400">투자상태</label>
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
              <div key={h.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{h.name} <span className="text-[10px] text-zinc-500 font-mono ml-1">{h.code}</span></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{h.market} · {h.status}</div>
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
              <div key={w.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{w.name} <span className="text-[10px] text-zinc-500 font-mono ml-1">{w.code}</span></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{w.reason}</div>
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
