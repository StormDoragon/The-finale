# Liberation OS v0.1

A private, deliberately simple workflow for collecting trends, generating first-pass Facebook posts, manually reviewing them, and marking them ready for publishing.

## Included

- Supabase email/password authentication
- Dashboard counts for trends, drafts, approved posts, and published posts
- Manual trend collection
- Deterministic first-draft generation from a trend (no external AI service required)
- Post queue with approve, reject, and mark-as-published actions
- Facebook Page ID and brand voice settings
- Read-only demo data when Supabase environment variables are absent

## Stack

Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth/Postgres.

## Local setup

Use Node.js 22 or newer.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`. Legacy projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development and set it to the canonical deployment URL in production.

5. In Supabase Authentication settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL. Email/password authentication must be enabled.

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000), create an account, and sign in. If email confirmation is enabled in Supabase, confirm the message first.

## Vercel authentication configuration

Set these variables for every Vercel environment that should support authentication, then redeploy so the new values are included in the deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy)
- `NEXT_PUBLIC_SITE_URL` (the canonical `https://...` deployment URL)

Login and signup use server actions, so Supabase requests and `[auth]` diagnostics appear in Vercel function logs rather than as direct Supabase requests in the browser Network tab. Never use a Supabase secret or `service_role` key for these variables.

## First working loop

1. Add a trend on **Trends**.
2. Select **Generate Facebook draft**. v0.1 creates a transparent, deterministic draft from the trend title and summary.
3. Review it in **Post queue**.
4. Approve or reject the draft manually.
5. Select **Mark as published** after posting it to Facebook yourself.

Actual Facebook API publishing and AI model generation are intentionally outside the v0.1 scope.
