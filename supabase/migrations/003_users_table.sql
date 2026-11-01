-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Users Table & Superadmin Seed (No RLS)
-- Migration: 003_users_table.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT DEFAULT 'Admin',
    last_name TEXT DEFAULT 'NEMC',
    role TEXT NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin', 'dean', 'professor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. DISABLE RLS (per requirement: no RLS)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- 3. INSERT OR UPDATE SUPERADMIN ACCOUNT
-- Default credentials:
-- Email: admin@new-era-medical-club-univ-ouargla.dz
-- Password: admin123
-- Bcrypt hash (12 rounds): $2a$12$jtmDWEn7RuCICyk88UUGX.lpcR/RrXlWxU/PRPNeuwnI9knu/V7yq
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '5e814cc5-b7aa-457f-815a-a46411b08614',
    'admin@new-era-medical-club-univ-ouargla.dz',
    '$2a$12$jtmDWEn7RuCICyk88UUGX.lpcR/RrXlWxU/PRPNeuwnI9knu/V7yq',
    'Lead',
    'Superadmin',
    'superadmin',
    true
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();
