-- ============================================================
-- Grocery Meal Planner - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (auto-created on signup via trigger)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  household_id uuid,
  avatar_url text,
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references profiles(id) on delete set null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

alter table households enable row level security;

-- Add FK from profiles to households (after households exists)
alter table profiles
  add constraint profiles_household_fk
  foreign key (household_id) references households(id) on delete set null;

-- ============================================================
-- RECIPE CATEGORIES
-- ============================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0,
  household_id uuid references households(id) on delete cascade  -- NULL = global default
);

-- Unique on (name, household) — allows same name across households
create unique index categories_name_household_idx
  on categories (name, coalesce(household_id, '00000000-0000-0000-0000-000000000000'));

-- Seed default categories (global)
insert into categories (name, sort_order) values
  ('Breakfast', 1),
  ('Lunch', 2),
  ('Dinner', 3);

-- ============================================================
-- RECIPES
-- ============================================================
create table recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  instructions text,
  image_url text,
  source_url text,
  prep_time int,        -- minutes
  cook_time int,        -- minutes
  servings int default 4,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table recipes enable row level security;

-- ============================================================
-- RECIPE <-> CATEGORY (many-to-many)
-- ============================================================
create table recipe_categories (
  recipe_id uuid references recipes(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (recipe_id, category_id)
);

alter table recipe_categories enable row level security;

-- ============================================================
-- RECIPE INGREDIENTS
-- ============================================================
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,            -- e.g. "all-purpose flour"
  quantity decimal,               -- e.g. 2
  unit text,                      -- e.g. "cups"
  notes text,                     -- e.g. "sifted"
  sort_order int default 0
);

alter table recipe_ingredients enable row level security;

-- ============================================================
-- WEEKLY PLANS
-- ============================================================
create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,       -- always a Sunday
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique (household_id, week_start)
);

alter table weekly_plans enable row level security;

-- ============================================================
-- WEEKLY PLAN <-> RECIPES
-- ============================================================
create table weekly_plan_recipes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references weekly_plans(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  day_of_week int,               -- 0=Sun..6=Sat, null = unassigned
  meal_type text,                -- breakfast/lunch/dinner
  sort_order int default 0
);

alter table weekly_plan_recipes enable row level security;

-- ============================================================
-- SHOPPING LIST (generated from plan)
-- ============================================================
create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references weekly_plans(id) on delete cascade,
  ingredient_name text not null,
  quantity decimal,
  unit text,
  already_have boolean default false,
  kroger_product_id text,         -- matched Kroger SKU
  kroger_price decimal,
  added_to_cart boolean default false,
  created_at timestamptz default now()
);

alter table shopping_list_items enable row level security;

-- ============================================================
-- RECIPE PAIRINGS (self-join many-to-many)
-- ============================================================
create table recipe_pairings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  paired_recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique (recipe_id, paired_recipe_id)
);

alter table recipe_pairings enable row level security;

-- ============================================================
-- RECIPE LIKES (social)
-- ============================================================
create table recipe_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, recipe_id)
);

alter table recipe_likes enable row level security;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles: users see own profile + household members
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view household members"
  on profiles for select using (
    household_id in (select household_id from profiles where id = auth.uid())
  );

-- Households: members can view, owner can update
create policy "Members can view household"
  on households for select using (
    id in (select household_id from profiles where id = auth.uid())
  );

create policy "Owner can update household"
  on households for update using (owner_id = auth.uid());

create policy "Authenticated users can create households"
  on households for insert with check (auth.uid() is not null);

-- Recipes: household members have full access
create policy "Household members can view recipes"
  on recipes for select using (
    household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Household members can insert recipes"
  on recipes for insert with check (
    household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Household members can update recipes"
  on recipes for update using (
    household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Household members can delete recipes"
  on recipes for delete using (
    household_id in (select household_id from profiles where id = auth.uid())
  );

-- Recipe categories: follow recipe access
create policy "Household members can manage recipe categories"
  on recipe_categories for all using (
    recipe_id in (
      select id from recipes where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

-- Recipe ingredients: follow recipe access
create policy "Household members can manage recipe ingredients"
  on recipe_ingredients for all using (
    recipe_id in (
      select id from recipes where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

-- Weekly plans: household access
create policy "Household members can manage weekly plans"
  on weekly_plans for all using (
    household_id in (select household_id from profiles where id = auth.uid())
  );

-- Weekly plan recipes: follow plan access
create policy "Household members can manage plan recipes"
  on weekly_plan_recipes for all using (
    plan_id in (
      select id from weekly_plans where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

-- Shopping list: follow plan access
create policy "Household members can manage shopping list"
  on shopping_list_items for all using (
    plan_id in (
      select id from weekly_plans where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );


-- ============================================================
-- SOCIAL: Make public recipes viewable
-- ============================================================
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

-- Recipe pairings
create policy "Household members can manage recipe pairings"
  on recipe_pairings for all using (
    recipe_id in (
      select id from recipes where household_id in (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

-- Recipe likes
create policy "Users can manage own likes"
  on recipe_likes for all using (user_id = auth.uid());

create policy "Anyone can view likes"
  on recipe_likes for select using (true);

-- Categories: view global + own household tags
create policy "View global and household categories"
  on categories for select using (
    household_id is null
    or household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Insert household categories"
  on categories for insert with check (
    household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Delete household categories"
  on categories for delete using (
    household_id is not null
    and household_id in (select household_id from profiles where id = auth.uid())
  );

-- Public profiles & recipes
create policy "View public profiles"
  on profiles for select using (is_public = true);

create policy "View public recipes"
  on recipes for select using (
    created_by in (select id from profiles where is_public = true)
  );
