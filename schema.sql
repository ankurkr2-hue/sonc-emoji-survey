-- ── 1. Tables ────────────────────────────────────────────────────────────────

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
  score int,
  submitted_at timestamptz default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references responses(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  value int check (value between 1 and 5)
);

-- ── 2. Seed ───────────────────────────────────────────────────────────────────

insert into surveys (id, title) values
  ('00000000-0000-0000-0000-000000000001', 'Special Olympics NC — Event Experience Survey');

insert into questions (survey_id, text, display_order) values
  ('00000000-0000-0000-0000-000000000001', 'How would you rate your overall experience at today''s event?', 0),
  ('00000000-0000-0000-0000-000000000001', 'How welcoming and inclusive did the event feel?', 1),
  ('00000000-0000-0000-0000-000000000001', 'How satisfied were you with the organization and activities at the event?', 2);

-- ── 3. Row-level security (optional but recommended) ─────────────────────────
-- The app uses the service role key server-side, so RLS doesn't block it.
-- Enable if you want to lock down direct client access.
--
-- alter table surveys enable row level security;
-- alter table questions enable row level security;
-- alter table responses enable row level security;
-- alter table answers enable row level security;
