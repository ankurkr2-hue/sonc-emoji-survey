# Special Olympics NC — Emoji Survey

A participant feedback survey for Special Olympics NC events. Participants scan a QR code, select their role, answer emoji questions, and submit. The data manager views live results on the admin dashboard and in Supabase.

---

## How it works

**Participants:** Scan QR code → select role (Athlete / Volunteer / Unified Partner / Other) → answer 3 emoji questions → optional open feedback → tap Submit. Done in under a minute. The kiosk auto-resets 5 seconds after each submission so the next participant can go right away.

**Data manager:** Open the admin dashboard → see live counts, scores, per-question breakdowns, and role breakdown → QR code is shown on the page ready to display → export CSV anytime.

---

## Setup (one time)

### 1 — Install dependencies
```
npm install
```

### 2 — Set up Supabase
1. Create a free account at supabase.com
2. Create a new project
3. Go to SQL Editor and run each statement in schema.sql one at a time
4. Go to Project Settings → API and copy: Project URL, anon key, service_role key

### 3 — Create .env.local in the project root
```
ADMIN_SECRET=choose-a-strong-password
DB_BACKEND=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Finding these in Supabase:** Go to your project → Settings → API.
> - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
> - `anon` / `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> - `service_role` / `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 4 — Deploy to Vercel (recommended — gives a public URL for QR codes)
1. Push code to GitHub
2. Go to vercel.com → New Project → import your repo
3. Add all 5 environment variables in the Vercel dashboard
4. Deploy — you get a URL like https://sonc-survey.vercel.app

### 4b — OR run locally (same WiFi network only)
```
npm run dev
```

---

## Your URLs

| Page | URL |
|---|---|
| Survey (participants) | https://your-domain.com/survey/00000000-0000-0000-0000-000000000001 |
| Admin dashboard | https://your-domain.com/admin/00000000-0000-0000-0000-000000000001 |

The admin page shows a QR code — display it on a screen or print it at the event.

---

## At the event

1. Open the admin dashboard on your device
2. The QR code at the top points to the participant survey
3. Show it on a screen, projector, or printed sheet
4. Participants scan and submit throughout the event
5. Refresh the admin page to see live results
6. Click Export CSV after the event to download everything

---

## Viewing data in Supabase

- **Table Editor → responses**: one row per participant with role, score, feedback, and timestamp
- **Table Editor → answers**: one row per question per participant (value 1–5, where 5=Amazing, 1=Poor)
- **SQL Editor**: run custom queries

Useful query — average score by day:
```sql
select date(submitted_at) as day, round(avg(score)) as avg_score, count(*) as responses
from responses group by day order by day desc;
```

Useful query — emoji breakdown per question:
```sql
select q.text as question, a.value, count(*) as count
from answers a join questions q on q.id = a.question_id
group by q.text, a.value order by q.text, a.value desc;
```

Useful query — responses by role:
```sql
select role, count(*) as responses, round(avg(score)) as avg_score
from responses group by role order by responses desc;
```

---

## Admin password

Change ADMIN_SECRET in .env.local (or Vercel environment variables) and restart.

## Adding/removing questions

Log into the admin dashboard and use the Add Question field. Changes take effect immediately.
