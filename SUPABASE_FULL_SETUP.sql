-- ============================================================
-- DAISY — FULL SUPABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text default 'Wanderer',
  created_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  emotion text default 'neutral',
  theme text default 'general',
  created_at timestamptz default now()
);

create table if not exists conversation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  log_date date,
  messages jsonb not null default '[]',
  summary text,
  message_count int default 0,
  updated_at timestamptz,
  created_at timestamptz default now(),
  constraint conversation_logs_user_date unique (user_id, log_date)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  subscription text not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ── RLS ─────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table memories enable row level security;
alter table conversation_logs enable row level security;
alter table push_subscriptions enable row level security;

-- Drop old policies first to avoid conflicts
drop policy if exists "Users read own profile" on profiles;
drop policy if exists "Users insert own profile" on profiles;
drop policy if exists "Users update own profile" on profiles;
drop policy if exists "Users delete own profile" on profiles;

drop policy if exists "Users read own memories" on memories;
drop policy if exists "Users insert own memories" on memories;
drop policy if exists "Users delete own memories" on memories;

drop policy if exists "Users read own logs" on conversation_logs;
drop policy if exists "Users insert own logs" on conversation_logs;
drop policy if exists "Users update own logs" on conversation_logs;
drop policy if exists "Users delete own logs" on conversation_logs;

drop policy if exists "Users manage own push sub" on push_subscriptions;

-- Profiles
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users delete own profile" on profiles for delete using (auth.uid() = id);

-- Memories
create policy "Users read own memories"   on memories for select using (auth.uid() = user_id);
create policy "Users insert own memories" on memories for insert with check (auth.uid() = user_id);
create policy "Users delete own memories" on memories for delete using (auth.uid() = user_id);

-- Conversation logs
create policy "Users read own logs"   on conversation_logs for select using (auth.uid() = user_id);
create policy "Users insert own logs" on conversation_logs for insert with check (auth.uid() = user_id);
create policy "Users update own logs" on conversation_logs for update using (auth.uid() = user_id);
create policy "Users delete own logs" on conversation_logs for delete using (auth.uid() = user_id);

-- Push subscriptions
create policy "Users manage own push sub" on push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Wanderer'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Backfill any existing users missing a profile ───────────

insert into public.profiles (id, name)
select id, coalesce(raw_user_meta_data->>'name', 'Wanderer')
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

