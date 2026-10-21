-- ==============================================================================
-- NEW ERA CLUB (Club Médical New Era) — Sample Recruitment Form Seed
-- Seed: 001_recruitment_seed.sql
-- ==============================================================================

do $$
declare
    v_form_id uuid;
begin
    -- Check if form already exists or create new
    select id into v_form_id from public.forms where slug = 'recrutement-2026';

    if v_form_id is null then
        insert into public.forms (
            slug,
            title,
            description,
            status,
            layout,
            send_receipt,
            receipt_email_field,
            confirmation_message,
            notify_emails
        ) values (
            'recrutement-2026',
            'Club Médical New Era — Recrutement 2026',
            'Rejoignez une équipe dynamique d''étudiants en médecine engagés dans la formation médicale continue, les actions humanitaires et la vie associative.',
            'open',
            'stepped',
            true,
            'email',
            'Votre candidature a bien été enregistrée par le Club Médical New Era. Notre équipe examinera votre profil et vous contactera très prochainement par email.',
            array['contact@newera-club.org']
        ) returning id into v_form_id;

        -- Form Fields
        -- 1. Full name
        insert into public.form_fields (form_id, position, type, key, label, help_text, placeholder, required)
        values (
            v_form_id,
            1,
            'short_text',
            'full_name',
            'Nom complet',
            'Prénom et nom de famille tels qu''inscrits à la faculté.',
            'Ex. Sarah Benali',
            true
        );

        -- 2. Email
        insert into public.form_fields (form_id, position, type, key, label, help_text, placeholder, required)
        values (
            v_form_id,
            2,
            'email',
            'email',
            'Adresse email universitaire ou personnelle',
            'Nous utiliserons cet email pour vous confirmer la réception et vous convoquer aux entretiens.',
            'sarah.benali@example.com',
            true
        );

        -- 3. Phone
        insert into public.form_fields (form_id, position, type, key, label, help_text, placeholder, required)
        values (
            v_form_id,
            3,
            'phone',
            'phone',
            'Numéro de téléphone (WhatsApp)',
            'Pour l''organisation des entretiens et le groupe des candidats.',
            '0550 00 00 00',
            true
        );

        -- 4. Faculty
        insert into public.form_fields (form_id, position, type, key, label, help_text, required, options)
        values (
            v_form_id,
            4,
            'select',
            'faculty',
            'Faculté d''origine',
            'Sélectionnez votre faculté de médecine ou sciences de la santé.',
            true,
            '[
                {"label": "Faculté de Médecine d''Alger (Ziania)", "value": "alger_ziania"},
                {"label": "Faculté de Médecine de Blida", "value": "blida"},
                {"label": "Faculté de Médecine d''Oran", "value": "oran"},
                {"label": "Faculté de Médecine de Constantine", "value": "constantine"},
                {"label": "Autre faculté en Algérie", "value": "autre_algerie"},
                {"label": "Faculté à l''étranger", "value": "etranger"}
            ]'::jsonb
        );

        -- 5. Year of study
        insert into public.form_fields (form_id, position, type, key, label, help_text, required, options)
        values (
            v_form_id,
            5,
            'radio',
            'study_year',
            'Année d''études médicales',
            'Indiquez votre promotion pour l''année universitaire en cours.',
            true,
            '[
                {"label": "1ère Année Médecine", "value": "med_1"},
                {"label": "2ème Année Médecine", "value": "med_2"},
                {"label": "3ème Année Médecine", "value": "med_3"},
                {"label": "4ème Année Médecine (Externat)", "value": "med_4"},
                {"label": "5ème Année Médecine (Externat)", "value": "med_5"},
                {"label": "6ème Année Médecine (Externat)", "value": "med_6"},
                {"label": "Interne / Résident", "value": "interne_resident"},
                {"label": "Pharmacie / Médecine Dentaire", "value": "autre_sante"}
            ]'::jsonb
        );

        -- 6. Preferred committees (checkboxes)
        insert into public.form_fields (form_id, position, type, key, label, help_text, required, options)
        values (
            v_form_id,
            6,
            'checkboxes',
            'committees',
            'Pôles souhaités',
            'Choisissez un ou plusieurs pôles dans lesquels vous souhaitez vous investir.',
            true,
            '[
                {"label": "Pôle Scientifique & Formations Médicales", "value": "scientifique"},
                {"label": "Pôle Humanitaire & Santé Publique", "value": "humanitaire"},
                {"label": "Pôle Événements & Logistique", "value": "evenements"},
                {"label": "Pôle Design, Média & Communication", "value": "communication"},
                {"label": "Pôle Relations Publiques & Sponsoring", "value": "relations_publiques"}
            ]'::jsonb
        );

        -- 7. Motivation (long_text)
        insert into public.form_fields (form_id, position, type, key, label, help_text, placeholder, required, validation)
        values (
            v_form_id,
            7,
            'long_text',
            'motivation',
            'Motivation',
            'Pourquoi souhaitez-vous rejoindre le Club Médical New Era ? Quelles sont vos attentes et ce que vous souhaitez apporter ? (Min. 30 caractères)',
            'Partagez vos motivations et vos idées...',
            true,
            '{"minLength": 30}'::jsonb
        );

        -- 8. Prior associative / clinical experience (conditional or optional)
        insert into public.form_fields (form_id, position, type, key, label, help_text, placeholder, required)
        values (
            v_form_id,
            8,
            'long_text',
            'past_experience',
            'Expériences associatives ou projets antérieurs (facultatif)',
            'Si vous avez déjà fait partie d''un club ou d''une initiative étudiante, décrivez brièvement vos réalisations.',
            'Ex. Organisation de journées de dépistage, création de supports pédagogiques...',
            false
        );

        -- 9. Weekly availability
        insert into public.form_fields (form_id, position, type, key, label, help_text, required, options)
        values (
            v_form_id,
            9,
            'radio',
            'weekly_hours',
            'Disponibilité hebdomadaire estimée',
            'Le club respecte vos révisions et stages cliniques. Soyez réaliste.',
            true,
            '[
                {"label": "2 à 4 heures par semaine", "value": "2_4h"},
                {"label": "4 à 8 heures par semaine", "value": "4_8h"},
                {"label": "Plus de 8 heures par semaine", "value": "8h_plus"}
            ]'::jsonb
        );

        -- 10. File upload (CV / Justificatif)
        insert into public.form_fields (form_id, position, type, key, label, help_text, required)
        values (
            v_form_id,
            10,
            'file',
            'student_card_or_cv',
            'Carte d''étudiant ou CV (facultatif)',
            'Format PDF, PNG ou JPG (max 5 Mo). Permet de vérifier votre cursus.',
            false
        );

        -- 11. Consent checkbox
        insert into public.form_fields (form_id, position, type, key, label, help_text, required)
        values (
            v_form_id,
            11,
            'consent',
            'rgpd_consent',
            'J''accepte le traitement de mes données par le Club Médical New Era dans le strict cadre du processus de sélection 2026.',
            'Vos coordonnées ne seront jamais cédées ni utilisées à des fins commerciales.',
            true
        );

    end if;
end $$;
