-- ============================================================================
-- v7: 사용자 프로필 + 관리자 권한
-- Supabase SQL Editor에 통째로 붙여넣고 RUN
-- ============================================================================

-- 프로필 테이블 (auth.users 와 1:1)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  role        text not null default 'user',   -- 'user' | 'admin'
  banned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;

drop policy if exists "users read own profile" on profiles;
drop policy if exists "users update own profile" on profiles;
drop policy if exists "admins read all profiles" on profiles;
drop policy if exists "admins update all profiles" on profiles;

-- 본인 프로필 읽기
create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

-- 본인 프로필 수정 (이름 등 — role/banned 는 admin만)
create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- admin은 모든 프로필 읽기
create policy "admins read all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- admin은 모든 프로필 수정
create policy "admins update all profiles"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (true);

-- 가입 시 자동으로 profiles 행 생성 (특정 이메일은 admin 부여)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    case when new.email = '5458579@naver.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 기존 사용자(가입된 사람들)에게도 profiles 행 생성
insert into public.profiles (id, email, name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', ''),
  case when u.email = '5458579@naver.com' then 'admin' else 'user' end
from auth.users u
on conflict (id) do nothing;

-- 5458579@naver.com 이 이미 가입돼있으면 admin 으로 승격
update public.profiles set role = 'admin' where email = '5458579@naver.com';
