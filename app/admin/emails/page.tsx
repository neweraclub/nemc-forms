import { getAdminFormsWithFields } from '@/lib/supabase/admin';
import { EmailStudioClient } from './EmailStudioClient';

export const metadata = {
  title: 'Emails IA — Administration Club Médical New Era',
  description: 'Générateur et studio de templates d’emails propulsé par Gemini AI.',
};

export const dynamic = 'force-dynamic';

export default async function AdminEmailsPage() {
  const formsWithFields = await getAdminFormsWithFields();

  return <EmailStudioClient formsWithFields={formsWithFields} />;
}
