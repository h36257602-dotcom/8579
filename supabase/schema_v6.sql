-- ============================================================================
-- v6: 여행 상세 기록 — 일자별 장소/지출/후기
-- Supabase SQL Editor에 통째로 붙여넣고 RUN
-- ============================================================================

-- 일자별 기록 (한줄 후기 + 기분)
create table if not exists trip_days (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  date       date not null,
  one_liner  text,                  -- 한줄 후기
  mood       text,                  -- 최고/좋음/보통/별로/최악
  note       text,
  created_at timestamptz not null default now(),
  unique (trip_id, date)
);

create index if not exists idx_trip_days_trip on trip_days(trip_id, date);

-- 방문 장소
create table if not exists trip_places (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  date       date not null,
  time       text,                  -- "14:30" 같은 문자열
  name       text not null,
  category   text,                  -- 명소/식당/카페/숙소/쇼핑/교통/기타
  rating     int,                   -- 1~5
  note       text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_places_trip on trip_places(trip_id, date, time);

-- 지출
create table if not exists trip_expenses (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  date       date,
  category   text,                  -- 항공/숙소/식사/교통/관광/쇼핑/기타
  item       text not null,
  amount     bigint default 0,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_expenses_trip on trip_expenses(trip_id, date);

-- RLS
alter table trip_days     enable row level security;
alter table trip_places   enable row level security;
alter table trip_expenses enable row level security;

drop policy if exists "public read"  on trip_days;
drop policy if exists "public write" on trip_days;
drop policy if exists "public read"  on trip_places;
drop policy if exists "public write" on trip_places;
drop policy if exists "public read"  on trip_expenses;
drop policy if exists "public write" on trip_expenses;

create policy "public read"  on trip_days     for select using (true);
create policy "public write" on trip_days     for all    using (true) with check (true);
create policy "public read"  on trip_places   for select using (true);
create policy "public write" on trip_places   for all    using (true) with check (true);
create policy "public read"  on trip_expenses for select using (true);
create policy "public write" on trip_expenses for all    using (true) with check (true);
