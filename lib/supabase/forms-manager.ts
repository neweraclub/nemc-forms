import { FormFieldRecord, FormRecord } from '@/types/form';
import { createServiceRoleServerClient } from './server';
import { SAMPLE_RECRUITMENT_FIELDS, SAMPLE_RECRUITMENT_FORM } from '@/lib/sample-seed';
import fs from 'fs';
import path from 'path';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.local_data');
const LOCAL_FORMS_FILE = path.join(LOCAL_STORAGE_DIR, 'custom_forms.json');

export interface StoredFormData {
  form: FormRecord;
  fields: FormFieldRecord[];
}

function ensureLocalFormsStorage() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_FORMS_FILE)) {
    const initial: StoredFormData[] = [
      {
        form: SAMPLE_RECRUITMENT_FORM,
        fields: SAMPLE_RECRUITMENT_FIELDS,
      },
    ];
    fs.writeFileSync(LOCAL_FORMS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

export function getLocalCustomForms(): StoredFormData[] {
  try {
    ensureLocalFormsStorage();
    const raw = fs.readFileSync(LOCAL_FORMS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [{ form: SAMPLE_RECRUITMENT_FORM, fields: SAMPLE_RECRUITMENT_FIELDS }];
  }
}

export function saveLocalCustomForm(form: FormRecord, fields: FormFieldRecord[]) {
  try {
    ensureLocalFormsStorage();
    const all = getLocalCustomForms();
    const existingIndex = all.findIndex((item) => item.form.slug === form.slug || item.form.id === form.id);
    if (existingIndex >= 0) {
      all[existingIndex] = { form, fields };
    } else {
      all.push({ form, fields });
    }
    fs.writeFileSync(LOCAL_FORMS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save custom form locally:', err);
  }
}

export function deleteLocalCustomForm(slug: string) {
  try {
    ensureLocalFormsStorage();
    const all = getLocalCustomForms().filter((item) => item.form.slug !== slug);
    fs.writeFileSync(LOCAL_FORMS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to delete custom form locally:', err);
  }
}

/**
 * Creates or updates a form with all its fields directly from the web interface.
 */
export async function persistFormWithFields(
  formData: Omit<FormRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
  fieldsData: Array<Omit<FormFieldRecord, 'id' | 'form_id' | 'created_at'> & { id?: string }>
): Promise<{ success: boolean; slug: string; error?: string }> {
  const serviceClient = createServiceRoleServerClient();
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

  // 1. Always save in local fallback storage
  saveLocalCustomForm(fullForm, fullFields);

  // 2. Persist to Supabase if available
  if (serviceClient) {
    try {
      const { error: formErr } = await serviceClient.from('forms').upsert(
        {
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
          custom_email_subject: fullForm.custom_email_subject || null,
          custom_email_html: fullForm.custom_email_html || null,
          layout: fullForm.layout,
          updated_at: now,
        },
        { onConflict: 'slug' }
      );

      if (!formErr) {
        // Delete previous fields and re-insert to keep positions clean
        await serviceClient.from('form_fields').delete().eq('form_id', fullForm.id);

        const { error: fieldsErr } = await serviceClient.from('form_fields').insert(
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

        if (fieldsErr) {
          console.warn('Error saving fields to Supabase:', fieldsErr);
        }
      } else {
        console.warn('Error saving form to Supabase:', formErr);
      }
    } catch (e) {
      console.warn('Supabase persist exception (saved locally):', e);
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

    const serviceClient = createServiceRoleServerClient();
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
      } catch (err) {
        console.warn('Supabase updateFormCustomEmail warning:', err);
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
  deleteLocalCustomForm(slug);

  const serviceClient = createServiceRoleServerClient();
  if (serviceClient) {
    try {
      await serviceClient.from('forms').delete().eq('slug', slug);
    } catch (e) {
      console.warn('Failed to delete form from Supabase:', e);
    }
  }

  return { success: true };
}
