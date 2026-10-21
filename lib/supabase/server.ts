import { createClient } from '@supabase/supabase-js';
import { FormFieldRecord, FormRecord, FormStateEvaluation, SubmissionRecord } from '@/types/form';
import {
  StoredFormData,
  getLocalStoredForms,
  fetchCloudStoredForms,
  fetchCloudSubmissions,
  saveCloudSubmissions,
} from './cloud-registry';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://aysysyrjqhqrcqoinbgx.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3lzeXJqcWhxcmNxb2luYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTQ4NjEsImV4cCI6MjEwNDAzMDg2MX0.BYCjCewjcfGMm-fTtuZf2NNiQkfx3n8SD1bhg_MoRJ0';

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client respecting RLS
export function createAnonServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// Elevated service role client for Server Actions (RLS bypass)
export function createServiceRoleServerClient() {
  if (
    !supabaseServiceRoleKey ||
    supabaseServiceRoleKey.includes('...') ||
    supabaseServiceRoleKey.trim().length < 50
  ) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type { StoredFormData };
export { getLocalStoredForms, fetchCloudSubmissions, saveCloudSubmissions };

// In-memory hot cache for zero-disk, ultra-fast responses
let memorySubmissionsCache: SubmissionRecord[] = [];

/**
 * Fetch all submissions directly from Supabase (PostgreSQL or Supabase Storage).
 */
export async function getSubmissionsFromSupabase(): Promise<SubmissionRecord[]> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  try {
    const { data, error } = await serviceClient
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      memorySubmissionsCache = data as SubmissionRecord[];
      return memorySubmissionsCache;
    }
  } catch {
    // DB query notice
  }

  try {
    const cloudSubs = await fetchCloudSubmissions();
    if (cloudSubs && cloudSubs.length > 0) {
      memorySubmissionsCache = cloudSubs;
      return cloudSubs;
    }
  } catch {
    // Cloud storage notice
  }

  return memorySubmissionsCache;
}

/**
 * Persists a submission directly to Supabase.
 * Zero local disk writes.
 */
export async function saveSubmissionToSupabase(sub: SubmissionRecord): Promise<void> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  // 1. Try PostgreSQL insertion
  try {
    await serviceClient.from('submissions').insert({
      id: sub.id,
      form_id: sub.form_id,
      answers: sub.answers,
      submitter_email: sub.submitter_email,
      created_at: sub.created_at,
      email_status: sub.email_status,
      ip_hash: sub.ip_hash,
      user_agent: sub.user_agent,
      idempotency_key: sub.idempotency_key,
    });
  } catch (err) {
    console.warn('Supabase DB submission insert note:', err);
  }

  // 2. Also persist to Supabase Cloud Storage
  try {
    const current = (await fetchCloudSubmissions()) || memorySubmissionsCache;
    const exists = current.some(
      (s) => s.id === sub.id || (s.idempotency_key && s.idempotency_key === sub.idempotency_key)
    );
    if (!exists) {
      current.unshift(sub);
      memorySubmissionsCache = current;
      await saveCloudSubmissions(current);
    }
  } catch (err) {
    console.warn('Supabase Cloud Storage submission sync note:', err);
  }
}

/**
 * Updates submission email status in Supabase.
 * Zero local disk writes.
 */
export async function updateSubmissionEmailStatusInSupabase(
  id: string,
  status: SubmissionRecord['email_status']
): Promise<void> {
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();

  try {
    await serviceClient.from('submissions').update({ email_status: status }).eq('id', id);
  } catch {
    // ignore
  }

  try {
    const current = (await fetchCloudSubmissions()) || memorySubmissionsCache;
    const target = current.find((s) => s.id === id);
    if (target) {
      target.email_status = status;
      memorySubmissionsCache = current;
      await saveCloudSubmissions(current);
    }
  } catch {
    // ignore
  }
}

// Backward-compatible shims for legacy callers (100% in-memory / Supabase, NO disk access)
export function getLocalSubmissions(): SubmissionRecord[] {
  return memorySubmissionsCache;
}

export function saveLocalSubmission(sub: SubmissionRecord): void {
  saveSubmissionToSupabase(sub).catch((e) => console.warn('saveLocalSubmission async err:', e));
}

export function updateLocalSubmissionEmailStatus(
  id: string,
  status: SubmissionRecord['email_status']
): void {
  updateSubmissionEmailStatusInSupabase(id, status).catch((e) =>
    console.warn('updateLocalSubmissionEmailStatus async err:', e)
  );
}

/**
 * Fetch form by slug and its associated fields directly from Supabase.
 * 100% cloud-hosted on Supabase.
 */
export async function getFormBySlug(slug: string): Promise<{
  form: FormRecord | null;
  fields: FormFieldRecord[];
  state: FormStateEvaluation;
}> {
  const client = createAnonServerClient();

  let form: FormRecord | null = null;
  let fields: FormFieldRecord[] = [];

  // 1. Try Supabase PostgreSQL
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
    console.warn('Supabase DB query notice:', e);
  }

  // 2. Authoritative Supabase Cloud Storage Registry
  if (!form) {
    try {
      const cloud = await fetchCloudStoredForms();
      if (cloud !== null) {
        const found = cloud.find(
          (item) => item.form.slug?.toLowerCase() === slug.toLowerCase() || item.form.id === slug
        );
        if (found) {
          form = found.form;
          fields = found.fields;
        }
      }
    } catch {
      // ignore
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
      timeZone: 'Africa/Algiers',
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
      count = 0;
    }

    if (count === 0) {
      try {
        const cloudSubs = await fetchCloudSubmissions();
        if (cloudSubs) {
          count = cloudSubs.filter((s) => s.form_id === form?.id).length;
        }
      } catch {
        // ignore
      }
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
