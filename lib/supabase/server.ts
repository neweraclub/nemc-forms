import { createClient } from '@supabase/supabase-js';
import { FormFieldRecord, FormRecord, FormStateEvaluation, SubmissionRecord } from '@/types/form';
import { SAMPLE_RECRUITMENT_FIELDS, SAMPLE_RECRUITMENT_FORM } from '@/lib/sample-seed';
import fs from 'fs';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://aysysyrjqhqrcqoinbgx.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_ykDYxnsHMXN58NOlvq9Lnw_v9Pv6V--';

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard public client respecting RLS
export function createAnonServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// Elevated service role client for Server Actions (RLS bypass)
export function createServiceRoleServerClient() {
  if (!supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import {
  StoredFormData,
  getLocalStoredForms,
  fetchCloudStoredForms,
  ensureLocalStorage,
  getLocalSubmissionsFilePath,
} from './cloud-registry';

export type { StoredFormData };
export { getLocalStoredForms };

export function getLocalSubmissions(): SubmissionRecord[] {
  try {
    ensureLocalStorage();
    const file = getLocalSubmissionsFilePath();
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalSubmission(sub: SubmissionRecord): void {
  try {
    ensureLocalStorage();
    const all = getLocalSubmissions();
    // Check idempotency in local store
    const existing = all.find((s) => s.idempotency_key && s.idempotency_key === sub.idempotency_key);
    if (!existing) {
      all.push(sub);
      fs.writeFileSync(getLocalSubmissionsFilePath(), JSON.stringify(all, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to save local submission:', err);
  }
}

export function updateLocalSubmissionEmailStatus(id: string, status: SubmissionRecord['email_status']) {
  try {
    ensureLocalStorage();
    const all = getLocalSubmissions();
    const target = all.find((s) => s.id === id);
    if (target) {
      target.email_status = status;
      fs.writeFileSync(getLocalSubmissionsFilePath(), JSON.stringify(all, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to update local email status:', err);
  }
}

/**
 * Fetch form by slug and its associated fields in correct position order.
 */
export async function getFormBySlug(slug: string): Promise<{
  form: FormRecord | null;
  fields: FormFieldRecord[];
  state: FormStateEvaluation;
}> {
  const client = createAnonServerClient();

  let form: FormRecord | null = null;
  let fields: FormFieldRecord[] = [];

  try {
    const { data: formData, error: formError } = await client
      .from('forms')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!formError && formData) {
      form = formData as FormRecord;
      const { data: fieldData, error: fieldError } = await client
        .from('form_fields')
        .select('*')
        .eq('form_id', form.id)
        .order('position', { ascending: true });

      if (!fieldError && fieldData) {
        fields = fieldData as FormFieldRecord[];
      }
    }
  } catch (e) {
    console.warn('Supabase query error, falling back to seed if matched:', e);
  }

  // Graceful fallback for custom forms or seed if DB tables not yet migrated
  if (!form) {
    const local = getLocalStoredForms().find((item) => item.form.slug === slug);
    if (local) {
      form = local.form;
      fields = local.fields;
    } else {
      try {
        const cloud = await fetchCloudStoredForms();
        const found = cloud?.find((item) => item.form.slug === slug);
        if (found) {
          form = found.form;
          fields = found.fields;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!form) {
    return {
      form: null,
      fields: [],
      state: {
        isAvailable: false,
        code: 'closed',
        message: 'Ce formulaire n’existe pas ou a été supprimé.',
      },
    };
  }

  // Evaluate form availability
  const now = new Date();
  if (form.status === 'draft') {
    return {
      form,
      fields,
      state: {
        isAvailable: false,
        code: 'draft',
        message: 'Ce formulaire est en cours de préparation.',
        detail: 'Il sera ouvert aux candidatures très prochainement.',
      },
    };
  }

  if (form.status === 'closed') {
    return {
      form,
      fields,
      state: {
        isAvailable: false,
        code: 'closed',
        message: 'Ce formulaire est actuellement clôturé.',
        detail: 'La période de soumission est terminée.',
      },
    };
  }

  if (form.opens_at && new Date(form.opens_at) > now) {
    const openDate = new Date(form.opens_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      form,
      fields,
      state: {
        isAvailable: false,
        code: 'not_yet_open',
        message: 'Les soumissions n’ont pas encore débuté.',
        detail: `Ouverture prévue le ${openDate}.`,
      },
    };
  }

  if (form.closes_at && new Date(form.closes_at) < now) {
    return {
      form,
      fields,
      state: {
        isAvailable: false,
        code: 'expired',
        message: 'La date limite de soumission est dépassée.',
        detail: 'Le formulaire n’accepte plus de réponses.',
      },
    };
  }

  // Check max responses limit if defined
  if (form.max_responses && form.max_responses > 0) {
    let count = 0;
    try {
      const { count: dbCount } = await client
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', form.id);
      count = dbCount || 0;
    } catch {
      count = getLocalSubmissions().filter((s) => s.form_id === form?.id).length;
    }

    if (count >= form.max_responses) {
      return {
        form,
        fields,
        state: {
          isAvailable: false,
          code: 'capacity_reached',
          message: 'Le nombre maximal de candidatures a été atteint.',
          detail: 'Les inscriptions pour cette session sont désormais complètes.',
        },
      };
    }
  }

  return {
    form,
    fields,
    state: {
      isAvailable: true,
      code: 'available',
      message: 'Formulaire disponible.',
    },
  };
}
