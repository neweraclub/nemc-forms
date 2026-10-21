'use server';

import { getAdminSession } from '@/lib/auth';
import {
  listHtmlStorageTemplates,
  getHtmlStorageContent,
  saveHtmlStorageTemplate,
  deleteHtmlStorageTemplate,
  HtmlStorageItem,
} from '@/lib/supabase/html-storage';
import { updateFormCustomEmail } from '@/lib/supabase/forms-manager';
import { revalidatePath } from 'next/cache';

/**
 * Lists all HTML email templates currently stored in Supabase Storage 'Html_forms'.
 */
export async function listHtmlTemplatesAction(): Promise<{
  success: boolean;
  templates?: HtmlStorageItem[];
  error?: string;
}> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const templates = await listHtmlStorageTemplates();
    return { success: true, templates };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Retrieves the raw HTML text of a specific template in 'Html_forms'.
 */
export async function getHtmlTemplateContentAction(
  fileName: string
): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const html = await getHtmlStorageContent(fileName);
    return { success: true, html };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Inserts / uploads an HTML template into Supabase Storage 'Html_forms'.
 */
export async function insertHtmlTemplateAction(
  fileName: string,
  htmlContent: string
): Promise<{ success: boolean; path?: string; publicUrl?: string; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    if (!fileName || !fileName.trim()) {
      return { success: false, error: 'Veuillez spécifier un nom de fichier pour le template.' };
    }

    if (!htmlContent || !htmlContent.trim()) {
      return { success: false, error: 'Le contenu HTML ne peut pas être vide.' };
    }

    const result = await saveHtmlStorageTemplate(fileName, htmlContent);
    revalidatePath('/admin/emails');
    return { success: true, path: result.path, publicUrl: result.publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Deletes an HTML template from 'Html_forms'.
 */
export async function deleteHtmlTemplateAction(
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    await deleteHtmlStorageTemplate(fileName);
    revalidatePath('/admin/emails');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Reads a template from 'Html_forms' and assigns it directly to a form.
 * "we don't insert HTML, we select a form!"
 */
export async function assignStorageTemplateToFormAction(
  formSlug: string,
  fileName: string,
  subject?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const htmlContent = await getHtmlStorageContent(fileName);
    const emailSubject = subject?.trim() || `Accusé de réception — New Era Club`;

    const res = await updateFormCustomEmail(formSlug, emailSubject, htmlContent);
    if (res.success) {
      revalidatePath(`/admin/${formSlug}`);
      revalidatePath(`/f/${formSlug}`);
      revalidatePath('/admin');
    }
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
