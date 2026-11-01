-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Target Audiences / Roles & Question Bank Migration
-- Migration: 002_target_roles_and_question_bank.sql
-- ==============================================================================

-- 1. ADD target_roles TO FORMS TABLE
-- Stores target audience/role definitions configured for this form
alter table if exists public.forms
add column if not exists target_roles jsonb default '[]'::jsonb;

-- 2. ADD target_roles TO FORM_FIELDS TABLE
-- Stores array of role IDs (or 'all') indicating which respondent profiles see this question
alter table if exists public.form_fields
add column if not exists target_roles text[] default null;

-- 3. (OPTIONAL) TARGET ROLES CATALOG TABLE
-- For central persistence of audience types (e.g. Doctor "طبيب", Student "طالب", etc.)
create table if not exists public.target_roles (
    id text primary key,
    name text not null,
    description text,
    color text default '#3B33FF',
    icon text default '🎯',
    created_at timestamptz not null default now()
);

-- RLS for target_roles
alter table public.target_roles enable row level security;

create policy "Public can read target roles"
    on public.target_roles
    for select
    to anon, authenticated
    using (true);

create policy "Admins full access to target roles"
    on public.target_roles
    for all
    to authenticated
    using (true)
    with check (true);

-- 4. (OPTIONAL) REUSABLE QUESTION BANK TABLE
-- For central persistence of preconfigured questions
create table if not exists public.question_bank (
    id text primary key,
    label text not null,
    key text not null,
    type text not null,
    category text default 'Général',
    help_text text,
    placeholder text,
    required boolean default false,
    options jsonb default '[]'::jsonb,
    created_at timestamptz not null default now()
);

-- RLS for question_bank
alter table public.question_bank enable row level security;

create policy "Public can read question bank"
    on public.question_bank
    for select
    to anon, authenticated
    using (true);

create policy "Admins full access to question bank"
    on public.question_bank
    for all
    to authenticated
    using (true)
    with check (true);

-- Indexes for performance
create index if not exists idx_form_fields_target_roles on public.form_fields using gin (target_roles);
