import nodemailer from 'nodemailer';
import { FormFieldRecord, FormRecord } from '@/types/form';

/**
 * Escapes HTML characters to prevent XSS and HTML injection in emails.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const stringVal = Array.isArray(str) ? str.join(', ') : String(str);
  return stringVal
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes headers (Subject, From, To) to avoid header injection (CRLF attacks).
 */
export function sanitizeHeader(str: string): string {
  return str.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Creates Nodemailer transport based on environment variables.
 */
export function createEmailTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user) {
    // If SMTP is not configured, return null; caller handles mock logging
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Formats user answers into human-friendly label and formatted string.
 */
export function formatAnswersSummary(
  fields: FormFieldRecord[],
  answers: Record<string, unknown>
): Array<{ label: string; value: string; raw: unknown }> {
  return fields
    .map((field) => {
      const rawVal = answers[field.key];
      let displayVal = '—';

      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (Array.isArray(rawVal)) {
          // If options exist, map values to labels
          if (field.options && field.options.length > 0) {
            const mapped = rawVal.map((v) => {
              const opt = field.options?.find((o) => o.value === v);
              return opt ? opt.label : String(v);
            });
            displayVal = mapped.join(', ');
          } else {
            displayVal = rawVal.join(', ');
          }
        } else if (typeof rawVal === 'boolean') {
          displayVal = rawVal ? 'Oui (Accepté)' : 'Non';
        } else if (field.options && field.options.length > 0) {
          const opt = field.options.find((o) => o.value === rawVal);
          displayVal = opt ? opt.label : String(rawVal);
        } else {
          displayVal = String(rawVal);
        }
      }

      return {
        label: field.label,
        value: displayVal,
        raw: rawVal,
      };
    })
    .filter((item) => item.value !== '—' || answers[item.label] !== undefined);
}

/**
 * Generates Gmail and Outlook table-compatible HTML email for team notifications.
 */
export function buildTeamEmailHtml(
  form: FormRecord,
  summary: Array<{ label: string; value: string }>,
  submissionId: string,
  createdAt: string
): string {
  const tableRows = summary
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E6DFD5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #52525B; width: 35%; vertical-align: top; background-color: #FAF8F5;">
          ${escapeHtml(item.label)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E6DFD5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #18181B; line-height: 1.5; vertical-align: top; background-color: #FFFFFF;">
          ${escapeHtml(item.value).replace(/\n/g, '<br/>')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle soumission: ${escapeHtml(form.title)}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #FAF6EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #3B33FF 0%, #8B3EE1 50%, #E53888 100%); height: 4px; line-height: 4px; font-size: 0px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 24px 28px 16px 28px; background-color: #FAF6EE; border-bottom: 1px solid #E6DFD5;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #3B33FF; text-transform: uppercase;">Club Médical New Era</span>
              <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #18181B; line-height: 1.3;">
                Nouvelle réponse reçue
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #52525B;">
                Formulaire: <strong>${escapeHtml(form.title)}</strong> &bull; ID: <code>${escapeHtml(submissionId.slice(0, 8))}</code>
              </p>
            </td>
          </tr>
          <!-- Table of Answers -->
          <tr>
            <td style="padding: 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                ${tableRows}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #FAF8F5; border-top: 1px solid #E6DFD5; font-size: 12px; color: #71717A; line-height: 1.5;">
              Soumis le ${new Date(createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}.
              <br />
              Ce message a été envoyé automatiquement par le serveur de soumissions de <strong>Club Médical New Era</strong>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generates submitter receipt HTML email (Outlook and Gmail friendly).
 */
export function buildReceiptEmailHtml(
  form: FormRecord,
  summary: Array<{ label: string; value: string }>,
  submissionId: string
): string {
  const tableRows = summary
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E6DFD5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #52525B; width: 40%; vertical-align: top;">
          ${escapeHtml(item.label)}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E6DFD5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #18181B; vertical-align: top;">
          ${escapeHtml(item.value).replace(/\n/g, '<br/>')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accusé de réception — ${escapeHtml(form.title)}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #FAF6EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(90deg, #3B33FF 0%, #8B3EE1 50%, #E53888 100%); height: 4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 24px 28px 16px 28px;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #3B33FF; text-transform: uppercase;">Club Médical New Era</span>
              <h1 style="margin: 8px 0 12px 0; font-size: 20px; font-weight: 700; color: #18181B;">
                Accusé de réception
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #3F3F46; line-height: 1.5;">
                ${escapeHtml(form.confirmation_message || 'Votre candidature a bien été transmise à notre équipe.')}
              </p>
              <div style="background-color: #FAF8F5; border: 1px solid #E6DFD5; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #52525B;">
                Référence de votre dossier: <strong style="color: #18181B;">${escapeHtml(submissionId.slice(0, 8))}</strong>
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #18181B;">
                Récapitulatif de vos réponses
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #E6DFD5; border-radius: 6px;">
                ${tableRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 28px; background-color: #FAF8F5; border-top: 1px solid #E6DFD5; font-size: 12px; color: #71717A;">
              Club Médical New Era &bull; event@new-era-medical-club-univ-ouargla.dz &bull; Cet email confirme la bonne transmission de vos données.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Builds plain-text fallback string from answers summary.
 */
export function buildPlainTextSummary(
  title: string,
  summary: Array<{ label: string; value: string }>,
  submissionId: string
): string {
  const lines = [
    `CLUB MÉDICAL NEW ERA`,
    `${title}`,
    `Référence: ${submissionId.slice(0, 8)}`,
    `--------------------------------------------------`,
    ...summary.map((item) => `${item.label}:\n${item.value}\n`),
    `--------------------------------------------------`,
    `Club Médical New Era - event@new-era-medical-club-univ-ouargla.dz`,
  ];
  return lines.join('\n');
}

/**
 * Dispatches both team and submitter receipt emails safely.
 * Never throws an error that interrupts the user's submission: returns email status.
 */
export async function sendSubmissionEmails(params: {
  form: FormRecord;
  fields: FormFieldRecord[];
  answers: Record<string, unknown>;
  submitterEmail?: string | null;
  submissionId: string;
  createdAt: string;
}): Promise<'sent' | 'failed' | 'not_requested'> {
  const { form, fields, answers, submitterEmail, submissionId, createdAt } = params;

  const notifyEmails = form.notify_emails?.filter(Boolean) || [];
  const needsReceipt = form.send_receipt && submitterEmail;

  if (notifyEmails.length === 0 && !needsReceipt) {
    return 'not_requested';
  }

  const transport = createEmailTransport();
  const summary = formatAnswersSummary(fields, answers);
  const fromAddress = sanitizeHeader(
    process.env.SMTP_FROM ||
      'Club Médical New Era <event@new-era-medical-club-univ-ouargla.dz>'
  );

  if (!transport) {
    console.log(
      `[Mailer Mock/Dev] SMTP not configured. Would send email for submission ${submissionId}:`
    );
    console.log(`- To Team:`, notifyEmails.join(', '));
    if (needsReceipt) console.log(`- To Submitter:`, submitterEmail);
    console.log(`- Summary answers:`, summary);
    // In local dev without SMTP credentials, we consider it logged and successful
    return 'sent';
  }

  try {
    const promises: Promise<unknown>[] = [];

    // 1. Team Notification
    if (notifyEmails.length > 0) {
      const subject = sanitizeHeader(`[Candidature] ${form.title} — ${submissionId.slice(0, 8)}`);
      promises.push(
        transport.sendMail({
          from: fromAddress,
          to: notifyEmails.join(', '),
          subject,
          text: buildPlainTextSummary(subject, summary, submissionId),
          html: buildTeamEmailHtml(form, summary, submissionId, createdAt),
        })
      );
    }

    // 2. Submitter Receipt
    if (needsReceipt && submitterEmail) {
      const receiptSubject = sanitizeHeader(`Accusé de réception — ${form.title}`);
      promises.push(
        transport.sendMail({
          from: fromAddress,
          to: sanitizeHeader(submitterEmail),
          subject: receiptSubject,
          text: buildPlainTextSummary(receiptSubject, summary, submissionId),
          html: buildReceiptEmailHtml(form, summary, submissionId),
        })
      );
    }

    await Promise.all(promises);
    return 'sent';
  } catch (err) {
    console.error(`[Mailer Error] Failed to send email for submission ${submissionId}:`, err);
    return 'failed';
  }
}
