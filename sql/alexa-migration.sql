-- ============================================================
-- Alexa Integration - OAuth tables for Account Linking
-- Run this in the Supabase SQL Editor
-- ============================================================

-- OAuth auth codes (short-lived, single-use)
create table alexa_auth_codes (
  code text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  redirect_uri text not null,
  client_id text not null,
  created_at timestamptz default now(),
  used boolean default false
);

-- Access/refresh tokens for Alexa Account Linking
create table alexa_tokens (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  token_type text not null check (token_type in ('access', 'refresh')),
  refresh_token_ref text,
  expires_at timestamptz,
  revoked boolean default false,
  created_at timestamptz default now()
);

create index alexa_tokens_user_idx on alexa_tokens(user_id);
