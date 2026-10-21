import Link from 'next/link';
import { getAdminForms } from '@/lib/supabase/admin';
import { FormRowActions } from './FormRowActions';

export const metadata = {
  title: 'Formulaires — Administration Club Médical New Era',
};

export const dynamic = 'force-dynamic';

export default async function AdminFormsPage() {
  const forms = await getAdminForms();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            Formulaires
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5">
            Créez, modifiez et gérez tous vos formulaires en ligne sans aucune ligne de code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/forms/new"
            className="brand-gradient-btn min-h-[44px] px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-xs inline-flex items-center justify-center"
          >
            + Créer un formulaire
          </Link>
        </div>
      </div>

      {/* Forms List Card */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E6DFD5] bg-[#FAF8F5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#18181B]">
              Formulaires disponibles ({forms.length})
            </h2>
            <p className="text-xs text-[#52525B] mt-0.5">
              Cliquez sur &quot;Modifier&quot; pour éditer les questions ou &quot;Consulter&quot; pour voir les réponses.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#E6DFD5]">
          {forms.map(({ form, fieldsCount, submissionsCount }) => {
            const statusBadge = {
              open: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
              draft: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
              closed: 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]',
            }[form.status];

            return (
              <div
                key={form.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F5]/50 transition"
              >
                <div className="space-y-1.5 flex-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-[#18181B]">
                      {form.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadge}`}
                    >
                      {form.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DFD5]">
                      Format: {form.layout === 'stepped' ? 'Étapes (1/page)' : 'Page unique'}
                    </span>
                  </div>

                  {form.description && (
                    <p className="text-xs sm:text-sm text-[#52525B] line-clamp-2">
                      {form.description}
                    </p>
                  )}

                  <div className="text-xs text-[#71717A] flex items-center gap-4 pt-1 flex-wrap">
                    <span>
                      URL: <code className="font-mono text-[#18181B]">/f/{form.slug}</code>
                    </span>
                    <span>{fieldsCount} question{fieldsCount > 1 ? 's' : ''}</span>
                    <span>
                      Reçu email: {form.send_receipt ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-2 md:pt-0">
                  <FormRowActions
                    slug={form.slug}
                    title={form.title}
                    submissionsCount={submissionsCount}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
