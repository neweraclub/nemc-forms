import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminSubmissions } from '@/lib/supabase/admin';
import { SubmissionsExplorer } from './SubmissionsExplorer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminFormSubmissionsPage({ params }: PageProps) {
  const { slug } = await params;
  const { form, fields, submissions } = await getAdminSubmissions(slug);

  if (!form) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and actions */}
      <div>
        <Link
          href="/admin"
          className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] inline-flex items-center gap-1.5"
        >
          ← Retour aux formulaires
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                {form.title}
              </h1>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E6DFD5] text-[#52525B]">
                {form.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1">
              Visualisation des candidatures soumises via <code>/f/{form.slug}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/forms/${form.slug}/edit`}
              className="inline-flex items-center px-3.5 py-2 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#18181B] transition"
            >
              Modifier ce formulaire
            </Link>
            <Link
              href={`/f/${form.slug}`}
              target="_blank"
              className="inline-flex items-center px-3.5 py-2 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#52525B] transition"
            >
              Ouvrir le formulaire public ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Submissions Explorer Client Component */}
      <SubmissionsExplorer form={form} fields={fields} submissions={submissions} />
    </div>
  );
}
