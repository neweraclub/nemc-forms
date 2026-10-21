import {
  createAnonServerClient,
  createServiceRoleServerClient,
  getLocalSubmissions,
  getLocalStoredForms,
  StoredFormData,
} from './server';
import { fetchCloudStoredForms } from './forms-manager';
import { FormRecord, FormFieldRecord, SubmissionRecord } from '@/types/form';
import { SAMPLE_RECRUITMENT_FIELDS, SAMPLE_RECRUITMENT_FORM } from '@/lib/sample-seed';

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
 * Seamlessly integrates Supabase PostgreSQL, Supabase Cloud Storage (Html_forms registry),
 * and local storage fallback.
 */
export async function getAdminFormsWithFields(): Promise<AdminFormWithFields[]> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  // 1. Try PostgreSQL if available
  try {
    const { data: dbForms, error } = await serviceClient
      .from('forms')
      .select('*, form_fields(*), submissions(count)')
      .order('created_at', { ascending: false });

    if (!error && dbForms && dbForms.length > 0) {
      return (dbForms as unknown as RawFormWithNested[]).map((f) => ({
        form: f,
        fields: (f.form_fields || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
        submissionsCount: f.submissions?.[0]?.count || 0,
      }));
    }
  } catch (e) {
    console.warn('PostgreSQL getAdminFormsWithFields query notice:', e);
  }

  // 2. Cloud Storage 'Html_forms' Registry & Local Fallback
  let cloudItems: StoredFormData[] | null = null;
  try {
    cloudItems = await fetchCloudStoredForms();
  } catch {
    // ignore
  }

  const map = new Map<string, StoredFormData>();

  if (cloudItems !== null) {
    // Cloud Storage is authoritative
    for (const item of cloudItems) {
      if (item.form?.slug) {
        map.set(item.form.slug, item);
      }
    }
  } else {
    // Fall back to local items only if Cloud Storage was unreachable
    const localItems = getLocalStoredForms();
    for (const item of localItems) {
      if (item.form?.slug) {
        map.set(item.form.slug, item);
      }
    }
  }

  const allSubs = getLocalSubmissions();

  const results: AdminFormWithFields[] = Array.from(map.values()).map((item) => ({
    form: item.form,
    fields: (item.fields || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
    submissionsCount: allSubs.filter((s) => s.form_id === item.form.id).length,
  }));

  // Sort descending by updated_at or created_at
  return results.sort((a, b) => {
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

export async function getAdminSubmissions(slug: string): Promise<{
  form: FormRecord | null;
  fields: FormFieldRecord[];
  submissions: SubmissionRecord[];
}> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  let form: FormRecord | null = null;
  let fields: FormFieldRecord[] = [];
  let submissions: SubmissionRecord[] = [];

  try {
    const { data: formData } = await serviceClient
      .from('forms')
      .select('*')
      .eq('slug', slug)
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

      if (subData) submissions = subData as SubmissionRecord[];
    }
  } catch (e) {
    console.warn('Admin getAdminSubmissions query fallback:', e);
  }

  // Fallback to unified cloud & local registry
  if (!form) {
    const all = await getAdminFormsWithFields();
    const found = all.find((item) => item.form.slug === slug);
    if (found) {
      form = found.form;
      fields = found.fields;
      submissions = getLocalSubmissions().filter((s) => s.form_id === form?.id);
    }
  }

  return { form, fields, submissions };
}
