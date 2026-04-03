-- HealthLiteracy AI — initial sessions table for share URLs
-- Run migrations in this folder in timestamp order (this file, then 20250403120001_*).

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  original text not null,
  translation text not null,
  urgent_items text[] not null default '{}',
  summary_line text not null default '',
  reading_level text not null check (reading_level in ('5th', '8th', 'college')),
  language text not null check (language in ('en', 'es', 'zh', 'ar', 'fr', 'pt', 'vi', 'ko', 'hi', 'ru', 'tl', 'ja')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

alter table sessions enable row level security;

drop policy if exists "Sessions are publicly readable" on sessions;
create policy "Sessions are publicly readable"
  on sessions for select
  using (true);

drop policy if exists "Anyone can create a session" on sessions;
create policy "Anyone can create a session"
  on sessions for insert
  with check (true);

-- Optional: auto-delete sessions older than 90 days (Supabase Pro + pg_cron)
-- select cron.schedule('delete-old-sessions', '0 3 * * *',
--   'delete from sessions where created_at < now() - interval ''90 days''');
