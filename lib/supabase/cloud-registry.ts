import { FormFieldRecord, FormRecord, SubmissionRecord } from '@/types/form';
import { createClient } from '@supabase/supabase-js';

export interface StoredFormData {
  form: FormRecord;
  fields: FormFieldRecord[];
}

const REGISTRY_STORAGE_FILE = '_nemc_registry/forms.json';
const SUBMISSIONS_STORAGE_FILE = '_nemc_registry/submissions.json';

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

// Deprecated local storage shims (retained as in-memory / no-op for backward compatibility)
export function getLocalStoredForms(): StoredFormData[] {
  return [];
}
export function saveLocalCustomForm(_form: FormRecord, _fields: FormFieldRecord[]) {}
export function syncLocalFormsWithCloud(_forms: StoredFormData[]) {}
export function deleteLocalCustomForm(_slugOrId: string) {}
export function deleteLocalSubmissionsForForm(_slugOrId: string) {}
