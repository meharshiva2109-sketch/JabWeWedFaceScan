-- Jab We Wed — schema for an INDEPENDENT Supabase project.
-- Every table uses the jw_ prefix. No payment tables exist in this app.
-- All reads/writes go through server routes using the service role;
-- RLS is enabled with NO anon/authenticated policies, so the public
-- (publishable) key cannot read events, photos or sessions directly.

create extension if not exists pgcrypto;

-- ── Weddings ──────────────────────────────────────────────────────────────
create table if not exists public.jw_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  title text not null,
  bride_name text not null,
  groom_name text not null,
  event_date date,
  venue text,
  status text not null default 'draft' check (status in ('draft','live','archived')),
  guest_access boolean not null default false,
  photos_count integer not null default 0,
  indexed_count integer not null default 0,
  faces_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Photos (originals + previews live in private buckets) ────────────────
create table if not exists public.jw_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.jw_events(id) on delete cascade,
  original_path text not null unique,
  preview_path text not null unique,
  original_filename text not null,
  content_type text,
  bytes bigint,
  file_hash text,
  processing_status text not null default 'ready' check (processing_status in ('pending','ready','failed')),
  indexed_at timestamptz,
  face_count integer not null default 0,
  face_ids text[] not null default '{}',
  index_error text,
  created_at timestamptz not null default now()
);
create index if not exists jw_photos_event_idx on public.jw_photos(event_id, created_at);
create index if not exists jw_photos_unindexed_idx on public.jw_photos(event_id) where indexed_at is null;
create unique index if not exists jw_photos_event_hash_uq on public.jw_photos(event_id, file_hash) where file_hash is not null;

-- ── Guest download sessions (created only after a server-side face match) ─
create table if not exists public.jw_match_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  event_id uuid not null references public.jw_events(id) on delete cascade,
  photo_ids uuid[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists jw_match_sessions_expiry_idx on public.jw_match_sessions(expires_at);

-- ── Rate limiting (fixed window, keyed by hashed IP + action) ─────────────
create table if not exists public.jw_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.jw_events enable row level security;
alter table public.jw_photos enable row level security;
alter table public.jw_match_sessions enable row level security;
alter table public.jw_rate_limits enable row level security;
-- Intentionally no policies: only the service role (server) can access these.

-- ── Helpers ──────────────────────────────────────────────────────────────
create or replace function public.jw_refresh_event_counts(p_event_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jw_events e set
    photos_count = (select count(*) from public.jw_photos p where p.event_id = p_event_id and p.processing_status = 'ready'),
    indexed_count = (select count(*) from public.jw_photos p where p.event_id = p_event_id and p.indexed_at is not null),
    faces_count = (select coalesce(sum(face_count),0) from public.jw_photos p where p.event_id = p_event_id),
    updated_at = now()
  where e.id = p_event_id;
$$;

-- Returns true when the call is allowed, false when the limit is exceeded.
create or replace function public.jw_rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits integer;
begin
  insert into public.jw_rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  -- opportunistic cleanup
  if random() < 0.02 then
    delete from public.jw_rate_limits where window_start < now() - interval '1 day';
    delete from public.jw_match_sessions where expires_at < now() - interval '1 day';
  end if;
  return v_hits <= p_max;
end;
$$;

revoke all on function public.jw_refresh_event_counts(uuid) from public, anon, authenticated;
revoke all on function public.jw_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.jw_refresh_event_counts(uuid) to service_role;
grant execute on function public.jw_rate_limit_hit(text, integer, integer) to service_role;

-- ── Storage: BOTH buckets private. Guests only ever get short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('jw-originals', 'jw-originals', false, 52428800),
  ('jw-previews',  'jw-previews',  false, 5242880)
on conflict (id) do update set public = false;
-- No storage.objects policies for anon/authenticated: uploads use
-- server-issued signed upload URLs; downloads use server-issued signed URLs.
