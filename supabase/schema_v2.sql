-- ============================================================================
-- v2: 자산 / 취미 / 특기 / 일기 테이블
-- Supabase SQL Editor에 붙여넣고 RUN
-- ============================================================================

-- 자산 (현금, 부동산, 코인 등 모든 자산 항목)
create table if not exists assets (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text,                  -- 예: 현금, 예금, 부동산, 코인, 기타
  amount     bigint not null default 0,  -- 원 단위
  note       text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 취미
create table if not exists hobbies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  started_at  date,                  -- 시작한 시기
  level       text,                  -- 입문/초급/중급/고급
  created_at  timestamptz not null default now()
);

-- 특기
create table if not exists skills (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  level       int default 3,         -- 1~5
  category    text,
  created_at  timestamptz not null default now()
);

-- 일기
create table if not exists diary (
  id         uuid primary key default gen_random_uuid(),
  date       date not null default current_date,
  title      text,
  content    text not null,
  mood       text,                   -- 좋음/보통/나쁨 등 자유
  created_at timestamptz not null default now()
);

create index if not exists idx_diary_date on diary(date desc);

-- RLS: 공개 읽기, 일단 공개 쓰기 (관리자 페이지로만 접근하므로 실질 보호)
alter table assets  enable row level security;
alter table hobbies enable row level security;
alter table skills  enable row level security;
alter table diary   enable row level security;

drop policy if exists "public read"  on assets;
drop policy if exists "public write" on assets;
drop policy if exists "public read"  on hobbies;
drop policy if exists "public write" on hobbies;
drop policy if exists "public read"  on skills;
drop policy if exists "public write" on skills;
drop policy if exists "public read"  on diary;
drop policy if exists "public write" on diary;

create policy "public read"  on assets  for select using (true);
create policy "public write" on assets  for all    using (true) with check (true);
create policy "public read"  on hobbies for select using (true);
create policy "public write" on hobbies for all    using (true) with check (true);
create policy "public read"  on skills  for select using (true);
create policy "public write" on skills  for all    using (true) with check (true);
create policy "public read"  on diary   for select using (true);
create policy "public write" on diary   for all    using (true) with check (true);
