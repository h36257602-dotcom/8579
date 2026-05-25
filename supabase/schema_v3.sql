-- ============================================================================
-- v3: 업무 / 여행 테이블
-- Supabase SQL Editor에 붙여넣고 RUN
-- ============================================================================

-- 업무 (할 일, 프로젝트)
create table if not exists work_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  project     text,                       -- 프로젝트/카테고리명
  status      text not null default 'todo',  -- todo | doing | done
  priority    text default 'normal',      -- low | normal | high
  due_date    date,
  note        text,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_work_status on work_items(status);

-- 여행
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  destination text,                       -- 목적지
  start_date  date,
  end_date    date,
  status      text not null default 'planned',  -- planned | done | cancelled
  budget      bigint default 0,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_trips_start on trips(start_date desc);

-- RLS
alter table work_items enable row level security;
alter table trips      enable row level security;

drop policy if exists "public read"  on work_items;
drop policy if exists "public write" on work_items;
drop policy if exists "public read"  on trips;
drop policy if exists "public write" on trips;

create policy "public read"  on work_items for select using (true);
create policy "public write" on work_items for all    using (true) with check (true);
create policy "public read"  on trips      for select using (true);
create policy "public write" on trips      for all    using (true) with check (true);
