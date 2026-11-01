-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Reset Project Tables (PRESERVING USERS TABLE)
-- File: supabase/reset_project_tables_keep_users.sql
-- Run this in Supabase SQL Editor if you want to wipe only forms, questions,
-- roles, and submissions while keeping all superadmin/admin users intact.
-- ==============================================================================

-- 1. DROP PROJECT FORM TABLES (DOES NOT TOUCH public.users)
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.forms CASCADE;
DROP TABLE IF EXISTS public.question_bank CASCADE;
DROP TABLE IF EXISTS public.target_roles CASCADE;

-- 2. RECREATE TARGET ROLES TABLE
CREATE TABLE public.target_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B33FF',
    icon TEXT DEFAULT '🎯',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.target_roles DISABLE ROW LEVEL SECURITY;

INSERT INTO public.target_roles (id, name, description, color, icon) VALUES
    ('student', 'Étudiant en Médecine', 'Étudiants de la 1ère à la 6ème année de médecine.', '#3B33FF', '🎓'),
    ('resident', 'Médecin Résident', 'Médecins en cours de spécialisation hospitalo-universitaire.', '#10B981', '🩺'),
    ('professor', 'Professeur / Enseignant', 'Membres du corps professoral et encadrants hospitaliers.', '#8B5CF6', '👨‍🏫'),
    ('other', 'Autre professionnel de santé', 'Pharmaciens, dentistes, personnel soignant et partenaires.', '#F59E0B', '🌐')
ON CONFLICT (id) DO NOTHING;

-- 3. RECREATE REUSABLE QUESTION BANK
CREATE TABLE public.question_bank (
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
ALTER TABLE public.question_bank DISABLE ROW LEVEL SECURITY;

INSERT INTO public.question_bank (id, label, key, type, category, help_text, placeholder, required, options) VALUES
    ('q_fullname', 'Nom complet', 'full_name', 'short_text', 'Identité & Contact', 'Prénom et nom de famille tels qu''inscrits à la faculté.', 'Ex. Sarah Benali', true, '[]'::jsonb),
    ('q_email', 'Adresse email', 'email', 'email', 'Identité & Contact', 'Email officiel pour notifications et convocations.', 'sarah.benali@example.com', true, '[]'::jsonb),
    ('q_phone', 'Numéro de téléphone (WhatsApp)', 'phone', 'phone', 'Identité & Contact', 'Numéro joignable avec indicatif pays.', '+213 6 00 00 00 00', true, '[]'::jsonb),
    ('q_year', 'Année d''études médicales', 'study_year', 'select', 'Cursus & Profession', 'Précisez votre promotion actuelle.', 'Sélectionnez votre année', true, '[{"label": "1ère Année Médecine", "value": "1ere"}, {"label": "2ème Année Médecine", "value": "2eme"}, {"label": "3ème Année Médecine", "value": "3eme"}, {"label": "4ème Année Médecine", "value": "4eme"}, {"label": "5ème Année Médecine", "value": "5eme"}, {"label": "6ème Année Médecine", "value": "6eme"}, {"label": "Interne", "value": "interne"}]'::jsonb),
    ('q_specialty', 'Spécialité médicale ou Service', 'specialty', 'short_text', 'Cursus & Profession', 'Ex. Cardiologie, Pédiatrie, Chirurgie générale.', 'Ex. Pédiatrie', false, '[]'::jsonb),
    ('q_hospital', 'Établissement de rattachement / Hôpital', 'hospital_affiliation', 'short_text', 'Cursus & Profession', 'Nom du CHU ou de l''hôpital universitaire.', 'Ex. CHU Ouargla', false, '[]'::jsonb),
    ('q_motivation', 'Motivations & Objectifs', 'motivation', 'long_text', 'Engagement & Projets', 'Pourquoi souhaitez-vous participer à ce projet ou événement ?', 'Partagez vos motivations en quelques lignes...', true, '[]'::jsonb),
    ('q_skills', 'Compétences clés & Intérêts', 'skills', 'checkboxes', 'Engagement & Projets', 'Sélectionnez les domaines où vous souhaitez vous investir.', NULL, false, '[{"label": "Organisation d''événements & Congrès", "value": "events"}, {"label": "Formations médicales & Ateliers cliniques", "value": "training"}, {"label": "Actions de santé publique & Dépistages", "value": "public_health"}, {"label": "Communication, Design & Réseaux sociaux", "value": "comms"}, {"label": "Recherche scientifique & Publications", "value": "research"}]'::jsonb),
    ('q_consent', 'Consentement au traitement des données', 'consent', 'consent', 'Général', 'En cochant cette case, vous acceptez le traitement de vos réponses par le bureau du NEMC.', NULL, true, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. RECREATE FORMS TABLE
CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    opens_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    max_responses INTEGER CHECK (max_responses IS NULL OR max_responses > 0),
    confirmation_message TEXT DEFAULT 'Votre candidature a été envoyée. Nous examinerons vos réponses dans les plus brefs délais.',
    notify_emails TEXT[] DEFAULT '{}'::TEXT[],
    send_receipt BOOLEAN NOT NULL DEFAULT false,
    receipt_email_field TEXT,
    layout TEXT NOT NULL DEFAULT 'stepped' CHECK (layout IN ('single', 'stepped')),
    custom_email_subject TEXT,
    custom_email_html TEXT,
    target_roles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forms_slug ON public.forms(slug);
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;

-- 5. RECREATE FORM FIELDS TABLE
CREATE TABLE public.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN (
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
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    help_text TEXT,
    placeholder TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb,
    validation JSONB DEFAULT '{}'::jsonb,
    show_if JSONB,
    target_roles TEXT[] DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (form_id, key)
);
CREATE INDEX idx_form_fields_form_pos ON public.form_fields(form_id, position ASC);
CREATE INDEX idx_form_fields_target_roles ON public.form_fields USING gin (target_roles);
ALTER TABLE public.form_fields DISABLE ROW LEVEL SECURITY;

-- 6. RECREATE SUBMISSIONS TABLE
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitter_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'not_requested')),
    ip_hash TEXT,
    user_agent TEXT,
    idempotency_key TEXT UNIQUE
);
CREATE INDEX idx_submissions_form_created ON public.submissions(form_id, created_at DESC);
CREATE INDEX idx_submissions_ip_hash ON public.submissions(ip_hash, created_at DESC);
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
