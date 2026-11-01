-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Question Bank Dynamic Seed
-- File: supabase/seed_question_bank.sql
-- Run this in Supabase SQL Editor to populate the Question Bank with
-- diverse, dynamic questions for all roles.
-- ==============================================================================

INSERT INTO public.question_bank (id, label, key, type, category, help_text, placeholder, required, options)
VALUES
    -- 1. IDENTITÉ & CONTACT
    ('q_fullname', 'Nom et Prénom complets', 'nom_complet', 'short_text', 'Identité & Contact', 
     'Nom et prénom tels qu''inscrits à la faculté de médecine.', 'Ex. Sarah Benali', true, '[]'::jsonb),

    ('q_email', 'Adresse email officielle', 'email', 'email', 'Identité & Contact', 
     'Email pour recevoir les convocations et accusés de réception.', 'etudiant@univ-ouargla.dz', true, '[]'::jsonb),

    ('q_phone', 'Numéro de téléphone (WhatsApp)', 'telephone', 'phone', 'Identité & Contact', 
     'Numéro joignable pour intégration au groupe d''information.', '+213 6 00 00 00 00', true, '[]'::jsonb),

    ('q_wilaya', 'Wilaya de résidence ou faculté', 'wilaya', 'select', 'Identité & Contact', 
     'Précisez votre wilaya actuelle.', 'Sélectionnez votre wilaya', false, 
     '[{"label": "30 - Ouargla", "value": "ouargla"}, {"label": "16 - Alger", "value": "alger"}, {"label": "31 - Oran", "value": "oran"}, {"label": "25 - Constantine", "value": "constantine"}, {"label": "47 - Ghardaïa", "value": "ghardaia"}, {"label": "39 - El Oued", "value": "el_oued"}, {"label": "Autre Wilaya", "value": "autre"}]'::jsonb),

    ('q_birthdate', 'Date de naissance', 'date_naissance', 'date', 'Identité & Contact', 
     NULL, NULL, false, '[]'::jsonb),

    -- 2. CURSUS & MÉDICAL
    ('q_study_year', 'Année d''études médicales', 'annee_etudes', 'select', 'Cursus & Médical', 
     'Précisez votre promotion universitaire actuelle.', 'Sélectionnez votre promotion', true, 
     '[{"label": "1ère Année Médecine (PCEM1)", "value": "1ere"}, {"label": "2ème Année Médecine (PCEM2)", "value": "2eme"}, {"label": "3ème Année Médecine (DCEM1)", "value": "3eme"}, {"label": "4ème Année Médecine (DCEM2)", "value": "4eme"}, {"label": "5ème Année Médecine (DCEM3)", "value": "5eme"}, {"label": "6ème Année Médecine (Internat)", "value": "6eme"}, {"label": "Médecin Interne en poste", "value": "interne"}]'::jsonb),

    ('q_specialty', 'Spécialité médicale ou Service hospitalier', 'specialite', 'short_text', 'Cursus & Médical', 
     'Ex. Cardiologie, Chirurgie, Pédiatrie, Urgences, etc.', 'Ex. Cardiologie', false, '[]'::jsonb),

    ('q_hospital', 'Établissement ou CHU de rattachement', 'etablissement', 'short_text', 'Cursus & Médical', 
     'Nom du centre hospitalier ou de la structure de santé.', 'Ex. CHU Ouargla, EPH Mohamed Boudiaf', false, '[]'::jsonb),

    ('q_academic_grade', 'Grade académique ou Titre professionnel', 'grade_titre', 'select', 'Cursus & Médical', 
     'Pour enseignants et encadrants hospitalo-universitaires.', 'Sélectionnez votre grade', true, 
     '[{"label": "Professeur Chef de Service", "value": "chef_service"}, {"label": "Professeur Hospitalo-Universitaire", "value": "professeur"}, {"label": "Maître de Conférences (MCA / MCB)", "value": "maitre_conf"}, {"label": "Maître-Assistant Hospitalo-Universitaire", "value": "maitre_assistant"}, {"label": "Médecin Résident (R1 à R4)", "value": "resident"}, {"label": "Médecin Spécialiste de Santé Publique", "value": "specialiste"}, {"label": "Médecin Généraliste", "value": "generaliste"}]'::jsonb),

    -- 3. ENGAGEMENT & PROJETS
    ('q_motivation', 'Motivations pour rejoindre cette initiative', 'motivation', 'long_text', 'Engagement & Projets', 
     'Présentez brièvement vos motivations, idées ou attentes.', 'Expliquez en quelques lignes votre intérêt pour ce projet...', true, '[]'::jsonb),

    ('q_club_committees', 'Pôles d''activités souhaités au club', 'poles_activite', 'checkboxes', 'Engagement & Projets', 
     'Sélectionnez un ou plusieurs comités selon vos centres d''intérêt.', NULL, false, 
     '[{"label": "Formation Médicale & Ateliers Pratiques (SCOME)", "value": "scome"}, {"label": "Santé Publique, Dépistages & Caravanes Médicales (SCOPH)", "value": "scoph"}, {"label": "Santé Reproductive & Droits Humains (SCORA/SCORP)", "value": "scora"}, {"label": "Recherche Scientifique & Publications Médicales (SCORE)", "value": "score"}, {"label": "Design Graphique, Audiovisuel & Communication", "value": "media"}, {"label": "Logistique Événementielle & Sponsoring", "value": "logistics"}]'::jsonb),

    ('q_weekly_hours', 'Disponibilité hebdomadaire estimée', 'disponibilite_heures', 'radio', 'Engagement & Projets', 
     'Temps que vous pouvez consacrer aux projets et réunions.', NULL, true, 
     '[{"label": "1 à 2 heures par semaine (Ponctuel)", "value": "1_2h"}, {"label": "3 à 5 heures par semaine (Régulier)", "value": "3_5h"}, {"label": "Plus de 5 heures par semaine (Très actif)", "value": "plus_5h"}]'::jsonb),

    -- 4. COMPÉTENCES & TALENTS
    ('q_prior_experience', 'Expérience associative ou bénévole préalable', 'experience_prealable', 'radio', 'Compétences & Talents', 
     'Avez-vous déjà milité ou participé à des projets associatifs ?', NULL, false, 
     '[{"label": "Oui, au sein du New Era Medical Club", "value": "oui_nemc"}, {"label": "Oui, dans un autre club ou association", "value": "oui_autre"}, {"label": "Non, première expérience associative", "value": "non"}]'::jsonb),

    ('q_digital_skills', 'Compétences créatives & numériques', 'competences_creatives', 'checkboxes', 'Compétences & Talents', 
     'Cochez les domaines que vous maîtrisez.', NULL, false, 
     '[{"label": "Design graphique (Photoshop, Canva, Illustrator)", "value": "design"}, {"label": "Montage vidéo (CapCut, Premiere Pro, DaVinci)", "value": "video"}, {"label": "Photographie & Couverture événementielle", "value": "photo"}, {"label": "Animation & Prise de parole en public", "value": "speaking"}, {"label": "Rédaction scientifique & Synthèse médicale", "value": "redaction"}, {"label": "Développement web & Gestion de données", "value": "dev"}]'::jsonb),

    -- 5. DOCUMENTS & CONSENTEMENT
    ('q_file_cv', 'Curriculum Vitae ou Justificatif d''inscription (PDF)', 'fichier_cv', 'file', 'Documents & Fichiers', 
     'Format PDF uniquement, taille maximum 10 Mo.', NULL, false, '[]'::jsonb),

    ('q_consent', 'Engagement et consentement au traitement des données', 'consentement_rgpd', 'consent', 'Général', 
     'En cochant cette case, vous certifiez l''exactitude des informations transmises et acceptez leur traitement par le comité d''organisation du New Era Medical Club.', NULL, true, '[]'::jsonb)

ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    key = EXCLUDED.key,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    help_text = EXCLUDED.help_text,
    placeholder = EXCLUDED.placeholder,
    required = EXCLUDED.required,
    options = EXCLUDED.options;

