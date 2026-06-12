# Liberation OS

A dashboard and monitoring tool for Facebook pages. Liberation OS no longer creates or publishes content — the content pipeline (trend research, drafting, publishing, and status tracking) is handled outside the app. What remains is a focused, read-only window into how your pages are performing, powered live by the Facebook Graph API.

## Features

- **Dashboard** (`/dashboard`) — total followers, 7/30-day reach, 7-day engagements, posts published, engagement rate, and follower growth across all connected pages, plus the top-performing post of the week.
- **Pages** (`/dashboard/pages`) — every connected page with profile picture, category, and follower count. Click into a page for:
  - **Overview** — 30-day follower, reach, and engagement charts.
  - **Posts** — the last 20 published posts with likes, comments, shares, reach, type, and published status.
  - **Insights** — best posting hours and days (by average engagement), top post formats, and audience demographics when Facebook provides them.
- **Posts** (`/dashboard/posts`) — a global feed across all pages with filters (page, date range, post type) and sorting (date, reach, engagement).
- **Monetization** (`/dashboard/monetization`) — progress bars toward Meta's thresholds (10,000 followers; 600,000 reel plays in 60 days, approximated from daily video views) with estimated days to target and an in-stream ads eligibility estimate.
- **Settings** (`/dashboard/settings`) — connect/remove pages and store their access tokens. Each token is verified against the Graph API before saving and re-checked on every visit, so expired tokens are flagged immediately.

Every data-fetching view has loading skeletons, renders an empty state with a refresh action when the Graph API fails, and surfaces per-page issues (like expired tokens) in a banner instead of crashing.

## Stack

Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Recharts, and Supabase (Auth + Postgres). Deployed on Vercel. All Graph API calls run server-side against `https://graph.facebook.com/v19.0`; tokens never reach the browser.

## Local setup

Use Node.js 22 or newer.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor. It creates the `page_tokens` table with row level security enabled and **no policies** — only the service-role key (server-side) can read tokens.

3. Copy the environment template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser auth key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` works as a legacy fallback) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only; required to store and read page access tokens. Never expose it in the browser. |

4. In Supabase Authentication settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL. Email/password authentication must be enabled.

5. Start the app, sign in, and connect a page:

   ```bash
   npm run dev
   ```

## Connecting a Facebook page

Settings asks for two values per page:

- **Page ID** — the numeric ID of the Facebook page.
- **Page access token** — a long-lived Page access token. Generate one with the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) (or a System User in Business Manager) using a user token with `pages_read_engagement` and `read_insights`, then exchange it for the page token. The token is validated against the page before it is stored, and the page name is fetched automatically.

Tokens are stored in the `page_tokens` table and only ever read on the server. The Settings page shows a live health badge per token and flags expired tokens.

## Vercel configuration

Set the three environment variables above for every environment. Copy the URL and publishable key from the same Supabase project's **Connect** dialog — do not paste placeholders, quotes, or whole `NAME=value` assignments — and redeploy after changing either `NEXT_PUBLIC_*` value, because they are embedded in the browser bundle at build time. `SUPABASE_SERVICE_ROLE_KEY` comes from **Project Settings → API keys** and must never be prefixed with `NEXT_PUBLIC_`.

In Supabase **Authentication → URL Configuration**, set the production Vercel URL as the Site URL and add `https://your-vercel-domain.vercel.app/auth/callback` to Redirect URLs.

If sign-in reports `Failed to fetch`, inspect the browser Network panel: a request to an unexpected hostname means `NEXT_PUBLIC_SUPABASE_URL` is wrong, while DNS failures against the correct hostname usually mean the Supabase project is paused, deleted, or unreachable.

## Upgrading from v0.1

Run the current [`supabase/schema.sql`](supabase/schema.sql) (or the migration in `supabase/migrations/`) to create `page_tokens`. The retired content-pipeline tables (`trends`, `posts`, `settings`) are left in place so no data is destroyed; drop them manually once anything worth keeping has been archived. The old `/trends`, `/queue`, and `/settings` routes redirect to their dashboard equivalents.

## Quality checks

```bash
npm run check
```

This runs ESLint, strict TypeScript checking, the node test suite (validation and Graph-analysis helpers), and a production Next.js build.
