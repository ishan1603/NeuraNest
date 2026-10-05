-- =============================================================================
-- NeuraNest — 0001 base schema
-- -----------------------------------------------------------------------------
-- Recreates the original (v1) tables so a fresh Supabase project can be
-- bootstrapped from the repo. Everything is idempotent (`if not exists`), so it
-- is SAFE to run against the existing production database: tables that already
-- exist are left untouched.
--
-- Identity: users come from Clerk (Supabase "Third-Party Auth" integration).
-- `auth.jwt() ->> 'sub'` is the Clerk user id (e.g. `user_2abc...`).
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.companions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  subject     text not null,
  topic       text not null,
  voice       text not null,
  style       text not null,
  duration    integer not null default 15,
  author      text not null default (auth.jwt() ->> 'sub')
);

create table if not exists public.session_history (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  companion_id  uuid references public.companions (id) on delete cascade,
  user_id       text not null default (auth.jwt() ->> 'sub')
);

create table if not exists public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  companion_id  uuid references public.companions (id) on delete cascade,
  user_id       text not null default (auth.jwt() ->> 'sub')
);
