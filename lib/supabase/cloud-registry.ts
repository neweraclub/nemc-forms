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

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

export function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export function createServiceClient() {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch forms registry directly from Supabase Storage bucket 'Html_forms'.
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
 */
export async function saveCloudStoredForms(forms: StoredFormData[]): Promise<boolean> {
  const client = createServiceClient();
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
 */
export async function saveCloudSubmissions(subs: SubmissionRecord[]): Promise<boolean> {
  const client = createServiceClient();
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

/**
 * Fetch defined target roles directly from Supabase DB table `public.target_roles`
 * with fallback to Cloud Storage bucket. Returns empty array if none found (zero hardcoded static data).
 */
export async function fetchCloudRoles(): Promise<TargetRoleDefinition[]> {
  const client = createAnonClient();

  // 1. Primary: Supabase PostgreSQL table public.target_roles
  try {
    const { data, error } = await client
      .from('target_roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as TargetRoleDefinition[];
    }
  } catch (err) {
    console.warn('fetchCloudRoles table notice:', err);
  }

  // 2. Secondary: Supabase Storage file
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
    console.warn('fetchCloudRoles storage fetch notice:', err);
  }

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

  return [];
}

/**
 * Persist target roles directly to Supabase PostgreSQL table `public.target_roles`
 * and sync with Cloud Storage.
 */
export async function saveCloudRoles(roles: TargetRoleDefinition[]): Promise<boolean> {
  const client = createServiceClient();

  // 1. Save to Supabase PostgreSQL table public.target_roles
  try {
    if (roles.length > 0) {
      const { error: upsertErr } = await client.from('target_roles').upsert(
        roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || null,
          color: r.color || '#3B33FF',
          icon: r.icon || '🎯',
          created_at: r.created_at || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
      if (upsertErr) {
        console.warn('saveCloudRoles DB upsert notice:', upsertErr.message);
      }
    }
  } catch (err) {
    console.warn('saveCloudRoles DB notice:', err);
  }

  // 2. Sync to Supabase Storage
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
      console.warn('saveCloudRoles storage notice:', error.message);
    }
  } catch (err) {
    console.warn('saveCloudRoles storage notice:', err);
  }

  return true;
}

/**
 * Delete a target role from Supabase DB table and update storage.
 */
export async function deleteCloudRole(roleId: string): Promise<boolean> {
  const client = createServiceClient();

  // 1. Delete from PostgreSQL
  try {
    await client.from('target_roles').delete().eq('id', roleId);
  } catch (err) {
    console.warn('deleteCloudRole DB notice:', err);
  }

  // 2. Update storage
  try {
    const current = await fetchCloudRoles();
    const filtered = current.filter((r) => r.id !== roleId);
    const jsonStr = JSON.stringify(filtered, null, 2);
    await client.storage
      .from('Html_forms')
      .upload(ROLES_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });
  } catch {}

  return true;
}

/**
 * Fetch reusable question bank directly from Supabase DB table `public.question_bank`
 * with fallback to Cloud Storage. Returns empty array if none found (zero hardcoded static data).
 */
export async function fetchCloudQuestionBank(): Promise<BankQuestionRecord[]> {
  const client = createAnonClient();

  // 1. Primary: Supabase PostgreSQL table public.question_bank
  try {
    const { data, error } = await client
      .from('question_bank')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as BankQuestionRecord[];
    }
  } catch (err) {
    console.warn('fetchCloudQuestionBank table notice:', err);
  }

  // 2. Secondary: Supabase Storage file
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
    console.warn('fetchCloudQuestionBank storage notice:', err);
  }

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

  return [];
}

/**
 * Persist reusable question bank directly to Supabase PostgreSQL table `public.question_bank`
 * and sync with Cloud Storage.
 */
export async function saveCloudQuestionBank(questions: BankQuestionRecord[]): Promise<boolean> {
  const client = createServiceClient();

  // 1. Save to Supabase PostgreSQL table public.question_bank
  try {
    if (questions.length > 0) {
      const { error: upsertErr } = await client.from('question_bank').upsert(
        questions.map((q) => ({
          id: q.id,
          label: q.label,
          key: q.key,
          type: q.type,
          category: q.category || 'Général',
          help_text: q.help_text || null,
          placeholder: q.placeholder || null,
          required: q.required ?? false,
          options: q.options || [],
          created_at: q.created_at || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
      if (upsertErr) {
        console.warn('saveCloudQuestionBank DB notice:', upsertErr.message);
      }
    }
  } catch (err) {
    console.warn('saveCloudQuestionBank DB notice:', err);
  }

  // 2. Sync to Supabase Storage
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
      console.warn('saveCloudQuestionBank storage notice:', error.message);
    }
  } catch (err) {
    console.warn('saveCloudQuestionBank storage notice:', err);
  }

  return true;
}

/**
 * Delete a question from Supabase DB table and update storage.
 */
export async function deleteCloudQuestion(questionId: string): Promise<boolean> {
  const client = createServiceClient();

  // 1. Delete from PostgreSQL
  try {
    await client.from('question_bank').delete().eq('id', questionId);
  } catch (err) {
    console.warn('deleteCloudQuestion DB notice:', err);
  }

  // 2. Update storage
  try {
    const current = await fetchCloudQuestionBank();
    const filtered = current.filter((q) => q.id !== questionId);
    const jsonStr = JSON.stringify(filtered, null, 2);
    await client.storage
      .from('Html_forms')
      .upload(QUESTION_BANK_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });
  } catch {}

  return true;
}

// Deprecated local storage shims
export function getLocalStoredForms(): StoredFormData[] {
  return [];
}
export function saveLocalCustomForm(_form: FormRecord, _fields: FormFieldRecord[]) {}
export function syncLocalFormsWithCloud(_forms: StoredFormData[]) {}
export function deleteLocalCustomForm(_slugOrId: string) {}
export function deleteLocalSubmissionsForForm(_slugOrId: string) {}
