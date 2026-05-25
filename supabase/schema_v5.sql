-- ============================================================================
-- v5: 투자 시스템 - 보유/관심/거래/메모/목표/분석
-- Supabase SQL Editor에 통째로 붙여넣고 RUN
-- ============================================================================

-- 보유 종목
create table if not exists inv_holdings (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  name          text not null,
  market        text default '코스피',     -- 코스피/코스닥/ETF/해외주식
  buy_date      date,
  buy_price     numeric not null default 0,
  quantity      int not null default 0,
  current_price numeric not null default 0,
  status        text default '보유',       -- 보유/일부매도/전량매도
  memo          text,
  created_at    timestamptz not null default now()
);

-- 관심 종목
create table if not exists inv_watchlist (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  name          text not null,
  current_price numeric default 0,
  target_buy    numeric default 0,
  target_sell   numeric default 0,
  reason        text,
  checkpoint    text,
  grade         text default '관심',       -- 관심/관찰/매수검토/보류
  reg_date      date default current_date,
  memo          text,
  created_at    timestamptz not null default now()
);

-- 거래 기록
create table if not exists inv_trades (
  id         uuid primary key default gen_random_uuid(),
  date       date not null default current_date,
  name       text not null,
  type       text default '매수',          -- 매수/추가매수/매도/익절/손절
  price      numeric default 0,
  quantity   int default 0,
  amount     numeric default 0,
  reason     text,
  feedback   text,
  learning   text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inv_trades_date on inv_trades(date desc);

-- 투자 메모
create table if not exists inv_memos (
  id         uuid primary key default gen_random_uuid(),
  date       date not null default current_date,
  title      text not null,
  content    text,
  related    text,
  type       text default '아이디어',       -- 아이디어/뉴스/리스크/반성/전략
  priority   text default '중',            -- 상/중/하
  created_at timestamptz not null default now()
);

-- 투자 목표
create table if not exists inv_goals (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  target     bigint default 0,
  current    bigint default 0,
  deadline   date,
  status     text default '진행중',         -- 진행중/달성/중단
  created_at timestamptz not null default now()
);

-- 종목 분석 (code별 1행)
create table if not exists inv_analysis (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  growth          int default 3,
  profit          int default 3,
  stability       int default 3,
  valuation       int default 3,
  dividend        int default 3,
  per             numeric default 0,
  pbr             numeric default 0,
  roe             numeric default 0,
  debt            numeric default 0,
  revenue_growth  numeric default 0,
  op_growth       numeric default 0,
  dividend_yield  numeric default 0,
  issue           text,
  risk            text,
  judgment        text,
  updated_at      timestamptz not null default now()
);

-- RLS
alter table inv_holdings  enable row level security;
alter table inv_watchlist enable row level security;
alter table inv_trades    enable row level security;
alter table inv_memos     enable row level security;
alter table inv_goals     enable row level security;
alter table inv_analysis  enable row level security;

drop policy if exists "public read"  on inv_holdings;
drop policy if exists "public write" on inv_holdings;
drop policy if exists "public read"  on inv_watchlist;
drop policy if exists "public write" on inv_watchlist;
drop policy if exists "public read"  on inv_trades;
drop policy if exists "public write" on inv_trades;
drop policy if exists "public read"  on inv_memos;
drop policy if exists "public write" on inv_memos;
drop policy if exists "public read"  on inv_goals;
drop policy if exists "public write" on inv_goals;
drop policy if exists "public read"  on inv_analysis;
drop policy if exists "public write" on inv_analysis;

create policy "public read"  on inv_holdings  for select using (true);
create policy "public write" on inv_holdings  for all    using (true) with check (true);
create policy "public read"  on inv_watchlist for select using (true);
create policy "public write" on inv_watchlist for all    using (true) with check (true);
create policy "public read"  on inv_trades    for select using (true);
create policy "public write" on inv_trades    for all    using (true) with check (true);
create policy "public read"  on inv_memos     for select using (true);
create policy "public write" on inv_memos     for all    using (true) with check (true);
create policy "public read"  on inv_goals     for select using (true);
create policy "public write" on inv_goals     for all    using (true) with check (true);
create policy "public read"  on inv_analysis  for select using (true);
create policy "public write" on inv_analysis  for all    using (true) with check (true);
