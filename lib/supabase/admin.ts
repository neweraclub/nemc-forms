import {
  createAnonServerClient,
  createServiceRoleServerClient,
  fetchCloudSubmissions,
} from './server';
import { fetchCloudStoredForms, StoredFormData } from './forms-manager';
import { FormRecord, FormFieldRecord, SubmissionRecord } from '@/types/form';

export interface AdminFormSummary {
  form: FormRecord;
  fieldsCount: number;
  submissionsCount: number;
}

export interface AdminFormWithFields {
  form: FormRecord;
  fields: FormFieldRecord[];
  submissionsCount: number;
}

interface RawFormWithNested extends FormRecord {
  form_fields?: FormFieldRecord[];
  submissions?: Array<{ count: number }>;
}

/**
 * Retrieves all forms with their full list of questions/fields and submissions count.
 * 100% cloud-hosted on Supabase (PostgreSQL tables + Supabase Cloud Storage bucket).
 * Zero local disk reliance.
 */
export async function getAdminFormsWithFields(): Promise<AdminFormWithFields[]> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();
  const formsMap = new Map<string, AdminFormWithFields>();

  // 1. Try Supabase PostgreSQL if available
  try {
    const { data: dbForms, error } = await serviceClient
      .from('forms')
      .select('*, form_fields(*), submissions(count)')
      .order('created_at', { ascending: false });

    if (!error && dbForms && dbForms.length > 0) {
      for (const f of dbForms as unknown as RawFormWithNested[]) {
        if (f.slug) {
          formsMap.set(f.slug, {
            form: f,
            fields: (f.form_fields || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
            submissionsCount: f.submissions?.[0]?.count || 0,
          });
        }
      }
    }
  } catch (e) {
    console.warn('Supabase DB getAdminFormsWithFields query notice:', e);
  }

  // 2. Supabase Cloud Storage 'Html_forms' Registry
  let cloudItems: StoredFormData[] | null = null;
  try {
    cloudItems = await fetchCloudStoredForms();
  } catch {
    // ignore
  }

  const storageItems = cloudItems || [];

  let cloudSubs: SubmissionRecord[] | null = null;
  try {
    cloudSubs = await fetchCloudSubmissions();
  } catch {
    // ignore
  }
  const allSubs = cloudSubs || [];

  for (const item of storageItems) {
    if (item.form?.slug && !formsMap.has(item.form.slug)) {
      formsMap.set(item.form.slug, {
        form: item.form,
        fields: (item.fields || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
        submissionsCount: allSubs.filter((s) => s.form_id === item.form.id).length,
      });
    }
  }

  // Sort descending by updated_at or created_at
  return Array.from(formsMap.values()).sort((a, b) => {
    const timeA = new Date(a.form.updated_at || a.form.created_at || 0).getTime();
    const timeB = new Date(b.form.updated_at || b.form.created_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Summary view for the admin forms table.
 */
export async function getAdminForms(): Promise<AdminFormSummary[]> {
  const formsWithFields = await getAdminFormsWithFields();
  return formsWithFields.map((item) => ({
    form: item.form,
    fieldsCount: item.fields.length,
    submissionsCount: item.submissionsCount,
  }));
}

function normalizeEmailStatus(status: SubmissionRecord['email_status']): SubmissionRecord['email_status'] {
  return status === 'pending' ? 'sent' : status;
}

/**
 * Get all submissions across all forms directly from Supabase (for Statistics & Global Dashboard).
 */
export async function getAllAdminSubmissions(): Promise<SubmissionRecord[]> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  try {
    const { data: dbSubs, error } = await serviceClient
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbSubs && dbSubs.length > 0) {
      return (dbSubs as SubmissionRecord[]).map((s) => ({
        ...s,
        email_status: normalizeEmailStatus(s.email_status),
      }));
    }
  } catch {
    // ignore
  }

  try {
    const cloudSubs = await fetchCloudSubmissions();
    if (cloudSubs) {
      return cloudSubs.map((s) => ({
        ...s,
        email_status: normalizeEmailStatus(s.email_status),
      }));
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Retrieves submissions for a single form by slug directly from Supabase.
 */
export async function getAdminSubmissions(slug: string): Promise<{
  form: FormRecord | null;
  fields: FormFieldRecord[];
  submissions: SubmissionRecord[];
}> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  const cleanSlug = (slug || '').trim().toLowerCase();
  let decodedSlug = cleanSlug;
  try {
    decodedSlug = decodeURIComponent(cleanSlug);
  } catch {}

  let form: FormRecord | null = null;
  let fields: FormFieldRecord[] = [];
  let submissions: SubmissionRecord[] = [];

  try {
    const { data: formData } = await serviceClient
      .from('forms')
      .select('*')
      .or(`slug.eq.${cleanSlug},slug.eq.${decodedSlug}`)
      .maybeSingle();

    if (formData) {
      form = formData as FormRecord;
      const { data: fieldData } = await serviceClient
        .from('form_fields')
        .select('*')
        .eq('form_id', form.id)
        .order('position', { ascending: true });

      if (fieldData) fields = fieldData as FormFieldRecord[];

      const { data: subData } = await serviceClient
        .from('submissions')
        .select('*')
        .eq('form_id', form.id)
        .order('created_at', { ascending: false });

      if (subData) {
        submissions = (subData as SubmissionRecord[]).map((s) => ({
          ...s,
          email_status: normalizeEmailStatus(s.email_status),
        }));
      }
    }
  } catch (e) {
    console.warn('Admin getAdminSubmissions query notice:', e);
  }

  // Fallback to unified Supabase cloud storage registry if form not in DB or fields are empty
  if (!form || fields.length === 0) {
    try {
      const cloudForms = await fetchCloudStoredForms();
      if (cloudForms) {
        const found = cloudForms.find((item) => {
          const s = (item.form?.slug || '').trim().toLowerCase();
          let sDec = s;
          try {
            sDec = decodeURIComponent(s);
          } catch {}
          const id = (item.form?.id || '').trim().toLowerCase();
          return (
            s === cleanSlug ||
            s === decodedSlug ||
            sDec === cleanSlug ||
            sDec === decodedSlug ||
            id === cleanSlug ||
            id === decodedSlug
          );
        });

        if (found) {
          form = found.form;
          fields = (found.fields || []).sort((a, b) => (a.position || 0) - (b.position || 0));
        }
      }
    } catch (e) {
      console.warn('Fallback to cloud registry in getAdminSubmissions error:', e);
    }
  }

  if (form && submissions.length === 0) {
    let cloudSubs: SubmissionRecord[] | null = null;
    try {
      cloudSubs = await fetchCloudSubmissions();
    } catch {}
    const allSubs = cloudSubs || [];
    submissions = allSubs
      .filter((s) => s.form_id === form?.id)
      .map((s) => ({
        ...s,
        email_status: normalizeEmailStatus(s.email_status),
      }));
  }

  return { form, fields, submissions };
}
