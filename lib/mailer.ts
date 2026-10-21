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
 * Resolves the compliant sender address for the SMTP server.
 * Critical for providers like Zoho Mail that prohibit relaying if the From address
 * does not match the authenticated SMTP user mailbox.
 */
export function getSenderAddress(): { fromAddress: string; replyTo: string } {
  const user = process.env.SMTP_USER?.trim();
  const rawFrom = process.env.SMTP_FROM?.trim();
  const clubName = 'Club Médical New Era';
  const eventEmail = 'event@new-era-medical-club-univ-ouargla.dz';
  const contactEmail = 'contact@new-era-medical-club-univ-ouargla.dz';

  // 1. Prioritize explicitly configured SMTP_FROM
  if (rawFrom) {
    return {
      fromAddress: rawFrom,
      replyTo: `${clubName} <${contactEmail}>`,
    };
  }

  // 2. Fallback to authenticated SMTP user
  if (user) {
    return {
      fromAddress: `${clubName} <${user}>`,
      replyTo: `${clubName} <${contactEmail}>`,
    };
  }

  return {
    fromAddress: `${clubName} <${eventEmail}>`,
    replyTo: `${clubName} <${contactEmail}>`,
  };
}

/**
 * Creates Nodemailer transport based on environment variables with optional debug mode.
 */
export function createEmailTransport(forceDebug: boolean = false) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user) {
    // If SMTP is not configured, return null; caller handles mock logging
    return null;
  }

  const isDebug = forceDebug || process.env.EMAIL_DEBUG === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: isDebug,
    logger: isDebug,
    connectionTimeout: 10000,
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
              <img src="https://aysysyrjqhqrcqoinbgx.supabase.co/storage/v1/object/public/Html_forms/logo_light_mode.png" alt="Club Médical New Era" width="125" style="display: block; max-width: 135px; height: auto; margin-bottom: 14px; border: 0;" />
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #3B33FF; text-transform: uppercase;">New Era Medical Club</span>
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
              Ce message a été envoyé automatiquement par le serveur de soumissions de <strong>New Era Medical Club</strong>.
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
              <img src="https://aysysyrjqhqrcqoinbgx.supabase.co/storage/v1/object/public/Html_forms/logo_light_mode.png" alt="Club Médical New Era" width="130" style="display: block; max-width: 140px; height: auto; margin-bottom: 16px; border: 0;" />
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #3B33FF; text-transform: uppercase;">New Era Medical Club</span>
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
              New Era Medical Club &bull; contact@new-era-medical-club-univ-ouargla.dz &bull; Cet email confirme la bonne transmission de vos données.
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
 * Renders an AI-generated or custom HTML email template with candidate's answers and metadata.
 */
export function renderCustomEmailHtml(
  templateHtml: string,
  form: FormRecord,
  summary: Array<{ label: string; value: string }>,
  submissionId: string,
  answers: Record<string, unknown>
): string {
  const tableRows = summary
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; color: #A1A1AA; width: 40%; vertical-align: top;">
          ${escapeHtml(item.label)}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #FFFFFF; vertical-align: top;">
          ${escapeHtml(item.value).replace(/\n/g, '<br/>')}
        </td>
      </tr>
    `
    )
    .join('');

  const summaryTable = `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; margin: 16px 0; background-color: rgba(255,255,255,0.03);">
      ${tableRows}
    </table>
  `;

  const fullName = String(answers.full_name || answers.nom_complet || answers.nom || 'Candidat');
  const firstName = fullName.split(' ')[0] || 'Candidat';
  const email = String(answers.email || answers.adresse_email || '');

  const rendered = templateHtml
    .replace(/\{\{nom\}\}/gi, escapeHtml(fullName))
    .replace(/\{\{full_name\}\}/gi, escapeHtml(fullName))
    .replace(/\{\{prenom\}\}/gi, escapeHtml(firstName))
    .replace(/\{\{email\}\}/gi, escapeHtml(email))
    .replace(/\{\{confirmation_id\}\}/gi, escapeHtml(submissionId.slice(0, 8).toUpperCase()))
    .replace(/\{\{titre\}\}/gi, escapeHtml(form.title))
    .replace(/\{\{form_title\}\}/gi, escapeHtml(form.title))
    .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))
    .replace(/\{\{reponses\}\}/gi, summaryTable);

  return rendered;
}

export interface SmtpDiagnosticResult {
  success: boolean;
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  authUser: string;
  fromAddress: string;
  replyTo: string;
  message: string;
  rawResponse?: unknown;
  logs: string[];
}

/**
 * Diagnostic tool for testing SMTP connectivity and credentials in debug mode.
 */
export async function diagnoseSmtpConnection(): Promise<SmtpDiagnosticResult> {
  const host = process.env.SMTP_HOST || 'non configuré';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'non configuré';
  const { fromAddress, replyTo } = getSenderAddress();
  const logs: string[] = [];

  logs.push(`[SMTP Config] Hôte : ${host}:${port} (SSL/TLS direct : ${port === 465})`);
  logs.push(`[SMTP Config] Utilisateur authentifié : ${user}`);
  logs.push(`[SMTP Config] Expéditeur From : ${fromAddress}`);
  logs.push(`[SMTP Config] Adresse Reply-To : ${replyTo}`);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logs.push('[Diagnostic] ❌ Paramètres SMTP incomplets dans les variables d’environnement.');
    return {
      success: false,
      configured: false,
      host,
      port,
      secure: port === 465,
      authUser: user,
      fromAddress,
      replyTo,
      message: 'Configuration SMTP incomplète : SMTP_HOST, SMTP_USER ou SMTP_PASS manquant.',
      logs,
    };
  }

  const transport = createEmailTransport(true);
  if (!transport) {
    logs.push('[Diagnostic] ❌ Échec de création du transporteur Nodemailer.');
    return {
      success: false,
      configured: false,
      host,
      port,
      secure: port === 465,
      authUser: user,
      fromAddress,
      replyTo,
      message: 'Impossible d’initialiser le transporteur email.',
      logs,
    };
  }

  try {
    logs.push('[Diagnostic] Tentative de connexion et vérification SMTP (transporter.verify)...');
    const verifyResult = await transport.verify();
    logs.push(`[Diagnostic] ✅ Connexion SMTP validée avec succès ! Réponse du serveur: ${JSON.stringify(verifyResult)}`);
    return {
      success: true,
      configured: true,
      host,
      port,
      secure: port === 465,
      authUser: user,
      fromAddress,
      replyTo,
      message: `Serveur SMTP opérationnel (${host}:${port}). Prêt à délivrer les courriels.`,
      rawResponse: verifyResult,
      logs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logs.push(`[Diagnostic] ❌ Erreur lors de la vérification SMTP: ${errorMsg}`);
    return {
      success: false,
      configured: true,
      host,
      port,
      secure: port === 465,
      authUser: user,
      fromAddress,
      replyTo,
      message: `Échec de connexion SMTP: ${errorMsg}`,
      rawResponse: err,
      logs,
    };
  }
}

/**
 * Sends a direct test email from the Admin AI Email Studio with full debug reporting.
 */
export async function sendDirectTestEmail(
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; response?: string; error?: string; debugLogs?: string[] }> {
  const { fromAddress, replyTo } = getSenderAddress();
  const transport = createEmailTransport();
  const debugLogs: string[] = [];

  debugLogs.push(`Destinataire : ${toEmail}`);
  debugLogs.push(`Expéditeur From : ${fromAddress}`);
  debugLogs.push(`Adresse Reply-To : ${replyTo}`);
  debugLogs.push(`Objet : ${subject}`);

  if (!transport) {
    const mockMsg = `[Test Mail Mock] SMTP non configuré. Test simulé avec succès pour ${toEmail}: ${subject}`;
    console.log(mockMsg);
    debugLogs.push(mockMsg);
    return {
      success: true,
      messageId: 'mock-test-id',
      response: 'Simulation locale (Variables SMTP non définies)',
      debugLogs,
    };
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      replyTo,
      to: sanitizeHeader(toEmail),
      subject: sanitizeHeader(subject || 'Test — New Era Medical Club'),
      html,
      text: 'Veuillez afficher ce courriel avec un client prenant en charge le HTML pour voir le rendu officiel New Era Club.',
    });
    debugLogs.push(`Succès d’envoi ! Message ID: ${info.messageId}`);
    if (info.response) {
      debugLogs.push(`Réponse du serveur SMTP: ${info.response}`);
    }
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      debugLogs,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    debugLogs.push(`❌ Échec de transmission SMTP: ${msg}`);
    console.error(`[Test Mail Error] Failed to send to ${toEmail}:`, msg);
    return { success: false, error: msg, debugLogs };
  }
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
    `New Era Medical Club`,
    `${title}`,
    `Référence: ${submissionId.slice(0, 8)}`,
    `--------------------------------------------------`,
    ...summary.map((item) => `${item.label}:\n${item.value}\n`),
    `--------------------------------------------------`,
    `New Era Medical Club - contact@new-era-medical-club-univ-ouargla.dz`,
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
  const { fromAddress, replyTo } = getSenderAddress();

  if (!transport) {
    console.log(
      `[Mailer Mock/Dev] SMTP not configured. Would send email for submission ${submissionId}:`
    );
    console.log(`- To Team:`, notifyEmails.join(', '));
    if (needsReceipt) console.log(`- To Submitter:`, submitterEmail);
    console.log(`- Summary answers:`, summary);
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
          replyTo,
          to: notifyEmails.join(', '),
          subject,
          text: buildPlainTextSummary(subject, summary, submissionId),
          html: buildTeamEmailHtml(form, summary, submissionId, createdAt),
        })
      );
    }

    // 2. Submitter Receipt
    if (needsReceipt && submitterEmail) {
      let receiptHtml: string;
      let receiptSubject: string;

      if (form.custom_email_html && form.custom_email_html.trim().length > 0) {
        receiptHtml = renderCustomEmailHtml(form.custom_email_html, form, summary, submissionId, answers);
        let rawSubject = form.custom_email_subject?.trim() || `Accusé de réception — ${form.title}`;
        if (rawSubject.toLowerCase().endsWith('.html') || rawSubject.toLowerCase().startsWith('modèle ')) {
          rawSubject = `Accusé de réception : ${form.title} — New Era Medical Club`;
        }
        receiptSubject = sanitizeHeader(
          rawSubject
            .replace(/\{\{full_name\}\}/gi, String(answers.full_name || answers.nom || ''))
            .replace(/\{\{nom\}\}/gi, String(answers.full_name || answers.nom || ''))
            .replace(/\{\{prenom\}\}/gi, String(answers.prenom || ''))
            .replace(/\{\{confirmation_id\}\}/gi, submissionId.slice(0, 8).toUpperCase())
        );
      } else {
        receiptHtml = buildReceiptEmailHtml(form, summary, submissionId);
        receiptSubject = sanitizeHeader(`Accusé de réception — ${form.title}`);
      }

      promises.push(
        transport.sendMail({
          from: fromAddress,
          replyTo,
          to: sanitizeHeader(submitterEmail),
          subject: receiptSubject,
          text: buildPlainTextSummary(receiptSubject, summary, submissionId),
          html: receiptHtml,
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
