import { notFound } from 'next/navigation';
import { getAdminSubmissions } from '@/lib/supabase/admin';
import { getTargetRolesAction } from '@/app/actions/roleActions';
import { getQuestionBankAction } from '@/app/actions/questionBankActions';
import { FormBuilder } from '../../FormBuilder';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditFormPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {}

  const [submissionsRes, rolesRes, bankRes] = await Promise.all([
    getAdminSubmissions(slug),
    getTargetRolesAction(),
    getQuestionBankAction(),
  ]);

  const { form, fields } = submissionsRes;

  if (!form) {
    notFound();
  }

  return (
    <div className="py-2">
      <FormBuilder
        initialForm={form}
        initialFields={fields}
        isEditing={true}
        availableRoles={rolesRes.roles || []}
        questionBank={bankRes.questions || []}
      />
    </div>
  );
}
