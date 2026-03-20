-- HealthLiteracy AI — Supabase Schema
-- Run this in your Supabase SQL editor

-- Sessions table: stores each translated session for share URL feature
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  original text not null,
  translation text not null,
  urgent_items text[] not null default '{}',
  summary_line text not null default '',
  reading_level text not null check (reading_level in ('5th', '8th', 'college')),
  language text not null check (language in ('en', 'es', 'zh', 'ar', 'fr', 'pt', 'vi', 'ko', 'hi', 'ru', 'tl', 'ja')),
  created_at timestamptz not null default now()
);

-- Index for quick lookup by ID (already indexed as PK, but explicit for clarity)
-- Sessions are public-read, insert-only. No auth required.

-- Row Level Security
alter table sessions enable row level security;

-- Anyone can read sessions by ID (share link behavior)
create policy "Sessions are publicly readable"
  on sessions for select
  using (true);

-- Anyone can insert (no auth — free tool)
create policy "Anyone can create a session"
  on sessions for insert
  with check (true);

-- No updates or deletes via API
-- (Sessions are immutable once saved)

-- Optional: auto-delete sessions older than 90 days
-- Requires pg_cron extension (available in Supabase Pro)
-- select cron.schedule('delete-old-sessions', '0 3 * * *',
--   'delete from sessions where created_at < now() - interval ''90 days''');

-- Verify setup
select count(*) from sessions;
