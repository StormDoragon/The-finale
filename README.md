# Liberation OS v0.1

A private, deliberately simple workflow for collecting trends, generating first-pass Facebook posts, manually reviewing them, and marking them ready for publishing.

## Included

- Supabase email/password authentication
- Dashboard counts for trends, drafts, approved posts, and published posts
- Manual trend collection
- A zero-cost local copywriting engine (no external AI service required): it analyzes each trend for its most striking statistic and strongest fact, cleans up messy titles, formats the summary into scannable Facebook-style paragraphs, renders multiple candidate posts per writing style, scores them on hook strength, and always serves the best one first
- One-click regeneration that walks down the ranked list of alternative drafts, even after light manual edits
- A separate editorial voice note that guides review without leaking internal guidance into publishable copy
- Post queue with enforced draft → approved → published transitions and a visible rejected archive
- Facebook Page ID and brand voice settings
- Read-only demo data when Supabase environment variables are absent

## Stack

Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth/Postgres.

## Local setup

Use Node.js 22 or newer.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor. The script is safe to rerun and scopes every row to the account that created it.

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

4. Replace the placeholders in `.env.local` with your Supabase project values. The app reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` first and uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only as a legacy fallback.

5. In Supabase Authentication settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL. Email/password authentication must be enabled.

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000), create an account, and sign in. If email confirmation is enabled in Supabase, confirm the message first.

## Vercel authentication configuration

Vercel must contain the Supabase project URL and publishable key for every environment that should support authentication:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Copy both values from the same Supabase project's **Connect** dialog. Do not copy the example values literally, include quotes, append `/auth/v1`, or paste an entire `NAME=value` assignment into the Vercel value field. Redeploy after changing either variable because `NEXT_PUBLIC_*` values are embedded in the browser bundle at build time. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains available as a legacy fallback.

If Vercel logs `NEXT_PUBLIC_SUPABASE_URL still uses the placeholder Supabase project URL`, the deployment is still using `https://your-project-ref.supabase.co`. Replace that value in **Vercel Project Settings > Environment Variables** with the real Project URL from Supabase, update the publishable key from the same project, and redeploy. Invalid values no longer fail the Next.js build; the deployment starts in read-only demo mode and displays the configuration error on the sign-in page until the variables are corrected.

Authentication runs through the browser Supabase client, so password sign-in, account creation, and confirmation-code exchange do not depend on a Vercel Function reaching Supabase. The SSR proxy validates the resulting access token with `getClaims()` and stores refreshed cookies. If the UI reports `Failed to fetch`, inspect the browser Network panel: a request to an unexpected hostname means `NEXT_PUBLIC_SUPABASE_URL` is wrong, while DNS failures against the correct hostname usually mean the Supabase project is paused, deleted, or unavailable from the user's network.

In Supabase **Authentication > URL Configuration**:

- Set the production Vercel URL as the Site URL.
- Add `https://your-vercel-domain.vercel.app/auth/callback` to Redirect URLs.
- Add preview callback patterns separately if preview deployments need signup confirmation.

Never use a Supabase secret or `service_role` key in a `NEXT_PUBLIC_*` variable.

### Upgrading an existing v0.1 database

Run the current [`supabase/schema.sql`](supabase/schema.sql) again after deploying this version. It replaces the original shared authenticated-user policies with per-account ownership policies. If the project contains exactly one Auth user, existing rows are assigned to that user automatically. If multiple Auth users already exist, assign any legacy rows with a null `owner_id` to the appropriate user in the SQL editor before they can be accessed.

## Product direction

Liberation OS is intentionally a **human-in-the-loop editorial workspace**, not an autonomous publisher. The application should make the small repeatable loop—capture, draft, review, publish—dependable before adding external generation or Facebook API automation. Server actions therefore treat browser form values as untrusted, the database enforces the core workflow invariants, and internal voice guidance stays visibly separate from copy that may be published.

## Quality checks

Run the complete local verification suite with:

```bash
npm run check
```

This runs ESLint, strict TypeScript checking, focused workflow-validation tests, and a production Next.js build.

## First working loop

1. Add a trend on **Trends**. The richer the summary (concrete numbers, short factual sentences), the stronger the generated hook.
2. Select **Generate Facebook draft**. The copy engine analyzes the trend, builds every candidate post for your selected writing style, scores them, and saves the strongest one.
3. Review it in **Post queue**. Brand voice guidance appears as an internal editorial note and is not included in the publishable post text. Use **Regenerate** to step through the next-best ranked drafts.
4. Approve or reject the draft manually.
5. Select **Mark as published** after posting it to Facebook yourself.

### How the copy engine chooses a draft

- The title is normalized first: shouting ALL-CAPS is tamed (common acronyms like AI or NASA are preserved), prefixes such as `BREAKING:` are stripped, and stray punctuation is removed.
- The summary is split into sentences. A sentence that merely repeats the title is dropped, and the rest are grouped into short paragraphs that read well in the Facebook feed.
- The engine looks for the most striking figure (percentages, money, magnitudes like "2 million", multipliers like "3x") and the most concrete sentence. Templates that lead with a statistic only activate when the trend actually contains one.
- Every candidate is scored on hook length (the first ~120 characters are what the mobile feed shows), concreteness, curiosity, and overall word count. The same trend always produces the same best draft, so generation stays transparent and reviewable.

Actual Facebook API publishing and paid model generation are intentionally outside the v0.1 scope.
