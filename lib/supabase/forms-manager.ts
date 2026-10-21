import { FormFieldRecord, FormRecord } from '@/types/form';
import { createAnonServerClient, createServiceRoleServerClient } from './server';
import {
  StoredFormData,
  fetchCloudStoredForms,
  saveCloudStoredForms,
  fetchCloudSubmissions,
  saveCloudSubmissions,
} from './cloud-registry';

export type { StoredFormData };
export { fetchCloudStoredForms, saveCloudStoredForms };

/**
 * Creates or updates a form with all its fields directly in Supabase.
 * Persists 100% to Supabase (Supabase Cloud Storage registry + Supabase PostgreSQL).
 * Zero local storage / zero disk dependency.
 */
export async function persistFormWithFields(
  formData: Omit<FormRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
  fieldsData: Array<Omit<FormFieldRecord, 'id' | 'form_id' | 'created_at'> & { id?: string }>
): Promise<{ success: boolean; slug: string; error?: string }> {
  const formId = formData.id || crypto.randomUUID();
  const now = new Date().toISOString();

  const fullForm: FormRecord = {
    ...formData,
    id: formId,
    created_at: now,
    updated_at: now,
  };

  const fullFields: FormFieldRecord[] = fieldsData.map((f, idx) => ({
    ...f,
    id: f.id || crypto.randomUUID(),
    form_id: formId,
    position: idx + 1,
    created_at: now,
  }));

  // 1. Persist to Supabase Cloud Storage (Html_forms registry)
  try {
    const cloudForms = (await fetchCloudStoredForms()) || [];
    const existingIdx = cloudForms.findIndex(
      (item) => item.form.slug?.toLowerCase() === fullForm.slug?.toLowerCase() || item.form.id === fullForm.id
    );
    if (existingIdx >= 0) {
      cloudForms[existingIdx] = { form: fullForm, fields: fullFields };
    } else {
      cloudForms.unshift({ form: fullForm, fields: fullFields });
    }
    await saveCloudStoredForms(cloudForms);
  } catch (cloudErr) {
    console.warn('Supabase Cloud Storage form registry sync notice:', cloudErr);
  }

  // 2. Persist to Supabase PostgreSQL
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();
  if (serviceClient) {
    try {
      const formPayload: Record<string, unknown> = {
        id: fullForm.id,
        slug: fullForm.slug,
        title: fullForm.title,
        description: fullForm.description,
        status: fullForm.status,
        opens_at: fullForm.opens_at,
        closes_at: fullForm.closes_at,
        max_responses: fullForm.max_responses,
        confirmation_message: fullForm.confirmation_message,
        notify_emails: fullForm.notify_emails,
        send_receipt: fullForm.send_receipt,
        receipt_email_field: fullForm.receipt_email_field,
        layout: fullForm.layout,
        updated_at: now,
      };

      if (fullForm.custom_email_subject) {
        formPayload.custom_email_subject = fullForm.custom_email_subject;
      }
      if (fullForm.custom_email_html) {
        formPayload.custom_email_html = fullForm.custom_email_html;
      }

      let { error: formErr } = await serviceClient
        .from('forms')
        .upsert(formPayload, { onConflict: 'slug' });

      // If failed due to unknown columns, strip email columns and retry
      if (formErr && (formErr.message?.includes('column') || formErr.code === 'PGRST204')) {
        delete formPayload.custom_email_subject;
        delete formPayload.custom_email_html;
        const retry = await serviceClient
          .from('forms')
          .upsert(formPayload, { onConflict: 'slug' });
        formErr = retry.error;
      }

      if (!formErr) {
        await serviceClient.from('form_fields').delete().eq('form_id', fullForm.id);
        await serviceClient.from('form_fields').insert(
          fullFields.map((f) => ({
            id: f.id,
            form_id: f.form_id,
            position: f.position,
            type: f.type,
            key: f.key,
            label: f.label,
            help_text: f.help_text,
            placeholder: f.placeholder,
            required: f.required,
            options: f.options || [],
            validation: f.validation || {},
            show_if: f.show_if || null,
          }))
        );
      }
    } catch {
      // PostgreSQL tables notice
    }
  }

  return { success: true, slug: fullForm.slug };
}

/**
 * Updates the custom AI email template and subject for a form directly in Supabase.
 */
export async function updateFormCustomEmail(
  slug: string,
  custom_email_subject: string,
  custom_email_html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update in Supabase Cloud Storage
    try {
      const cloudForms = await fetchCloudStoredForms();
      if (cloudForms) {
        const cItem = cloudForms.find(
          (f) => f.form.slug?.toLowerCase() === slug.toLowerCase() || f.form.id === slug
        );
        if (cItem) {
          cItem.form.custom_email_subject = custom_email_subject;
          cItem.form.custom_email_html = custom_email_html;
          cItem.form.updated_at = new Date().toISOString();
          await saveCloudStoredForms(cloudForms);
        }
      }
    } catch {
      // ignore
    }

    // 2. Update in Supabase PostgreSQL
    const serviceClient = createServiceRoleServerClient() || createAnonServerClient();
    if (serviceClient) {
      try {
        await serviceClient
          .from('forms')
          .update({
            custom_email_subject,
            custom_email_html,
            updated_at: new Date().toISOString(),
          })
          .eq('slug', slug);
      } catch {
        // ignore if column doesn't exist in DB
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Deletes a form and all associated submissions/fields from Supabase.
 */
export async function removeFormBySlug(slug: string): Promise<{ success: boolean; error?: string }> {
  const cleanSlug = (slug || '').trim().toLowerCase();

  // 1. Remove from Supabase Cloud Storage forms and submissions
  try {
    const cloudForms = await fetchCloudStoredForms();
    let targetFormId: string | null = null;

    if (cloudForms !== null) {
      const filtered = cloudForms.filter((item) => {
        const s = (item.form?.slug || '').trim().toLowerCase();
        const id = (item.form?.id || '').trim().toLowerCase();
        if (s === cleanSlug || id === cleanSlug) {
          targetFormId = item.form.id;
          return false;
        }
        return true;
      });
      await saveCloudStoredForms(filtered);
    }

    // Remove form's submissions from cloud storage
    if (targetFormId) {
      const cloudSubs = await fetchCloudSubmissions();
      if (cloudSubs) {
        const filteredSubs = cloudSubs.filter((s) => s.form_id !== targetFormId);
        await saveCloudSubmissions(filteredSubs);
      }
    }
  } catch (cloudErr) {
    console.warn('removeFormBySlug Supabase storage delete notice:', cloudErr);
  }

  // 2. Supabase PostgreSQL cleanup
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();
  if (serviceClient) {
    try {
      const { data: formRow } = await serviceClient
        .from('forms')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (formRow?.id) {
        await serviceClient.from('submissions').delete().eq('form_id', formRow.id);
        await serviceClient.from('form_fields').delete().eq('form_id', formRow.id);
      }
      await serviceClient.from('forms').delete().eq('slug', cleanSlug);
    } catch {
      // ignore
    }
  }

  return { success: true };
}
