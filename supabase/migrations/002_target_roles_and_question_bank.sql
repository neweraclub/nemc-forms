-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Target Roles & Question Bank (No RLS)
-- Migration: 002_target_roles_and_question_bank.sql
-- ==============================================================================

-- 1. ADD target_roles COLUMNS
ALTER TABLE IF EXISTS public.forms
ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.form_fields
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_form_fields_target_roles 
ON public.form_fields USING gin (target_roles);

-- 2. TARGET ROLES TABLE
CREATE TABLE IF NOT EXISTS public.target_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B33FF',
    icon TEXT DEFAULT '🎯',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. REUSABLE QUESTION BANK TABLE
CREATE TABLE IF NOT EXISTS public.question_bank (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    key TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'Général',
    help_text TEXT,
    placeholder TEXT,
    required BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DISABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS public.forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.form_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.target_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_bank DISABLE ROW LEVEL SECURITY;
