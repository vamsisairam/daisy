-- Run this in Supabase SQL Editor

-- Push subscriptions table for notifications
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  subscription text not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own push sub"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
