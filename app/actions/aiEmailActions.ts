'use server';

import { getAdminSession } from '@/lib/auth';
import {
  generateEmailTemplate,
  refineEmailTemplate,
  EmailGenerationInput,
  GeneratedEmailResult,
} from '@/lib/gemini';
import { sendDirectTestEmail, diagnoseSmtpConnection, SmtpDiagnosticResult } from '@/lib/mailer';
import { updateFormCustomEmail } from '@/lib/supabase/forms-manager';
import { revalidatePath } from 'next/cache';

export async function generateAiEmailAction(
  input: EmailGenerationInput
): Promise<{ success: boolean; result?: GeneratedEmailResult; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const result = await generateEmailTemplate(input);
    return { success: true, result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('generateAiEmailAction error:', err);
    return { success: false, error: msg };
  }
}

export async function refineAiEmailAction(
  currentResult: GeneratedEmailResult,
  suggestion: string
): Promise<{ success: boolean; result?: GeneratedEmailResult; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    if (!suggestion || !suggestion.trim()) {
      return { success: false, error: 'Veuillez saisir une suggestion de modification.' };
    }

    const result = await refineEmailTemplate(currentResult, suggestion.trim());
    return { success: true, result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('refineAiEmailAction error:', err);
    return { success: false, error: msg };
  }
}

export async function sendAiTestEmailAction(
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; response?: string; error?: string; debugLogs?: string[] }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.', debugLogs: ['Session expirée'] };
    }

    if (!toEmail || !toEmail.includes('@')) {
      return { success: false, error: 'Adresse email destinataire invalide.' };
    }

    return await sendDirectTestEmail(toEmail.trim(), subject, html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, debugLogs: [msg] };
  }
}

export async function diagnoseSmtpAction(): Promise<SmtpDiagnosticResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      success: false,
      configured: false,
      host: '',
      port: 0,
      secure: false,
      authUser: '',
      fromAddress: '',
      replyTo: '',
      message: 'Session expirée. Veuillez vous reconnecter.',
      logs: ['Session expirée.'],
    };
  }

  return await diagnoseSmtpConnection();
}

export async function attachAiEmailToFormAction(
  formSlug: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const res = await updateFormCustomEmail(formSlug, subject, html);
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
