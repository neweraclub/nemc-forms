-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text DEFAULT 'Admin'::text,
  last_name text DEFAULT 'NEMC'::text,
  role text NOT NULL DEFAULT 'superadmin'::text CHECK (role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'dean'::text, 'professor'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.target_roles (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B33FF'::text,
  icon text DEFAULT 'target'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT target_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_bank (
  id text NOT NULL,
  label text NOT NULL,
  type text NOT NULL,
  category text DEFAULT 'Général'::text,
  help_text text,
  placeholder text,
  required boolean DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT question_bank_pkey PRIMARY KEY (id)
);
CREATE TABLE public.forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text])),
  opens_at timestamp with time zone,
  closes_at timestamp with time zone,
  max_responses integer CHECK (max_responses IS NULL OR max_responses > 0),
  confirmation_message text DEFAULT 'Votre candidature a été envoyée.'::text,
  notify_emails ARRAY DEFAULT '{}'::text[],
  send_receipt boolean NOT NULL DEFAULT false,
  receipt_email_field text,
  layout text NOT NULL DEFAULT 'stepped'::text CHECK (layout = ANY (ARRAY['single'::text, 'stepped'::text])),
  custom_email_subject text,
  custom_email_html text,
  target_roles jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.form_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  help_text text,
  placeholder text,
  required boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  validation jsonb DEFAULT '{}'::jsonb,
  show_if jsonb,
  target_roles ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT form_fields_pkey PRIMARY KEY (id),
  CONSTRAINT form_fields_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitter_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email_status text NOT NULL DEFAULT 'pending'::text,
  ip_hash text,
  user_agent text,
  idempotency_key text UNIQUE,
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id)
);