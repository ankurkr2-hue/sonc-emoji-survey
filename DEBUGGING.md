# Debugging Guide — SONC Emoji Survey

If something isn't working, copy the prompt below and paste it into Claude (claude.ai), ChatGPT, or any AI coding assistant. Fill in the `[DESCRIBE YOUR ERROR HERE]` section, then send it. The AI will have full context to help you fix it.

---

## AI Debugging Prompt (copy everything below this line)

---

I need help debugging a Next.js web app. Here is the full context:

**What the app is:**
A participant feedback survey for Special Olympics North Carolina events. Participants scan a QR code → select their role → answer 3 emoji questions → optional text feedback → submit. A data manager views live results on a password-protected admin dashboard. Data is stored in Supabase (PostgreSQL).

**Tech stack:**
- Next.js (App Router, TypeScript) deployed on Vercel
- Supabase as the database (PostgreSQL, accessed server-side with the service role key)
- `react-qr-code` for the QR code on the admin page
- No authentication library — admin is protected by a plain password stored in `ADMIN_SECRET` env var checked via sessionStorage

**Database schema (Supabase):**
```sql
create table surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  text text not null,
  display_order int default 0
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  anonymous_user_id text not null,
  role text,
  feedback text,
  score int,
  submitted_at timestamptz default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references responses(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  value int check (value between 1 and 5)
);
```

The seed survey ID is always: `00000000-0000-0000-0000-000000000001`

**Environment variables (set in Vercel dashboard or .env.local):**
```
ADMIN_SECRET=your-admin-password
DB_BACKEND=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Key URLs:**
- Survey (participants): `/survey/00000000-0000-0000-0000-000000000001`
- Admin dashboard: `/admin/00000000-0000-0000-0000-000000000001`
- API routes: `POST /api/responses`, `GET /api/survey/[surveyId]`, `GET /api/admin/[surveyId]/analytics`, `GET /api/admin/[surveyId]/responses`

**File structure:**
```
src/
  app/
    survey/[surveyId]/page.tsx     ← participant survey UI
    admin/[surveyId]/page.tsx      ← admin dashboard UI
    api/
      responses/route.ts           ← POST: submit a survey response
      survey/[surveyId]/route.ts   ← GET: load survey + questions
      admin/[surveyId]/
        analytics/route.ts         ← GET: stats for dashboard
        responses/route.ts         ← GET: full response table
      questions/route.ts           ← POST: add a question
      questions/[id]/route.ts      ← DELETE: remove a question
  lib/
    db/
      index.ts      ← picks supabase or excel backend from DB_BACKEND env var
      interface.ts  ← TypeScript interface all backends must satisfy
      supabase.ts   ← Supabase implementation (lazily initialized client)
      excel.ts      ← local Excel fallback (not used in production)
      types.ts      ← shared TypeScript types
public/
  logo.png           ← Special Olympics NC logo
next.config.ts       ← serverExternalPackages: ['xlsx', '@supabase/supabase-js']
schema.sql           ← full Supabase setup SQL
```

**Important implementation details:**
- The Supabase client is lazily initialized (created on first use, not at module load) to avoid crashes when env vars aren't set
- `DB_BACKEND=supabase` routes all DB calls through `src/lib/db/supabase.ts`; `DB_BACKEND=excel` uses a local `.xlsx` file
- Score is calculated server-side: `Math.round((sum of answer values / max possible) * 100)`
- The survey kiosk auto-resets 5 seconds after submission via `window.location.reload()`
- Admin password is stored in `sessionStorage` (key: `admin_authed`) as `"true"` after the user enters the correct `ADMIN_SECRET`
- No 24-hour resubmission block — anyone can submit multiple times (kiosk design)
- `next.config.ts` uses `serverExternalPackages` (not the old webpack `externals`) because this project is on Next.js 15+

**GitHub repo (read the full source code here):**
https://github.com/ankurkr2-hue/sonc-emoji-survey

---

**My error:**

[DESCRIBE YOUR ERROR HERE — paste the exact error message, which page/URL it happens on, and what you were doing when it occurred. If it's a Vercel deployment error, paste the build log. If it's a browser error, paste what the browser console says.]

---

Please help me fix this. The repo is public so you can read any file you need.
