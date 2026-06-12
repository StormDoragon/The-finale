-- Liberation OS database schema
--
-- The app is a monitoring dashboard for Facebook pages: the only state it
-- stores is the set of connected pages and their access tokens. Sign-in is
-- handled by Supabase Auth.
create extension if not exists "pgcrypto";

-- Page access tokens are read exclusively on the server with the
-- service-role key. RLS is enabled with NO policies on purpose: the
-- anon/publishable key used by the browser can never read a token.
create table if not exists public.page_tokens (
  id uuid default gen_random_uuid() primary key,
  page_id text not null unique,
  page_name text,
  access_token text not null,
  created_at timestamp default now()
);

alter table public.page_tokens enable row level security;

-- Databases created for Liberation OS v0.1 also contain trends, posts, and
-- settings tables from the retired content pipeline. They are no longer used;
-- drop them manually once anything worth keeping has been archived:
--   drop table if exists public.posts;
--   drop table if exists public.trends;
--   drop table if exists public.settings;
