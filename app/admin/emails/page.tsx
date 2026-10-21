import { getAdminForms } from '@/lib/supabase/admin';
import { EmailStudioClient } from './EmailStudioClient';

export const metadata = {
  title: 'Emails IA — Administration Club Médical New Era',
  description: 'Générateur et studio de templates d’emails propulsé par Gemini AI.',
};

export const dynamic = 'force-dynamic';

export default async function AdminEmailsPage() {
  const formsSummary = await getAdminForms();
  const forms = formsSummary.map((f) => f.form);

  return <EmailStudioClient forms={forms} />;
}
