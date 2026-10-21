import { getAdminForms, getAllAdminSubmissions } from '@/lib/supabase/admin';
import Link from 'next/link';

export const metadata = {
  title: 'Statistiques — Administration New Era Medical Club',
};

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const formsSummary = await getAdminForms();
  const allSubs = await getAllAdminSubmissions();

  const totalForms = formsSummary.length;
  const totalSubmissions = formsSummary.reduce((acc, curr) => acc + curr.submissionsCount, 0);

  const sentCount = allSubs.filter((s) => s.email_status === 'sent').length;
  const failedCount = allSubs.filter((s) => s.email_status === 'failed').length;
  const pendingCount = allSubs.filter((s) => s.email_status === 'pending').length;

  const emailRate =
    allSubs.length > 0 ? Math.round((sentCount / allSubs.length) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[#E6DFD5]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
          Statistiques & Rapports d&apos;activité
        </h1>
        <p className="text-xs sm:text-sm text-[#52525B] mt-1">
          Aperçu global des candidatures, des taux de délivrabilité d&apos;emails et des performances des formulaires.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Formulaires créés
          </p>
          <p className="text-3xl font-extrabold text-[#18181B] mt-1">{totalForms}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Gérés depuis le tableau de bord</p>
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Candidatures reçues
          </p>
          <p className="text-3xl font-extrabold text-[#3B33FF] mt-1">{totalSubmissions}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Toutes sessions confondues</p>
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Taux d&apos;emails délivrés
          </p>
          <p className="text-3xl font-extrabold text-[#059669] mt-1">{emailRate}%</p>
          <p className="text-[11px] text-[#71717A] mt-1">{sentCount} envoyés sur {allSubs.length} traités</p>
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Échecs d&apos;envoi SMTP
          </p>
          <p className={`text-3xl font-extrabold mt-1 ${failedCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]'}`}>
            {failedCount}
          </p>
          <p className="text-[11px] text-[#71717A] mt-1">{pendingCount} en attente</p>
        </div>
      </div>

      {/* Forms Performance Breakdown */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5]">
          <h2 className="text-base font-bold text-[#18181B]">
            Répartition des candidatures par formulaire
          </h2>
          <p className="text-xs text-[#52525B]">
            Volume de candidatures et statut actuel de chaque formulaire.
          </p>
        </div>

        <div className="divide-y divide-[#E6DFD5]">
          {formsSummary.map(({ form, fieldsCount, submissionsCount }) => {
            const pct =
              totalSubmissions > 0
                ? Math.round((submissionsCount / totalSubmissions) * 100)
                : 0;

            return (
              <div key={form.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#18181B]">{form.title}</span>
                    <span className="text-xs text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DFD5]">
                      /f/{form.slug}
                    </span>
                  </div>
                  <div className="w-full bg-[#E6DFD5] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="brand-gradient-bar h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#71717A] pt-1">
                    <span>{fieldsCount} questions</span>
                    <span>Statut : {form.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#18181B]">
                      {submissionsCount}
                    </div>
                    <div className="text-xs text-[#71717A]">{pct}% du total</div>
                  </div>

                  <Link
                    href={`/admin/${form.slug}`}
                    className="px-3 py-1.5 border border-[#E6DFD5] rounded-lg text-xs font-semibold hover:bg-[#FAF8F5] transition"
                  >
                    Voir réponses
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Infrastructure Status */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#18181B]">Infrastructure de messagerie (SMTP)</h3>
        <p className="text-xs text-[#52525B] leading-relaxed">
          Les notifications sont configurées pour être expédiées depuis{' '}
          <strong>event@new-era-medical-club-univ-ouargla.dz</strong>. En cas de coupure réseau ou d&apos;indisponibilité temporaire du serveur SMTP, les candidatures sont systématiquement sauvegardées dans la base de données sans perte d&apos;information pour le candidat.
        </p>
      </div>
    </div>
  );
}
