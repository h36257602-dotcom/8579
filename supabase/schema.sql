-- ============================================================================
-- Life Dashboard 스키마
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣고 RUN
-- ============================================================================

-- 목표 (Goals)
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text,                  -- 예: 건강, 재무, 커리어, 학습
  target_date date,
  status      text not null default 'active',  -- active | done | paused
  created_at  timestamptz not null default now()
);

-- 습관 (Habits)
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text,
  frequency   text not null default 'daily',   -- daily | weekly
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 일일 체크 로그
create table if not exists habit_logs (
  id        uuid primary key default gen_random_uuid(),
  habit_id  uuid not null references habits(id) on delete cascade,
  date      date not null,
  done      boolean not null default true,
  note      text,
  unique (habit_id, date)
);

create index if not exists idx_habit_logs_date on habit_logs(date);

-- RLS: 누구나 읽기, 쓰기는 일단 허용 (수정은 앱 단의 admin 비밀번호로 막음)
-- 추후 Supabase Auth 도입 시 정책 강화
alter table goals      enable row level security;
alter table habits     enable row level security;
alter table habit_logs enable row level security;

drop policy if exists "public read" on goals;
drop policy if exists "public write" on goals;
create policy "public read"  on goals      for select using (true);
create policy "public write" on goals      for all    using (true) with check (true);

drop policy if exists "public read" on habits;
drop policy if exists "public write" on habits;
create policy "public read"  on habits     for select using (true);
create policy "public write" on habits     for all    using (true) with check (true);

drop policy if exists "public read" on habit_logs;
drop policy if exists "public write" on habit_logs;
create policy "public read"  on habit_logs for select using (true);
create policy "public write" on habit_logs for all    using (true) with check (true);
