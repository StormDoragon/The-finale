-- Liberation OS is now a read-only monitoring dashboard for Facebook pages.
-- Page access tokens are stored here and are only ever read on the server
-- with the service-role key. RLS is enabled with NO policies on purpose:
-- the anon/publishable key used by the browser can never read a token.
create table if not exists public.page_tokens (
  id uuid default gen_random_uuid() primary key,
  page_id text not null unique,
  page_name text,
  access_token text not null,
  created_at timestamp default now()
);

alter table public.page_tokens enable row level security;

-- The content pipeline (trend capture, drafting, the post queue) moved out of
-- Liberation OS. Its tables are intentionally left in place so no data is
-- destroyed by this migration; drop them manually once anything worth keeping
-- has been archived:
--   drop table if exists public.posts;
--   drop table if exists public.trends;
--   drop table if exists public.settings;
