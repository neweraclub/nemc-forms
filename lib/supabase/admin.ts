import { createAnonServerClient, createServiceRoleServerClient, getLocalSubmissions } from './server';
import { FormRecord, FormFieldRecord, SubmissionRecord } from '@/types/form';
import { SAMPLE_RECRUITMENT_FIELDS, SAMPLE_RECRUITMENT_FORM } from '@/lib/sample-seed';

export interface AdminFormSummary {
  form: FormRecord;
  fieldsCount: number;
  submissionsCount: number;
}

interface RawFormWithCounts extends FormRecord {
  form_fields?: Array<{ count: number }>;
  submissions?: Array<{ count: number }>;
}

export async function getAdminForms(): Promise<AdminFormSummary[]> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  try {
    const { data: forms, error } = await serviceClient
      .from('forms')
      .select('*, form_fields(count), submissions(count)')
      .order('created_at', { ascending: false });

    if (!error && forms && forms.length > 0) {
      return (forms as unknown as RawFormWithCounts[]).map((f) => ({
        form: f,
        fieldsCount: f.form_fields?.[0]?.count || 0,
        submissionsCount: f.submissions?.[0]?.count || 0,
      }));
    }
  } catch (e) {
    console.warn('Admin getAdminForms query fallback:', e);
  }

  // Fallback to sample recruitment form
  const localSubs = getLocalSubmissions().filter(
    (s) => s.form_id === SAMPLE_RECRUITMENT_FORM.id
  );

  return [
    {
      form: SAMPLE_RECRUITMENT_FORM,
      fieldsCount: SAMPLE_RECRUITMENT_FIELDS.length,
      submissionsCount: localSubs.length,
    },
  ];
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

  if (!form && slug === 'recrutement-2026') {
    form = SAMPLE_RECRUITMENT_FORM;
    fields = SAMPLE_RECRUITMENT_FIELDS;
    submissions = getLocalSubmissions().filter((s) => s.form_id === form?.id);
  }

  return { form, fields, submissions };
}
