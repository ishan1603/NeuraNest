-- =============================================================================
-- NeuraNest — 0002 v2 platform schema
-- -----------------------------------------------------------------------------
-- Adds: verified session lifecycle + transcripts + AI insights, flashcards
-- (spaced repetition), quiz attempts, RAG documents (pgvector), companion
-- marketplace (visibility, remix, ratings, popularity counters) and Row Level
-- Security for every table.
--
-- Idempotent: safe to re-run. Run AFTER 0001_base_schema.sql.
-- =============================================================================

create extension if not exists vector with schema extensions;

-- -----------------------------------------------------------------------------
-- Companions: marketplace columns
-- -----------------------------------------------------------------------------
alter table public.companions add column if not exists is_public     boolean     not null default true;
alter table public.companions add column if not exists language      text        not null default 'en';
alter table public.companions add column if not exists remix_of      uuid        references public.companions (id) on delete set null;
alter table public.companions add column if not exists session_count integer     not null default 0;
alter table public.companions add column if not exists rating_avg    numeric(3,2) not null default 0;
alter table public.companions add column if not exists rating_count  integer     not null default 0;

create index if not exists companions_author_idx        on public.companions (author);
create index if not exists companions_public_popular_idx on public.companions (is_public, session_count desc);

-- -----------------------------------------------------------------------------
-- Session history: full, server-verified session lifecycle
-- -----------------------------------------------------------------------------
-- Existing v1 rows represent finished sessions, so the column is added with a
-- 'completed' default (back-filling them) and the default is then switched.
alter table public.session_history add column if not exists status text not null default 'completed';
alter table public.session_history alter column status set default 'in_progress';

alter table public.session_history add column if not exists started_at           timestamptz not null default now();
alter table public.session_history add column if not exists ended_at             timestamptz;
alter table public.session_history add column if not exists duration_seconds     integer;
alter table public.session_history add column if not exists max_duration_seconds integer;
alter table public.session_history add column if not exists vapi_call_id         text;
alter table public.session_history add column if not exists ended_reason         text;
alter table public.session_history add column if not exists cost                 numeric(10,4);
alter table public.session_history add column if not exists transcript           jsonb;
alter table public.session_history add column if not exists transcript_source    text;
alter table public.session_history add column if not exists insights             jsonb;
alter table public.session_history add column if not exists insights_status      text not null default 'none';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'session_history_status_check') then
    alter table public.session_history
      add constraint session_history_status_check
      check (status in ('in_progress', 'finalizing', 'completed', 'abandoned'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'session_history_insights_status_check') then
    alter table public.session_history
      add constraint session_history_insights_status_check
      check (insights_status in ('none', 'pending', 'ready', 'failed', 'skipped'));
  end if;
end $$;

-- Back-fill v1 rows so analytics have a start time.
update public.session_history set started_at = created_at where started_at > created_at;

create unique index if not exists session_history_vapi_call_id_key
  on public.session_history (vapi_call_id) where vapi_call_id is not null;
create index if not exists session_history_user_created_idx
  on public.session_history (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Bookmarks: de-duplicate, then enforce uniqueness
-- -----------------------------------------------------------------------------
delete from public.bookmarks a
  using public.bookmarks b
  where a.ctid < b.ctid
    and a.companion_id = b.companion_id
    and a.user_id = b.user_id;

create unique index if not exists bookmarks_user_companion_key
  on public.bookmarks (user_id, companion_id);

-- -----------------------------------------------------------------------------
-- Ratings (marketplace)
-- -----------------------------------------------------------------------------
create table if not exists public.companion_ratings (
  companion_id uuid not null references public.companions (id) on delete cascade,
  user_id      text not null default (auth.jwt() ->> 'sub'),
  rating       smallint not null check (rating between 1 and 5),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (companion_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Flashcards (SM-2 spaced repetition)
-- -----------------------------------------------------------------------------
create table if not exists public.flashcards (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  user_id          text not null default (auth.jwt() ->> 'sub'),
  session_id       uuid references public.session_history (id) on delete set null,
  companion_id     uuid references public.companions (id) on delete set null,
  front            text not null,
  back             text not null,
  ease_factor      real not null default 2.5,
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  lapses           integer not null default 0,
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz
);

create index if not exists flashcards_user_due_idx on public.flashcards (user_id, due_at);

-- -----------------------------------------------------------------------------
-- Quiz attempts
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     text not null default (auth.jwt() ->> 'sub'),
  session_id  uuid not null references public.session_history (id) on delete cascade,
  score       integer not null,
  total       integer not null,
  answers     jsonb not null default '[]'::jsonb
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RAG: user documents + embedded chunks
-- -----------------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      text not null default (auth.jwt() ->> 'sub'),
  companion_id uuid references public.companions (id) on delete cascade,
  name         text not null,
  mime_type    text,
  size_bytes   integer,
  chunk_count  integer not null default 0,
  status       text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error        text
);

create index if not exists documents_user_companion_idx on public.documents (user_id, companion_id);

create table if not exists public.document_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  user_id      text not null default (auth.jwt() ->> 'sub'),
  companion_id uuid references public.companions (id) on delete cascade,
  chunk_index  integer not null,
  content      text not null,
  embedding    extensions.vector(1536) not null
);

create index if not exists document_chunks_scope_idx on public.document_chunks (user_id, companion_id);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Semantic search over a user's notes for one companion.
-- SECURITY INVOKER: when called with a user JWT, RLS restricts rows to that
-- user. The service role (webhooks) must pass p_user_id explicitly.
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  p_companion_id  uuid default null,
  match_count     integer default 5,
  p_user_id       text default null
)
returns table (id uuid, content text, document_name text, similarity double precision)
language sql
stable
set search_path = public, extensions
as $$
  select c.id,
         c.content,
         d.name as document_name,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where (p_companion_id is null or c.companion_id = p_companion_id or c.companion_id is null)
    and c.user_id = coalesce(p_user_id, auth.jwt() ->> 'sub')
  order by c.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

-- -----------------------------------------------------------------------------
-- Denormalised counters (kept correct by SECURITY DEFINER triggers so they
-- work even though users cannot UPDATE companions they do not own)
-- -----------------------------------------------------------------------------
create or replace function public.bump_companion_session_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed'
     and (tg_op = 'INSERT' or old.status is distinct from 'completed')
     and new.companion_id is not null then
    update public.companions set session_count = session_count + 1 where id = new.companion_id;
  end if;
  return new;
end;
$$;

drop trigger if exists session_history_bump_count on public.session_history;
create trigger session_history_bump_count
  after insert or update of status on public.session_history
  for each row execute function public.bump_companion_session_count();

create or replace function public.refresh_companion_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.companion_id, old.companion_id);
begin
  update public.companions c
     set rating_avg   = coalesce((select round(avg(rating)::numeric, 2) from public.companion_ratings where companion_id = target), 0),
         rating_count = (select count(*) from public.companion_ratings where companion_id = target)
   where c.id = target;
  return null;
end;
$$;

drop trigger if exists companion_ratings_refresh on public.companion_ratings;
create trigger companion_ratings_refresh
  after insert or update or delete on public.companion_ratings
  for each row execute function public.refresh_companion_rating();

-- One-time back-fill of popularity counters from existing history.
update public.companions c
   set session_count = sub.cnt
  from (select companion_id, count(*)::int as cnt
          from public.session_history
         where status = 'completed'
         group by companion_id) sub
 where sub.companion_id = c.id;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.companions        enable row level security;
alter table public.session_history   enable row level security;
alter table public.bookmarks         enable row level security;
alter table public.companion_ratings enable row level security;
alter table public.flashcards        enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.documents         enable row level security;
alter table public.document_chunks   enable row level security;

-- companions ------------------------------------------------------------------
drop policy if exists "companions: read public or own" on public.companions;
create policy "companions: read public or own" on public.companions
  for select to anon, authenticated
  using (is_public or author = (select auth.jwt() ->> 'sub'));

drop policy if exists "companions: insert own" on public.companions;
create policy "companions: insert own" on public.companions
  for insert to authenticated
  with check (author = (select auth.jwt() ->> 'sub'));

drop policy if exists "companions: update own" on public.companions;
create policy "companions: update own" on public.companions
  for update to authenticated
  using (author = (select auth.jwt() ->> 'sub'))
  with check (author = (select auth.jwt() ->> 'sub'));

drop policy if exists "companions: delete own" on public.companions;
create policy "companions: delete own" on public.companions
  for delete to authenticated
  using (author = (select auth.jwt() ->> 'sub'));

-- owner-only tables -------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['session_history', 'bookmarks', 'flashcards', 'quiz_attempts', 'documents', 'document_chunks']
  loop
    execute format('drop policy if exists "%1$s: owner all" on public.%1$I', t);
    execute format(
      'create policy "%1$s: owner all" on public.%1$I for all to authenticated
         using (user_id = (select auth.jwt() ->> ''sub''))
         with check (user_id = (select auth.jwt() ->> ''sub''))',
      t
    );
  end loop;
end $$;

-- ratings: public read, owner write ---------------------------------------------
drop policy if exists "ratings: public read" on public.companion_ratings;
create policy "ratings: public read" on public.companion_ratings
  for select to anon, authenticated using (true);

drop policy if exists "ratings: owner write" on public.companion_ratings;
create policy "ratings: owner write" on public.companion_ratings
  for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));
