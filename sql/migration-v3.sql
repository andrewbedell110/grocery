-- GRUNDOW v3 Migration: Feedback, Subscriptions, AI Usage, Discount Codes
-- Run this in the Supabase SQL Editor

-- ============================================================
-- FEEDBACK TABLE
-- ============================================================
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) default auth.uid(),
  type text not null check (type in ('bug', 'feature')),
  message text not null,
  status text default 'new' check (status in ('new', 'reviewed', 'resolved')),
  admin_notes text,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

create policy "Users can insert own feedback"
  on feedback for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can view own feedback"
  on feedback for select using (auth.uid() = user_id);

-- Admin can view all (use service role key or add admin check)

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null unique,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  discount_code text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update own subscription"
  on subscriptions for update using (auth.uid() = user_id);

-- ============================================================
-- AI USAGE TRACKING
-- ============================================================
create table if not exists ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  month text not null, -- format: '2026-07'
  query_count int default 0,
  created_at timestamptz default now(),
  unique(user_id, month)
);

alter table ai_usage enable row level security;

create policy "Users can view own usage"
  on ai_usage for select using (auth.uid() = user_id);

create policy "Users can upsert own usage"
  on ai_usage for insert with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on ai_usage for update using (auth.uid() = user_id);

-- ============================================================
-- DISCOUNT CODES
-- ============================================================
create table if not exists discount_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_percent int not null default 100, -- 100 = free
  duration_months int not null default 1,
  max_uses int,
  current_uses int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- No RLS needed - accessed via service role in API route
alter table discount_codes enable row level security;

create policy "Anyone can read active codes"
  on discount_codes for select using (active = true);
