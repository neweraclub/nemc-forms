import { FormFieldRecord, FormRecord } from '@/types/form';
import { createAnonServerClient, createServiceRoleServerClient } from './server';
import {
  StoredFormData,
  fetchCloudStoredForms,
  saveCloudStoredForms,
  getLocalStoredForms,
  getLocalStoredForms as getLocalCustomForms,
  saveLocalCustomForm,
  deleteLocalCustomForm,
  syncLocalFormsWithCloud,
  deleteLocalSubmissionsForForm,
} from './cloud-registry';

export type { StoredFormData };
export {
  fetchCloudStoredForms,
  saveCloudStoredForms,
  getLocalStoredForms,
  getLocalCustomForms,
  saveLocalCustomForm,
  deleteLocalCustomForm,
  syncLocalFormsWithCloud,
  deleteLocalSubmissionsForForm,
};

/**
 * Creates or updates a form with all its fields directly from the web interface.
 * Persists to Local Disk, Supabase Cloud Storage (Html_forms), and Supabase PostgreSQL.
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

  // 1. Save in local storage
  saveLocalCustomForm(fullForm, fullFields);

  // 2. Persist to Supabase Cloud Storage (Html_forms registry)
  try {
    const cloudForms = (await fetchCloudStoredForms()) ?? getLocalCustomForms();
    const existingIdx = cloudForms.findIndex(
      (item) => item.form.slug === fullForm.slug || item.form.id === fullForm.id
    );
    if (existingIdx >= 0) {
      cloudForms[existingIdx] = { form: fullForm, fields: fullFields };
    } else {
      cloudForms.unshift({ form: fullForm, fields: fullFields });
    }
    await saveCloudStoredForms(cloudForms);
  } catch (cloudErr) {
    console.warn('Cloud storage sync notice:', cloudErr);
  }

  // 3. Persist to Supabase PostgreSQL if tables exist
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
      // PostgreSQL tables may not yet be migrated
    }
  }

  return { success: true, slug: fullForm.slug };
}

/**
 * Updates only the custom AI email template and subject for a form.
 */
export async function updateFormCustomEmail(
  slug: string,
  custom_email_subject: string,
  custom_email_html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = getLocalCustomForms();
    const item = all.find((f) => f.form.slug === slug);
    if (item) {
      item.form.custom_email_subject = custom_email_subject;
      item.form.custom_email_html = custom_email_html;
      item.form.updated_at = new Date().toISOString();
      saveLocalCustomForm(item.form, item.fields);
    }

    // Update in Cloud Storage
    try {
      const cloudForms = await fetchCloudStoredForms();
      if (cloudForms) {
        const cItem = cloudForms.find((f) => f.form.slug === slug);
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
 * Deletes a form and all associated submissions/fields.
 */
export async function removeFormBySlug(slug: string): Promise<{ success: boolean; error?: string }> {
  const cleanSlug = (slug || '').trim().toLowerCase();

  // 1. Delete from local custom forms & submissions
  deleteLocalCustomForm(cleanSlug);
  deleteLocalSubmissionsForForm(cleanSlug);

  // 2. Remove from Cloud Storage and synchronize
  try {
    const cloudForms = await fetchCloudStoredForms();
    if (cloudForms !== null) {
      const filtered = cloudForms.filter((item) => {
        const s = (item.form?.slug || '').trim().toLowerCase();
        const id = (item.form?.id || '').trim().toLowerCase();
        return s !== cleanSlug && id !== cleanSlug;
      });
      await saveCloudStoredForms(filtered);
      syncLocalFormsWithCloud(filtered);
    }
  } catch (cloudErr) {
    console.warn('removeFormBySlug Cloud storage delete notice:', cloudErr);
  }

  // 3. PostgreSQL cleanup if tables exist
  const serviceClient = createServiceRoleServerClient() || createAnonServerClient();
  if (serviceClient) {
    try {
      // Find form id first if needed to cascade delete
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
