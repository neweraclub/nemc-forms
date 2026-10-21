import { notFound } from 'next/navigation';
import { getAdminSubmissions } from '@/lib/supabase/admin';
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
  const { form, fields } = await getAdminSubmissions(slug);

  if (!form) {
    notFound();
  }

  return (
    <div className="py-2">
      <FormBuilder initialForm={form} initialFields={fields} isEditing={true} />
    </div>
  );
}
