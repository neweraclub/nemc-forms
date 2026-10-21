import Link from 'next/link';
import { getAdminForms } from '@/lib/supabase/admin';

export const metadata = {
  title: 'Administration — Club Médical New Era',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const forms = await getAdminForms();

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#18181B] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD5] mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B33FF]" />
              <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
                Club Médical New Era
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
              Gestion des formulaires
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/f/recrutement-2026"
              target="_blank"
              className="inline-flex items-center px-4 py-2 border border-[#E6DFD5] rounded-lg text-xs sm:text-sm font-semibold text-[#18181B] bg-white hover:bg-[#FAF8F5] transition"
            >
              Voir le formulaire public
            </Link>
          </div>
        </header>

        {/* Forms Table */}
        <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-[#E6DFD5] bg-[#FAF8F5]">
            <h2 className="text-base font-semibold text-[#18181B]">
              Formulaires actifs ({forms.length})
            </h2>
            <p className="text-xs text-[#52525B] mt-0.5">
              Consultez les candidatures reçues et téléchargez les exports CSV.
            </p>
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
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5]/60 transition"
                >
                  <div className="space-y-1.5">
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
                        Layout: {form.layout}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#52525B] line-clamp-2 max-w-2xl">
                      {form.description}
                    </p>

                    <div className="text-xs text-[#71717A] flex items-center gap-4 pt-1">
                      <span>Slug: <code>{form.slug}</code></span>
                      <span>Champs: {fieldsCount}</span>
                      <span>
                        Accusé de réception: {form.send_receipt ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
                    <div className="text-right mr-2 hidden sm:block">
                      <div className="text-xl font-bold text-[#18181B]">
                        {submissionsCount}
                      </div>
                      <div className="text-xs text-[#71717A]">candidatures</div>
                    </div>

                    <Link
                      href={`/admin/${form.slug}`}
                      className="inline-flex items-center px-4 py-2 bg-[#18181B] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#27272A] transition"
                    >
                      Consulter ({submissionsCount})
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 2 note */}
        <div className="mt-8 p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5] text-xs text-[#71717A]">
          <strong>Note de configuration:</strong> Pour ajouter ou modifier des formulaires en phase 1, utilisez la migration SQL ou le script de seed (<code>supabase/seeds/001_recruitment_seed.sql</code>). L&apos;éditeur visuel est prévu pour la phase 2.
        </div>
      </div>
    </div>
  );
}
