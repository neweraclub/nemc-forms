'use server';

import { headers } from 'next/headers';
import { getFormBySlug, createServiceRoleServerClient, saveLocalSubmission, updateLocalSubmissionEmailStatus, getLocalSubmissions } from '@/lib/supabase/server';
import { buildFormZodSchema } from '@/lib/schema-builder';
import { hashClientIp, checkRateLimit } from '@/lib/rate-limit';
import { sendSubmissionEmails } from '@/lib/mailer';
import { SubmissionRecord } from '@/types/form';
import crypto from 'crypto';

export interface SubmitFormResult {
  success: boolean;
  submissionId?: string;
  message?: string;
  errors?: Record<string, string>;
  generalError?: string;
  emailStatus?: 'pending' | 'sent' | 'failed' | 'not_requested';
}

export async function submitFormAction(
  slug: string,
  rawAnswers: Record<string, unknown>,
  idempotencyKey?: string
): Promise<SubmitFormResult> {
  try {
    // 1. Client identification & rate limiting
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'unknown';

    const ipHash = hashClientIp(rawIp);
    const rateLimit = checkRateLimit(ipHash);

    if (!rateLimit.allowed) {
      return {
        success: false,
        generalError: `Trop de soumissions récentes. Veuillez patienter ${rateLimit.resetInSeconds} secondes avant de réessayer.`,
      };
    }

    // 2. Honeypot verification (silently reject bot)
    if (rawAnswers['_hp'] && String(rawAnswers['_hp']).trim().length > 0) {
      console.warn('[Honeypot Triggered] Rejecting automated submission');
      return {
        success: false,
        generalError: 'Requête invalide.',
      };
    }

    // 3. Fetch form & fields from database / seed
    const { form, fields, state } = await getFormBySlug(slug);

    if (!form || !state.isAvailable) {
      return {
        success: false,
        generalError: state.detail ? `${state.message} ${state.detail}` : state.message,
      };
    }

    // 4. Build runtime dynamic Zod schema and strictly validate
    const zodSchema = buildFormZodSchema(fields, rawAnswers);
    const parseResult = zodSchema.safeParse(rawAnswers);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return {
        success: false,
        errors: fieldErrors,
        generalError: 'Veuillez corriger les champs indiqués ci-dessous.',
      };
    }

    // Cleaned validated answers (excluding internal honeypot)
    const validatedData = { ...parseResult.data };
    delete validatedData['_hp'];

    // 5. Idempotency Check (double-click protection)
    const effectiveIdempotencyKey = idempotencyKey || crypto.randomUUID();
    const serviceClient = createServiceRoleServerClient();

    if (serviceClient) {
      const { data: existing } = await serviceClient
        .from('submissions')
        .select('id, email_status')
        .eq('idempotency_key', effectiveIdempotencyKey)
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          submissionId: existing.id,
          message: form.confirmation_message || 'Votre candidature a bien été enregistrée.',
          emailStatus: existing.email_status,
        };
      }
    } else {
      const existingLocal = getLocalSubmissions().find(
        (s) => s.idempotency_key === effectiveIdempotencyKey
      );
      if (existingLocal) {
        return {
          success: true,
          submissionId: existingLocal.id,
          message: form.confirmation_message || 'Votre candidature a bien été enregistrée.',
          emailStatus: existingLocal.email_status,
        };
      }
    }

    // 6. Submitter Email Extraction
    let submitterEmail: string | null = null;
    if (form.receipt_email_field && typeof validatedData[form.receipt_email_field] === 'string') {
      submitterEmail = validatedData[form.receipt_email_field] as string;
    } else {
      const emailField = fields.find((f) => f.type === 'email');
      if (emailField && typeof validatedData[emailField.key] === 'string') {
        submitterEmail = validatedData[emailField.key] as string;
      }
    }

    const submissionId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newSubmission: SubmissionRecord = {
      id: submissionId,
      form_id: form.id,
      answers: validatedData,
      submitter_email: submitterEmail,
      created_at: createdAt,
      email_status: 'pending',
      ip_hash: ipHash,
      user_agent: userAgent.slice(0, 255),
      idempotency_key: effectiveIdempotencyKey,
    };

    // 7. Store Submission First (Data Safety: never lost due to SMTP failure)
    let savedToDb = false;
    if (serviceClient) {
      try {
        const { error: insertErr } = await serviceClient.from('submissions').insert({
          id: newSubmission.id,
          form_id: newSubmission.form_id,
          answers: newSubmission.answers,
          submitter_email: newSubmission.submitter_email,
          created_at: newSubmission.created_at,
          email_status: newSubmission.email_status,
          ip_hash: newSubmission.ip_hash,
          user_agent: newSubmission.user_agent,
          idempotency_key: newSubmission.idempotency_key,
        });
        if (!insertErr) {
          savedToDb = true;
        } else {
          console.warn('DB insert error, persisting locally:', insertErr);
        }
      } catch (err) {
        console.warn('DB insert exception, persisting locally:', err);
      }
    }

    if (!savedToDb) {
      saveLocalSubmission(newSubmission);
    }

    // 8. Send Emails (Resilient: failure updates status, does not crash response)
    const emailStatus = await sendSubmissionEmails({
      form,
      fields,
      answers: validatedData,
      submitterEmail,
      submissionId,
      createdAt,
    });

    // Update email status
    if (savedToDb && serviceClient) {
      try {
        await serviceClient
          .from('submissions')
          .update({ email_status: emailStatus })
          .eq('id', submissionId);
      } catch (err) {
        console.error('Failed to update email status in DB:', err);
      }
    } else {
      updateLocalSubmissionEmailStatus(submissionId, emailStatus);
    }

    return {
      success: true,
      submissionId,
      message: form.confirmation_message || 'Votre candidature a bien été enregistrée.',
      emailStatus,
    };
  } catch (err) {
    console.error('[submitFormAction unexpected error]', err);
    return {
      success: false,
      generalError: 'Une erreur imprévue est survenue. Veuillez vérifier votre connexion et réessayer.',
    };
  }
}
