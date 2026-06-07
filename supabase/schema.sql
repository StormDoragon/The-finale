-- Liberation OS v0.1 database schema
create extension if not exists "pgcrypto";

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  url text,
  summary text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
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
  facebook_page_id text,
  brand_voice text,
  created_at timestamptz not null default now()
);

alter table public.trends enable row level security;
alter table public.posts enable row level security;
alter table public.settings enable row level security;

-- v0.1 is a private, single-user workspace. Every authenticated user can access its records.
create policy "Authenticated users manage trends" on public.trends for all to authenticated using (true) with check (true);
create policy "Authenticated users manage posts" on public.posts for all to authenticated using (true) with check (true);
create policy "Authenticated users manage settings" on public.settings for all to authenticated using (true) with check (true);
