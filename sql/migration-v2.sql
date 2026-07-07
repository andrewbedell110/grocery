-- ============================================================
-- MealMap v2 Migration
-- Run this in the Supabase SQL Editor after initial schema.sql
-- ============================================================

-- Recipe Pairings
create table if not exists recipe_pairings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  paired_recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique (recipe_id, paired_recipe_id)
);

alter table recipe_pairings enable row level security;

create policy "Household members can manage recipe pairings"
  on recipe_pairings for all using (
    recipe_id in (
      select id from recipes where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

-- Social: Profile extensions
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists is_public boolean default false;

-- Social: Recipe Likes
create table if not exists recipe_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, recipe_id)
);

alter table recipe_likes enable row level security;

create policy "Users can manage own likes"
  on recipe_likes for all using (user_id = auth.uid());

create policy "Anyone can view likes"
  on recipe_likes for select using (true);

-- Allow viewing recipes from public profiles
create policy "View public recipes"
  on recipes for select using (
    created_by in (
      select id from profiles where is_public = true
    )
  );

-- Allow viewing public profiles
create policy "View public profiles"
  on profiles for select using (is_public = true);

-- Update handle_new_user to set search_path
create or replace function handle_new_user()
returns trigger as $$
begin
  set search_path = public;
  insert into profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer
set search_path = public;
