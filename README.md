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

4. Replace the placeholders in `.env.local` with your Supabase project values. The app reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` first and uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only as a legacy fallback. For local development, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

5. In Supabase Authentication settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL. Email/password authentication must be enabled.

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000), create an account, and sign in. If email confirmation is enabled in Supabase, confirm the message first.

## Vercel authentication configuration

Vercel must contain all three of these variables for every environment that should support authentication:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://fpmxkuayicgaiisipglv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_9vA3m-xJUCCzQCH-B1AEvw_1tNsCJMt
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Replace `NEXT_PUBLIC_SITE_URL` with the canonical URL of the corresponding Vercel environment. Do not set `NEXT_PUBLIC_SUPABASE_URL` to an example or placeholder project URL. After saving the variables, redeploy so Next.js includes them in the deployment. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported only as a legacy fallback when the publishable key is absent.

Login and signup use server actions, so Supabase requests and `[auth]` diagnostics appear in Vercel function logs rather than as direct Supabase requests in the browser Network tab. The Vercel logs should report `supabaseHost: 'fpmxkuayicgaiisipglv.supabase.co'` and `keySource: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'`. Never use a Supabase secret or `service_role` key for these variables.

## First working loop

1. Add a trend on **Trends**.
2. Select **Generate Facebook draft**. v0.1 creates a transparent, deterministic draft from the trend title and summary.
3. Review it in **Post queue**.
4. Approve or reject the draft manually.
5. Select **Mark as published** after posting it to Facebook yourself.

Actual Facebook API publishing and AI model generation are intentionally outside the v0.1 scope.
