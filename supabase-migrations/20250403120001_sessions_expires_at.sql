-- Adds expires_at to sessions if the table was created from an older schema.
alter table sessions add column if not exists expires_at timestamptz not null default (now() + interval '90 days');
