-- ============================================================================
-- v4: 운동 (Athlete Performance System)
-- Supabase SQL Editor에 붙여넣고 RUN
-- ============================================================================

-- 운동 기록
create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  category    text not null,           -- 웨이트/러닝/크로스핏/등산/사이클/수영/격투기/스트레칭/재활/자유
  name        text not null,           -- 운동명 (예: 벤치프레스)
  body_part   text,                    -- 가슴/등/하체/어깨/팔/코어/전신
  sets        int default 0,
  reps        int default 0,
  weight      numeric default 0,       -- kg
  duration    int default 0,           -- 분
  distance    numeric default 0,       -- km (러닝/사이클용)
  calories    int default 0,
  rpe         int,                     -- 운동 강도 1~10
  condition   text,                    -- 좋음/보통/나쁨
  memo        text,
  xp          int not null default 0,
  is_pr       boolean default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_workouts_date on workouts(date desc);

-- 신체 측정
create table if not exists body_metrics (
  id              uuid primary key default gen_random_uuid(),
  date            date not null default current_date,
  weight          numeric,             -- 체중 kg
  body_fat        numeric,             -- 체지방률 %
  muscle_mass     numeric,             -- 골격근량 kg
  bmi             numeric,
  sleep_score     int,                 -- 0-100
  condition_score int,                 -- 0-100
  note            text,
  created_at      timestamptz not null default now(),
  unique (date)
);

create index if not exists idx_body_date on body_metrics(date desc);

-- 피트니스 프로필 (단일 행)
create table if not exists fitness_profile (
  id                uuid primary key default gen_random_uuid(),
  nickname          text default 'Athlete',
  sport             text,
  total_xp          bigint not null default 0,
  streak_days       int not null default 0,
  last_workout_date date,
  updated_at        timestamptz not null default now()
);

-- 1행 초기화 (이미 있으면 무시)
insert into fitness_profile (nickname, sport)
select 'Athlete', '종합'
where not exists (select 1 from fitness_profile);

-- 성취/배지
create table if not exists achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text,
  icon        text,                    -- emoji
  earned_at   timestamptz not null default now()
);

-- RLS
alter table workouts        enable row level security;
alter table body_metrics    enable row level security;
alter table fitness_profile enable row level security;
alter table achievements    enable row level security;

drop policy if exists "public read"  on workouts;
drop policy if exists "public write" on workouts;
drop policy if exists "public read"  on body_metrics;
drop policy if exists "public write" on body_metrics;
drop policy if exists "public read"  on fitness_profile;
drop policy if exists "public write" on fitness_profile;
drop policy if exists "public read"  on achievements;
drop policy if exists "public write" on achievements;

create policy "public read"  on workouts        for select using (true);
create policy "public write" on workouts        for all    using (true) with check (true);
create policy "public read"  on body_metrics    for select using (true);
create policy "public write" on body_metrics    for all    using (true) with check (true);
create policy "public read"  on fitness_profile for select using (true);
create policy "public write" on fitness_profile for all    using (true) with check (true);
create policy "public read"  on achievements    for select using (true);
create policy "public write" on achievements    for all    using (true) with check (true);
