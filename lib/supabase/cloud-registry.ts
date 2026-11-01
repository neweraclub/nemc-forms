import {
  FormFieldRecord,
  FormRecord,
  SubmissionRecord,
  TargetRoleDefinition,
  BankQuestionRecord,
} from '@/types/form';
import { createClient } from '@supabase/supabase-js';

export interface StoredFormData {
  form: FormRecord;
  fields: FormFieldRecord[];
}

const REGISTRY_STORAGE_FILE = '_nemc_registry/forms.json';
const SUBMISSIONS_STORAGE_FILE = '_nemc_registry/submissions.json';
const ROLES_STORAGE_FILE = '_nemc_registry/target_roles.json';
const QUESTION_BANK_STORAGE_FILE = '_nemc_registry/question_bank.json';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://aysysyrjqhqrcqoinbgx.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3lzeXJqcWhxcmNxb2luYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTQ4NjEsImV4cCI6MjEwNDAzMDg2MX0.BYCjCewjcfGMm-fTtuZf2NNiQkfx3n8SD1bhg_MoRJ0';

function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch forms registry directly from Supabase Storage bucket 'Html_forms'.
 * Uses timestamp cache-busting and no-store to guarantee immediate synchronization.
 */
export async function fetchCloudStoredForms(): Promise<StoredFormData[] | null> {
  try {
    const fetchUrl = `${supabaseUrl}/storage/v1/object/Html_forms/${REGISTRY_STORAGE_FILE}?t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const parsed = (await res.json()) as StoredFormData[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('fetchCloudStoredForms direct fetch warning:', err);
  }

  // Fallback to client.storage.download
  const client = createAnonClient();
  try {
    const { data, error } = await client.storage
      .from('Html_forms')
      .download(REGISTRY_STORAGE_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as StoredFormData[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Registry not yet created or offline
  }
  return null;
}

/**
 * Upload forms registry to Supabase Storage bucket 'Html_forms'.
 * Explicitly sets cacheControl to 0 so updates propagate instantly worldwide.
 */
export async function saveCloudStoredForms(forms: StoredFormData[]): Promise<boolean> {
  const client = createAnonClient();
  try {
    const jsonStr = JSON.stringify(forms, null, 2);
    const { error } = await client.storage
      .from('Html_forms')
      .upload(REGISTRY_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });

    if (error) {
      console.warn('saveCloudStoredForms warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveCloudStoredForms exception:', err);
    return false;
  }
}

/**
 * Fetch submissions registry directly from Supabase Storage bucket 'Html_forms'.
 * Uses timestamp cache-busting and no-store to guarantee immediate synchronization.
 */
export async function fetchCloudSubmissions(): Promise<SubmissionRecord[] | null> {
  try {
    const fetchUrl = `${supabaseUrl}/storage/v1/object/Html_forms/${SUBMISSIONS_STORAGE_FILE}?t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const parsed = (await res.json()) as SubmissionRecord[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('fetchCloudSubmissions direct fetch warning:', err);
  }

  // Fallback to client.storage.download
  const client = createAnonClient();
  try {
    const { data, error } = await client.storage
      .from('Html_forms')
      .download(SUBMISSIONS_STORAGE_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as SubmissionRecord[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Registry not yet created or offline
  }
  return null;
}

/**
 * Upload submissions registry to Supabase Storage bucket 'Html_forms'.
 * Explicitly sets cacheControl to 0 so updates propagate instantly worldwide.
 */
export async function saveCloudSubmissions(subs: SubmissionRecord[]): Promise<boolean> {
  const client = createAnonClient();
  try {
    const jsonStr = JSON.stringify(subs, null, 2);
    const { error } = await client.storage
      .from('Html_forms')
      .upload(SUBMISSIONS_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });

    if (error) {
      console.warn('saveCloudSubmissions warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveCloudSubmissions exception:', err);
    return false;
  }
}

export const DEFAULT_TARGET_ROLES: TargetRoleDefinition[] = [
  {
    id: 'role_medecin',
    name: 'Médecin / Praticien',
    description: 'Médecins spécialistes, généralistes, résidents hospitaliers et praticiens de santé',
    color: '#3B33FF',
    icon: '🩺',
  },
  {
    id: 'role_etudiant',
    name: 'Étudiant en Médecine',
    description: 'Étudiants en médecine (1ère à 6ème année), externes et internes hospitaliers',
    color: '#8B3EE1',
    icon: '🎓',
  },
  {
    id: 'role_professeur',
    name: 'Professeur / Enseignant',
    description: 'Professeurs, maîtres de conférences, chercheurs et chefs de service hospitalo-universitaires',
    color: '#E53888',
    icon: '👨‍🏫',
  },
  {
    id: 'role_participant',
    name: 'Participant / Externe',
    description: 'Membres d’associations médicales partenaires, soignants et participants libres',
    color: '#10B981',
    icon: '🤝',
  },
];

export const DEFAULT_QUESTION_BANK: BankQuestionRecord[] = [
  {
    id: 'bq_nom',
    category: 'Identité & Contact',
    type: 'short_text',
    key: 'full_name',
    label: 'Nom et Prénom complets',
    help_text: 'Votre nom d’usage académique ou hospitalier',
    placeholder: 'Ex. Dr. Sarah Benali',
    required: true,
  },
  {
    id: 'bq_email',
    category: 'Identité & Contact',
    type: 'email',
    key: 'email',
    label: 'Adresse email officielle',
    help_text: 'Indispensable pour recevoir l’accusé de réception et vos convocations',
    placeholder: 'sarah.benali@univ-ouargla.dz',
    required: true,
  },
  {
    id: 'bq_phone',
    category: 'Identité & Contact',
    type: 'phone',
    key: 'phone',
    label: 'Numéro de téléphone (WhatsApp)',
    help_text: 'Pour les communications rapides et groupes d’organisation',
    placeholder: '0660 00 00 00',
    required: true,
  },
  {
    id: 'bq_specialty',
    category: 'Cursus & Profession',
    type: 'short_text',
    key: 'specialty',
    label: 'Spécialité médicale ou Service',
    help_text: 'Ex. Cardiologie, Urgences, Chirurgie pédiatrique...',
    placeholder: 'Votre spécialité ou service...',
    required: false,
  },
  {
    id: 'bq_year',
    category: 'Cursus & Profession',
    type: 'select',
    key: 'academic_level',
    label: 'Niveau d’études ou Statut professionnel',
    help_text: 'Sélectionnez votre situation actuelle',
    required: true,
    options: [
      { label: '1ère Année Médecine', value: 'med_1' },
      { label: '2ème Année Médecine', value: 'med_2' },
      { label: '3ème Année Médecine', value: 'med_3' },
      { label: 'Externe (4ème à 6ème Année)', value: 'externe' },
      { label: 'Interne / Résident en médecine', value: 'resident' },
      { label: 'Médecin Généraliste / Praticien', value: 'praticien' },
      { label: 'Professeur / Chef de Service', value: 'professeur' },
    ],
  },
  {
    id: 'bq_faculty',
    category: 'Cursus & Profession',
    type: 'short_text',
    key: 'affiliation',
    label: 'Faculté ou Établissement de rattachement',
    help_text: 'Ex. Faculté de Médecine Ouargla, EPH Mohamed Boudiaf...',
    placeholder: 'Votre établissement...',
    required: false,
  },
  {
    id: 'bq_motivation',
    category: 'Motivation & Objectifs',
    type: 'long_text',
    key: 'motivation',
    label: 'Motivations & Attentes pour cette session',
    help_text: 'Décrivez vos objectifs d’apprentissage ou de contribution',
    placeholder: 'Exposez vos motivations et vos disponibilités...',
    required: true,
    validation: { minLength: 20 },
  },
  {
    id: 'bq_proof',
    category: 'Justificatifs',
    type: 'file',
    key: 'proof_doc',
    label: 'Carte d’étudiant ou Justificatif professionnel',
    help_text: 'Document officiel au format PDF, JPG ou PNG (max 10 Mo)',
    placeholder: 'Déposer le justificatif...',
    required: false,
  },
  {
    id: 'bq_consent',
    category: 'Conditions & Éthique',
    type: 'consent',
    key: 'club_rules_consent',
    label: 'Engagement déontologique et assiduité',
    help_text: 'J’atteste sur l’honneur l’exactitude de mes déclarations et m’engage à respecter la déontologie du New Era Medical Club.',
    required: true,
  },
];

/**
 * Fetch defined target roles from Supabase Storage bucket 'Html_forms'.
 */
export async function fetchCloudRoles(): Promise<TargetRoleDefinition[]> {
  try {
    const fetchUrl = `${supabaseUrl}/storage/v1/object/Html_forms/${ROLES_STORAGE_FILE}?t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const parsed = (await res.json()) as TargetRoleDefinition[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('fetchCloudRoles notice:', err);
  }

  // Fallback to client.storage.download
  const client = createAnonClient();
  try {
    const { data, error } = await client.storage
      .from('Html_forms')
      .download(ROLES_STORAGE_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as TargetRoleDefinition[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_TARGET_ROLES;
}

/**
 * Upload target roles to Supabase Storage bucket 'Html_forms'.
 */
export async function saveCloudRoles(roles: TargetRoleDefinition[]): Promise<boolean> {
  const client = createAnonClient();
  try {
    const jsonStr = JSON.stringify(roles, null, 2);
    const { error } = await client.storage
      .from('Html_forms')
      .upload(ROLES_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });

    if (error) {
      console.warn('saveCloudRoles warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveCloudRoles exception:', err);
    return false;
  }
}

/**
 * Fetch pre-created question bank from Supabase Storage bucket 'Html_forms'.
 */
export async function fetchCloudQuestionBank(): Promise<BankQuestionRecord[]> {
  try {
    const fetchUrl = `${supabaseUrl}/storage/v1/object/Html_forms/${QUESTION_BANK_STORAGE_FILE}?t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const parsed = (await res.json()) as BankQuestionRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('fetchCloudQuestionBank notice:', err);
  }

  // Fallback to client.storage.download
  const client = createAnonClient();
  try {
    const { data, error } = await client.storage
      .from('Html_forms')
      .download(QUESTION_BANK_STORAGE_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as BankQuestionRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_QUESTION_BANK;
}

/**
 * Upload pre-created question bank to Supabase Storage bucket 'Html_forms'.
 */
export async function saveCloudQuestionBank(questions: BankQuestionRecord[]): Promise<boolean> {
  const client = createAnonClient();
  try {
    const jsonStr = JSON.stringify(questions, null, 2);
    const { error } = await client.storage
      .from('Html_forms')
      .upload(QUESTION_BANK_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });

    if (error) {
      console.warn('saveCloudQuestionBank warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveCloudQuestionBank exception:', err);
    return false;
  }
}

// Deprecated local storage shims (retained as in-memory / no-op for backward compatibility)
export function getLocalStoredForms(): StoredFormData[] {
  return [];
}
export function saveLocalCustomForm(_form: FormRecord, _fields: FormFieldRecord[]) {}
export function syncLocalFormsWithCloud(_forms: StoredFormData[]) {}
export function deleteLocalCustomForm(_slugOrId: string) {}
export function deleteLocalSubmissionsForForm(_slugOrId: string) {}
