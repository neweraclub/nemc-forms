import { FormFieldRecord, FormRecord } from '@/types/form';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export interface StoredFormData {
  form: FormRecord;
  fields: FormFieldRecord[];
}

const REGISTRY_STORAGE_FILE = '_nemc_registry/forms.json';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://aysysyrjqhqrcqoinbgx.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_ykDYxnsHMXN58NOlvq9Lnw_v9Pv6V--';

function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export function getStorageDir() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', '.local_data');
  }
  return path.join(process.cwd(), '.local_data');
}

export function getLocalFormsFilePath() {
  return path.join(getStorageDir(), 'custom_forms.json');
}

export function getLocalSubmissionsFilePath() {
  return path.join(getStorageDir(), 'submissions.json');
}

export function ensureLocalStorage() {
  try {
    const dir = getStorageDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const formsFile = getLocalFormsFilePath();
    if (!fs.existsSync(formsFile)) {
      fs.writeFileSync(formsFile, JSON.stringify([], null, 2), 'utf-8');
    }
    const subsFile = getLocalSubmissionsFilePath();
    if (!fs.existsSync(subsFile)) {
      fs.writeFileSync(subsFile, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    console.warn('ensureLocalStorage notice:', err);
  }
}

/**
 * Fetch forms registry directly from Supabase Storage bucket 'Html_forms'.
 * Guarantees cross-instance and cross-deployment persistence in serverless environments.
 */
export async function fetchCloudStoredForms(): Promise<StoredFormData[] | null> {
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
  const client = createAnonClient();
  try {
    const jsonStr = JSON.stringify(forms, null, 2);
    const { error } = await client.storage
      .from('Html_forms')
      .upload(REGISTRY_STORAGE_FILE, Buffer.from(jsonStr, 'utf-8'), {
        contentType: 'application/json',
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

export function getLocalStoredForms(): StoredFormData[] {
  try {
    ensureLocalStorage();
    const file = getLocalFormsFilePath();
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomForm(form: FormRecord, fields: FormFieldRecord[]) {
  try {
    ensureLocalStorage();
    const all = getLocalStoredForms();
    const existingIndex = all.findIndex(
      (item) => item.form.slug === form.slug || item.form.id === form.id
    );
    if (existingIndex >= 0) {
      all[existingIndex] = { form, fields };
    } else {
      all.push({ form, fields });
    }
    const file = getLocalFormsFilePath();
    fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.warn('saveLocalCustomForm fallback warning:', err);
  }
}

export function deleteLocalCustomForm(slug: string) {
  try {
    ensureLocalStorage();
    const all = getLocalStoredForms().filter((item) => item.form.slug !== slug);
    const file = getLocalFormsFilePath();
    fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.warn('deleteLocalCustomForm warning:', err);
  }
}
