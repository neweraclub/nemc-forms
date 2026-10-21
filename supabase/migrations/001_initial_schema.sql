-- ==============================================================================
-- NEW ERA CLUB (Club Médical New Era) — Form Engine Schema
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. FORMS TABLE
create table if not exists public.forms (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text,
    status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
    opens_at timestamptz,
    closes_at timestamptz,
    max_responses integer check (max_responses is null or max_responses > 0),
    confirmation_message text default 'Application sent. We will review your answers and get back to you.',
    notify_emails text[] default '{}'::text[],
    send_receipt boolean not null default false,
    receipt_email_field text,
    layout text not null default 'stepped' check (layout in ('single', 'stepped')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. FORM FIELDS TABLE
create table if not exists public.form_fields (
    id uuid primary key default gen_random_uuid(),
    form_id uuid not null references public.forms(id) on delete cascade,
    position integer not null default 0,
    type text not null check (type in (
        'short_text',
        'long_text',
        'email',
        'phone',
        'number',
        'select',
        'radio',
        'checkboxes',
        'date',
        'file',
        'consent'
    )),
    key text not null,
    label text not null,
    help_text text,
    placeholder text,
    required boolean not null default false,
    options jsonb default '[]'::jsonb,
    validation jsonb default '{}'::jsonb,
    show_if jsonb,
    created_at timestamptz not null default now(),
    unique (form_id, key)
);

-- 3. SUBMISSIONS TABLE
create table if not exists public.submissions (
    id uuid primary key default gen_random_uuid(),
    form_id uuid not null references public.forms(id) on delete cascade,
    answers jsonb not null default '{}'::jsonb,
    submitter_email text,
    created_at timestamptz not null default now(),
    email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'not_requested')),
    ip_hash text,
    user_agent text,
    idempotency_key text unique
);

-- INDEXES
create index if not exists idx_forms_slug on public.forms(slug);
create index if not exists idx_form_fields_form_pos on public.form_fields(form_id, position asc);
create index if not exists idx_submissions_form_created on public.submissions(form_id, created_at desc);
create index if not exists idx_submissions_ip_hash on public.submissions(ip_hash, created_at desc);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.submissions enable row level security;

-- Forms RLS policies:
-- Public can ONLY read forms that are currently 'open'
create policy "Public can read open forms"
    on public.forms
    for select
    to anon, authenticated
    using (status = 'open');

-- Form Fields RLS policies:
-- Public can ONLY read fields belonging to 'open' forms
create policy "Public can read fields of open forms"
    on public.form_fields
    for select
    to anon, authenticated
    using (
        exists (
            select 1 from public.forms
            where forms.id = form_fields.form_id
            and forms.status = 'open'
        )
    );

-- Submissions RLS policies:
-- Public (anon) cannot directly read or write submissions via client Supabase.
-- Submissions are strictly handled by Server Actions using the Service Role Key.
create policy "Public cannot direct write or read submissions"
    on public.submissions
    for all
    to anon
    using (false)
    with check (false);

-- Authenticated admins can view and manage all forms, fields, and submissions
create policy "Admins full access to forms"
    on public.forms
    for all
    to authenticated
    using (true)
    with check (true);

create policy "Admins full access to form_fields"
    on public.form_fields
    for all
    to authenticated
    using (true)
    with check (true);

create policy "Admins can view submissions"
    on public.submissions
    for select
    to authenticated
    using (true);

-- Updated_at trigger for forms
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_forms_updated_at on public.forms;
create trigger set_forms_updated_at
    before update on public.forms
    for each row
    execute function public.handle_updated_at();
