-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Complete Database Rebuild From Zero
-- File: supabase/master_rebuild_all.sql
-- Run this in Supabase SQL Editor to initialize or fully rebuild the database.
-- All RLS is disabled as requested.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (CASCADE)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.forms CASCADE;
DROP TABLE IF EXISTS public.question_bank CASCADE;
DROP TABLE IF EXISTS public.target_roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ------------------------------------------------------------------------------
-- 2. USERS TABLE (Superadmin & Staff)
-- ------------------------------------------------------------------------------
CREATE TABLE public.users (
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

CREATE INDEX idx_users_email ON public.users(email);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Insert Superadmin Account
-- Email: admin@new-era-medical-club-univ-ouargla.dz
-- Password: admin123
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

-- ------------------------------------------------------------------------------
-- 3. TARGET ROLES TABLE (Publics cibles & Rôles)
-- ------------------------------------------------------------------------------
CREATE TABLE public.target_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B33FF',
    icon TEXT DEFAULT '🎯',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.target_roles DISABLE ROW LEVEL SECURITY;

-- Seed Standard Roles
INSERT INTO public.target_roles (id, name, description, color, icon) VALUES
    ('student', 'Étudiant en Médecine', 'Étudiants de la 1ère à la 6ème année de médecine.', '#3B33FF', '🎓'),
    ('resident', 'Médecin Résident', 'Médecins en cours de spécialisation hospitalo-universitaire.', '#10B981', '🩺'),
    ('professor', 'Professeur / Enseignant', 'Membres du corps professoral et encadrants hospitaliers.', '#8B5CF6', '👨‍🏫'),
    ('other', 'Autre professionnel de santé', 'Pharmaciens, dentistes, personnel soignant et partenaires.', '#F59E0B', '🌐')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. QUESTION BANK TABLE (Banque de questions réutilisables)
-- ------------------------------------------------------------------------------
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

-- Seed Rich Dynamic Question Bank
INSERT INTO public.question_bank (id, label, key, type, category, help_text, placeholder, required, options) VALUES
    ('q_fullname', 'Nom et Prénom complets', 'nom_complet', 'short_text', 'Identité & Contact', 'Nom et prénom tels qu''inscrits à la faculté de médecine.', 'Ex. Sarah Benali', true, '[]'::jsonb),
    ('q_email', 'Adresse email officielle', 'email', 'email', 'Identité & Contact', 'Email pour recevoir les convocations et accusés de réception.', 'etudiant@univ-ouargla.dz', true, '[]'::jsonb),
    ('q_phone', 'Numéro de téléphone (WhatsApp)', 'telephone', 'phone', 'Identité & Contact', 'Numéro joignable pour intégration au groupe d''information.', '+213 6 00 00 00 00', true, '[]'::jsonb),
    ('q_wilaya', 'Wilaya de résidence ou faculté', 'wilaya', 'select', 'Identité & Contact', 'Précisez votre wilaya actuelle.', 'Sélectionnez votre wilaya', false, '[{"label": "30 - Ouargla", "value": "ouargla"}, {"label": "16 - Alger", "value": "alger"}, {"label": "31 - Oran", "value": "oran"}, {"label": "25 - Constantine", "value": "constantine"}, {"label": "47 - Ghardaïa", "value": "ghardaia"}, {"label": "39 - El Oued", "value": "el_oued"}, {"label": "Autre Wilaya", "value": "autre"}]'::jsonb),
    ('q_birthdate', 'Date de naissance', 'date_naissance', 'date', 'Identité & Contact', NULL, NULL, false, '[]'::jsonb),
    ('q_study_year', 'Année d''études médicales', 'annee_etudes', 'select', 'Cursus & Médical', 'Précisez votre promotion universitaire actuelle.', 'Sélectionnez votre promotion', true, '[{"label": "1ère Année Médecine (PCEM1)", "value": "1ere"}, {"label": "2ème Année Médecine (PCEM2)", "value": "2eme"}, {"label": "3ème Année Médecine (DCEM1)", "value": "3eme"}, {"label": "4ème Année Médecine (DCEM2)", "value": "4eme"}, {"label": "5ème Année Médecine (DCEM3)", "value": "5eme"}, {"label": "6ème Année Médecine (Internat)", "value": "6eme"}, {"label": "Médecin Interne en poste", "value": "interne"}]'::jsonb),
    ('q_specialty', 'Spécialité médicale ou Service hospitalier', 'specialite', 'short_text', 'Cursus & Médical', 'Ex. Cardiologie, Chirurgie, Pédiatrie, Urgences, etc.', 'Ex. Cardiologie', false, '[]'::jsonb),
    ('q_hospital', 'Établissement ou CHU de rattachement', 'etablissement', 'short_text', 'Cursus & Médical', 'Nom du centre hospitalier ou de la structure de santé.', 'Ex. CHU Ouargla, EPH Mohamed Boudiaf', false, '[]'::jsonb),
    ('q_academic_grade', 'Grade académique ou Titre professionnel', 'grade_titre', 'select', 'Cursus & Médical', 'Pour enseignants et encadrants hospitalo-universitaires.', 'Sélectionnez votre grade', true, '[{"label": "Professeur Chef de Service", "value": "chef_service"}, {"label": "Professeur Hospitalo-Universitaire", "value": "professeur"}, {"label": "Maître de Conférences (MCA / MCB)", "value": "maitre_conf"}, {"label": "Maître-Assistant Hospitalo-Universitaire", "value": "maitre_assistant"}, {"label": "Médecin Résident (R1 à R4)", "value": "resident"}, {"label": "Médecin Spécialiste de Santé Publique", "value": "specialiste"}, {"label": "Médecin Généraliste", "value": "generaliste"}]'::jsonb),
    ('q_motivation', 'Motivations pour rejoindre cette initiative', 'motivation', 'long_text', 'Engagement & Projets', 'Présentez brièvement vos motivations, idées ou attentes.', 'Expliquez en quelques lignes votre intérêt pour ce projet...', true, '[]'::jsonb),
    ('q_club_committees', 'Pôles d''activités souhaités au club', 'poles_activite', 'checkboxes', 'Engagement & Projets', 'Sélectionnez un ou plusieurs comités selon vos centres d''intérêt.', NULL, false, '[{"label": "Formation Médicale & Ateliers Pratiques (SCOME)", "value": "scome"}, {"label": "Santé Publique, Dépistages & Caravanes Médicales (SCOPH)", "value": "scoph"}, {"label": "Santé Reproductive & Droits Humains (SCORA/SCORP)", "value": "scora"}, {"label": "Recherche Scientifique & Publications Médicales (SCORE)", "value": "score"}, {"label": "Design Graphique, Audiovisuel & Communication", "value": "media"}, {"label": "Logistique Événementielle & Sponsoring", "value": "logistics"}]'::jsonb),
    ('q_weekly_hours', 'Disponibilité hebdomadaire estimée', 'disponibilite_heures', 'radio', 'Engagement & Projets', 'Temps que vous pouvez consacrer aux projets et réunions.', NULL, true, '[{"label": "1 à 2 heures par semaine (Ponctuel)", "value": "1_2h"}, {"label": "3 à 5 heures par semaine (Régulier)", "value": "3_5h"}, {"label": "Plus de 5 heures par semaine (Très actif)", "value": "plus_5h"}]'::jsonb),
    ('q_prior_experience', 'Expérience associative ou bénévole préalable', 'experience_prealable', 'radio', 'Compétences & Talents', 'Avez-vous déjà milité ou participé à des projets associatifs ?', NULL, false, '[{"label": "Oui, au sein du New Era Medical Club", "value": "oui_nemc"}, {"label": "Oui, dans un autre club ou association", "value": "oui_autre"}, {"label": "Non, première expérience associative", "value": "non"}]'::jsonb),
    ('q_digital_skills', 'Compétences créatives & numériques', 'competences_creatives', 'checkboxes', 'Compétences & Talents', 'Cochez les domaines que vous maîtrisez.', NULL, false, '[{"label": "Design graphique (Photoshop, Canva, Illustrator)", "value": "design"}, {"label": "Montage vidéo (CapCut, Premiere Pro, DaVinci)", "value": "video"}, {"label": "Photographie & Couverture événementielle", "value": "photo"}, {"label": "Animation & Prise de parole en public", "value": "speaking"}, {"label": "Rédaction scientifique & Synthèse médicale", "value": "redaction"}, {"label": "Développement web & Gestion de données", "value": "dev"}]'::jsonb),
    ('q_file_cv', 'Curriculum Vitae ou Justificatif d''inscription (PDF)', 'fichier_cv', 'file', 'Documents & Fichiers', 'Format PDF uniquement, taille maximum 10 Mo.', NULL, false, '[]'::jsonb),
    ('q_consent', 'Engagement et consentement au traitement des données', 'consentement_rgpd', 'consent', 'Général', 'En cochant cette case, vous certifiez l''exactitude des informations transmises et acceptez leur traitement par le comité d''organisation du New Era Medical Club.', NULL, true, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    key = EXCLUDED.key,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    help_text = EXCLUDED.help_text,
    placeholder = EXCLUDED.placeholder,
    required = EXCLUDED.required,
    options = EXCLUDED.options;

-- ------------------------------------------------------------------------------
-- 5. FORMS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. FORM FIELDS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 7. SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
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

