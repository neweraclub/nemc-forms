'use server';

import { getAdminSession } from '@/lib/auth';
import { persistFormWithFields, removeFormBySlug } from '@/lib/supabase/forms-manager';
import { FormFieldRecord, FormRecord } from '@/types/form';
import { revalidatePath } from 'next/cache';

export async function saveFormAction(
  form: Omit<FormRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string },
  fields: Array<Omit<FormFieldRecord, 'id' | 'form_id' | 'created_at'> & { id?: string }>
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  }

  if (!form.title || !form.title.trim()) {
    return { success: false, error: 'Le titre du formulaire est obligatoire.' };
  }

  // Generate slug if empty
  let slug = form.slug?.trim().toLowerCase();
  if (!slug) {
    slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const res = await persistFormWithFields({ ...form, slug }, fields);

  if (res.success) {
    revalidatePath('/admin');
    revalidatePath(`/admin/${res.slug}`);
    revalidatePath(`/f/${res.slug}`);
    return { success: true, slug: res.slug };
  }

  return { success: false, error: res.error || 'Erreur lors de l’enregistrement du formulaire.' };
}

export async function deleteFormAction(slug: string): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  }

  const res = await removeFormBySlug(slug);
  if (res.success) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin', 'page');
    revalidatePath('/admin');
    revalidatePath('/admin/stats', 'page');
    revalidatePath('/admin/emails', 'page');
    revalidatePath(`/admin/${slug}`, 'page');
    revalidatePath(`/f/${slug}`, 'page');
    return { success: true };
  }

  return { success: false, error: res.error || 'Erreur lors de la suppression.' };
}
