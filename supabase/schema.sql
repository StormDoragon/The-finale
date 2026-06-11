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
  editorial_note text,
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
  writing_style text default 'educational',
  created_at timestamptz not null default now()
);

-- Make this script safe to apply to databases created with the original v0.1 schema.
alter table public.trends
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.posts
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.settings
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.settings
  add column if not exists writing_style text default 'educational';
alter table public.posts
  add column if not exists editorial_note text;

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

-- Normalize legacy values before applying current workflow invariants.
update public.trends set status = 'new' where status not in ('new', 'used');
update public.posts set status = 'draft'
  where status not in ('draft', 'approved', 'published', 'rejected');

-- Each account has one settings record. Keep the newest legacy record if an
-- earlier deployment allowed duplicates.
with ranked_settings as (
  select id, row_number() over (
    partition by owner_id order by created_at desc, id desc
  ) as row_number
  from public.settings
  where owner_id is not null
)
delete from public.settings
where id in (select id from ranked_settings where row_number > 1);

create unique index if not exists settings_owner_id_unique_idx
  on public.settings(owner_id);

alter table public.trends drop constraint if exists trends_status_check;
alter table public.trends add constraint trends_status_check
  check (status in ('new', 'used'));
alter table public.trends drop constraint if exists trends_title_length_check;
alter table public.trends add constraint trends_title_length_check
  check (char_length(title) between 1 and 200) not valid;
alter table public.trends drop constraint if exists trends_source_length_check;
alter table public.trends add constraint trends_source_length_check
  check (char_length(source) between 1 and 200) not valid;
alter table public.trends drop constraint if exists trends_summary_length_check;
alter table public.trends add constraint trends_summary_length_check
  check (char_length(summary) between 1 and 2000) not valid;
alter table public.trends drop constraint if exists trends_url_length_check;
alter table public.trends add constraint trends_url_length_check
  check (url is null or char_length(url) <= 500) not valid;

alter table public.posts drop constraint if exists posts_content_length_check;
alter table public.posts add constraint posts_content_length_check
  check (char_length(content) between 1 and 5000) not valid;
alter table public.posts drop constraint if exists posts_editorial_note_length_check;
alter table public.posts add constraint posts_editorial_note_length_check
  check (editorial_note is null or char_length(editorial_note) <= 2000) not valid;
alter table public.posts drop constraint if exists posts_platform_check;
alter table public.posts add constraint posts_platform_check
  check (platform = 'facebook') not valid;

alter table public.settings drop constraint if exists settings_page_id_length_check;
alter table public.settings add constraint settings_page_id_length_check
  check (facebook_page_id is null or char_length(facebook_page_id) <= 100) not valid;
alter table public.settings drop constraint if exists settings_brand_voice_length_check;
alter table public.settings add constraint settings_brand_voice_length_check
  check (brand_voice is null or char_length(brand_voice) <= 2000) not valid;

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
