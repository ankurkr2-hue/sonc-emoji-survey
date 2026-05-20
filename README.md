# Emoji Survey

A simple emoji-based survey web app built with Next.js and TypeScript.
Data is stored in a local Excel file by default — no cloud setup required.
Switch to Supabase (or any other backend) by implementing `src/lib/db/supabase.ts`.

## Quick start

1. **Clone / download** this folder.
2. **Install dependencies**
   npm install
3. **Create `.env.local`**
   Copy `.env.example` to `.env.local` and set `ADMIN_SECRET=yourpassword`.
4. **Run**
   npm run dev
5. Open `http://localhost:3000` — you will be redirected to the seeded survey.
6. Admin dashboard: `http://localhost:3000/admin/<surveyId>`

The survey ID is printed in `data/survey-data.xlsx` (Surveys sheet) after first run.
It also appears in the URL when you visit the home page.

## Environment variables

| Variable | Default | Required |
|---|---|---|
| `DB_BACKEND` | `excel` | No |
| `EXCEL_DATA_PATH` | `./data/survey-data.xlsx` | No |
| `ADMIN_SECRET` | — | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Only for Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Only for Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Only for Supabase |

## Switching to Supabase

1. Create a Supabase project at supabase.com.
2. Paste `schema.sql` into the Supabase SQL editor and run it.
3. Add Supabase env vars to `.env.local`.
4. Set `DB_BACKEND=supabase` in `.env.local`.
5. Implement `src/lib/db/supabase.ts` using `@supabase/supabase-js`.
   The interface is in `src/lib/db/interface.ts` — each method maps 1-to-1 with a table.

## Data stored in Excel

The file `data/survey-data.xlsx` has four sheets:
- **Surveys** — survey metadata
- **Questions** — questions per survey
- **Responses** — one row per submission (includes computed score)
- **Answers** — one row per question answer

You can open this file in Excel or Google Sheets at any time to view raw data.
