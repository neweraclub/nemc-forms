const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://klggvkylzvkyhxtpwpxd.supabase.co';
const supabaseKey = 'sb_publishable_04KAHht13dTNtP1_p5lXng_prTtbr3y';
const client = createClient(supabaseUrl, supabaseKey);

const questions = [
  {
    id: 'q_fullname',
    label: 'Nom et Prénom complets',
    key: 'nom_complet',
    type: 'short_text',
    category: 'Identité & Contact',
    help_text: "Nom et prénom tels qu'inscrits à la faculté de médecine.",
    placeholder: 'Ex. Sarah Benali',
    required: true,
    options: []
  },
  {
    id: 'q_email',
    label: 'Adresse email officielle',
    key: 'email',
    type: 'email',
    category: 'Identité & Contact',
    help_text: 'Email pour recevoir les convocations et accusés de réception.',
    placeholder: 'etudiant@univ-ouargla.dz',
    required: true,
    options: []
  },
  {
    id: 'q_phone',
    label: 'Numéro de téléphone (WhatsApp)',
    key: 'telephone',
    type: 'phone',
    category: 'Identité & Contact',
    help_text: "Numéro joignable pour intégration au groupe d'information.",
    placeholder: '+213 6 00 00 00 00',
    required: true,
    options: []
  },
  {
    id: 'q_wilaya',
    label: 'Wilaya de résidence ou faculté',
    key: 'wilaya',
    type: 'select',
    category: 'Identité & Contact',
    help_text: 'Précisez votre wilaya actuelle.',
    placeholder: 'Sélectionnez votre wilaya',
    required: false,
    options: [
      { label: '30 - Ouargla', value: 'ouargla' },
      { label: '16 - Alger', value: 'alger' },
      { label: '31 - Oran', value: 'oran' },
      { label: '25 - Constantine', value: 'constantine' },
      { label: '47 - Ghardaïa', value: 'ghardaia' },
      { label: '39 - El Oued', value: 'el_oued' },
      { label: 'Autre Wilaya', value: 'autre' }
    ]
  },
  {
    id: 'q_birthdate',
    label: 'Date de naissance',
    key: 'date_naissance',
    type: 'date',
    category: 'Identité & Contact',
    help_text: null,
    placeholder: null,
    required: false,
    options: []
  },
  {
    id: 'q_study_year',
    label: "Année d'études médicales",
    key: 'annee_etudes',
    type: 'select',
    category: 'Cursus & Médical',
    help_text: 'Précisez votre promotion universitaire actuelle.',
    placeholder: 'Sélectionnez votre promotion',
    required: true,
    options: [
      { label: '1ère Année Médecine (PCEM1)', value: '1ere' },
      { label: '2ème Année Médecine (PCEM2)', value: '2eme' },
      { label: '3ème Année Médecine (DCEM1)', value: '3eme' },
      { label: '4ème Année Médecine (DCEM2)', value: '4eme' },
      { label: '5ème Année Médecine (DCEM3)', value: '5eme' },
      { label: '6ème Année Médecine (Internat)', value: '6eme' },
      { label: 'Médecin Interne en poste', value: 'interne' }
    ]
  },
  {
    id: 'q_specialty',
    label: 'Spécialité médicale ou Service hospitalier',
    key: 'specialite',
    type: 'short_text',
    category: 'Cursus & Médical',
    help_text: 'Ex. Cardiologie, Chirurgie, Pédiatrie, Urgences, etc.',
    placeholder: 'Ex. Cardiologie',
    required: false,
    options: []
  },
  {
    id: 'q_hospital',
    label: 'Établissement ou CHU de rattachement',
    key: 'etablissement',
    type: 'short_text',
    category: 'Cursus & Médical',
    help_text: 'Nom du centre hospitalier ou de la structure de santé.',
    placeholder: 'Ex. CHU Ouargla, EPH Mohamed Boudiaf',
    required: false,
    options: []
  },
  {
    id: 'q_academic_grade',
    label: 'Grade académique ou Titre professionnel',
    key: 'grade_titre',
    type: 'select',
    category: 'Cursus & Médical',
    help_text: 'Pour enseignants et encadrants hospitalo-universitaires.',
    placeholder: 'Sélectionnez votre grade',
    required: true,
    options: [
      { label: 'Professeur Chef de Service', value: 'chef_service' },
      { label: 'Professeur Hospitalo-Universitaire', value: 'professeur' },
      { label: 'Maître de Conférences (MCA / MCB)', value: 'maitre_conf' },
      { label: 'Maître-Assistant Hospitalo-Universitaire', value: 'maitre_assistant' },
      { label: 'Médecin Résident (R1 à R4)', value: 'resident' },
      { label: 'Médecin Spécialiste de Santé Publique', value: 'specialiste' },
      { label: 'Médecin Généraliste', value: 'generaliste' }
    ]
  },
  {
    id: 'q_motivation',
    label: 'Motivations pour rejoindre cette initiative',
    key: 'motivation',
    type: 'long_text',
    category: 'Engagement & Projets',
    help_text: 'Présentez brièvement vos motivations, idées ou attentes.',
    placeholder: 'Expliquez en quelques lignes votre intérêt pour ce projet...',
    required: true,
    options: []
  },
  {
    id: 'q_club_committees',
    label: "Pôles d'activités souhaités au club",
    key: 'poles_activite',
    type: 'checkboxes',
    category: 'Engagement & Projets',
    help_text: "Sélectionnez un ou plusieurs comités selon vos centres d'intérêt.",
    placeholder: null,
    required: false,
    options: [
      { label: 'Formation Médicale & Ateliers Pratiques (SCOME)', value: 'scome' },
      { label: 'Santé Publique, Dépistages & Caravanes Médicales (SCOPH)', value: 'scoph' },
      { label: "Santé Reproductive & Droits Humains (SCORA/SCORP)", value: 'scora' },
      { label: 'Recherche Scientifique & Publications Médicales (SCORE)', value: 'score' },
      { label: 'Design Graphique, Audiovisuel & Communication', value: 'media' },
      { label: 'Logistique Événementielle & Sponsoring', value: 'logistics' }
    ]
  },
  {
    id: 'q_weekly_hours',
    label: 'Disponibilité hebdomadaire estimée',
    key: 'disponibilite_heures',
    type: 'radio',
    category: 'Engagement & Projets',
    help_text: 'Temps que vous pouvez consacrer aux projets et réunions.',
    placeholder: null,
    required: true,
    options: [
      { label: '1 à 2 heures par semaine (Ponctuel)', value: '1_2h' },
      { label: '3 à 5 heures par semaine (Régulier)', value: '3_5h' },
      { label: 'Plus de 5 heures par semaine (Très actif)', value: 'plus_5h' }
    ]
  },
  {
    id: 'q_prior_experience',
    label: 'Expérience associative ou bénévole préalable',
    key: 'experience_prealable',
    type: 'radio',
    category: 'Compétences & Talents',
    help_text: 'Avez-vous déjà milité ou participé à des projets associatifs ?',
    placeholder: null,
    required: false,
    options: [
      { label: 'Oui, au sein du New Era Medical Club', value: 'oui_nemc' },
      { label: 'Oui, dans un autre club ou association', value: 'oui_autre' },
      { label: 'Non, première expérience associative', value: 'non' }
    ]
  },
  {
    id: 'q_digital_skills',
    label: 'Compétences créatives & numériques',
    key: 'competences_creatives',
    type: 'checkboxes',
    category: 'Compétences & Talents',
    help_text: 'Cochez les domaines que vous maîtrisez.',
    placeholder: null,
    required: false,
    options: [
      { label: 'Design graphique (Photoshop, Canva, Illustrator)', value: 'design' },
      { label: 'Montage vidéo (CapCut, Premiere Pro, DaVinci)', value: 'video' },
      { label: 'Photographie & Couverture événementielle', value: 'photo' },
      { label: 'Animation & Prise de parole en public', value: 'speaking' },
      { label: 'Rédaction scientifique & Synthèse médicale', value: 'redaction' },
      { label: 'Développement web & Gestion de données', value: 'dev' }
    ]
  },
  {
    id: 'q_file_cv',
    label: "Curriculum Vitae ou Justificatif d'inscription (PDF)",
    key: 'fichier_cv',
    type: 'file',
    category: 'Documents & Fichiers',
    help_text: 'Format PDF uniquement, taille maximum 10 Mo.',
    placeholder: null,
    required: false,
    options: []
  },
  {
    id: 'q_consent',
    label: 'Engagement et consentement au traitement des données',
    key: 'consentement_rgpd',
    type: 'consent',
    category: 'Général',
    help_text: "En cochant cette case, vous certifiez l'exactitude des informations transmises et acceptez leur traitement par le comité d'organisation du New Era Medical Club.",
    placeholder: null,
    required: true,
    options: []
  }
];

async function seed() {
  const { data, error } = await client
    .from('question_bank')
    .upsert(questions, { onConflict: 'id' });
  
  if (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
  console.log(`Successfully seeded ${questions.length} questions into question_bank.`);
}

seed();
