import { getAdminFormsWithFields } from '@/lib/supabase/admin';
import { EmailStudioClient } from './EmailStudioClient';

export const metadata = {
  title: 'Emails IA — Administration Club Médical New Era',
  description: 'Générateur et studio de templates d’emails propulsé par Gemini AI.',
};

export const dynamic = 'force-dynamic';

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams?: Promise<{ slug?: string }>;
}) {
  const formsWithFields = await getAdminFormsWithFields();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialSelectedSlug = resolvedParams?.slug;

  return (
    <EmailStudioClient
      formsWithFields={formsWithFields}
      initialSelectedSlug={initialSelectedSlug}
    />
  );
}
