-- Liberation OS v0.1 database schema
create extension if not exists "pgcrypto";

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  source text not null,
  url text,
  summary text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trend_id uuid references public.trends(id) on delete set null,
  platform text not null default 'facebook',
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  published_at timestamptz
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  facebook_page_id text,
  brand_voice text,
  created_at timestamptz not null default now()
);

-- Make this script safe to apply to databases created with the original v0.1 schema.
alter table public.trends
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.posts
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.settings
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- A legacy single-user workspace can be migrated without losing access to its rows.
-- If multiple users already exist, unowned legacy rows remain inaccessible until an
-- administrator explicitly assigns them to the correct owner.
do $$
declare
  sole_user_id uuid;
begin
  if (select count(*) from auth.users) = 1 then
    select id into sole_user_id from auth.users limit 1;
  end if;

  if sole_user_id is not null then
    update public.trends set owner_id = sole_user_id where owner_id is null;
    update public.posts set owner_id = sole_user_id where owner_id is null;
    update public.settings set owner_id = sole_user_id where owner_id is null;
  end if;
end
$$;

create index if not exists trends_owner_id_idx on public.trends(owner_id);
create index if not exists posts_owner_id_idx on public.posts(owner_id);
create index if not exists settings_owner_id_idx on public.settings(owner_id);

alter table public.trends enable row level security;
alter table public.posts enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Authenticated users manage trends" on public.trends;
drop policy if exists "Authenticated users manage posts" on public.posts;
drop policy if exists "Authenticated users manage settings" on public.settings;
drop policy if exists "Users manage their own trends" on public.trends;
drop policy if exists "Users manage their own posts" on public.posts;
drop policy if exists "Users manage their own settings" on public.settings;

create policy "Users manage their own trends"
  on public.trends for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users manage their own posts"
  on public.posts for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users manage their own settings"
  on public.settings for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
