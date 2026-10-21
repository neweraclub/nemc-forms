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
          <p className="text-[11px] text-[#71717A] mt-1">
            {failedCount === 0 ? 'Aucun échec (mesure en direct)' : `${failedCount} notification(s) échouée(s)`}
          </p>
        </div>
      </div>

      {/* Forms Performance Breakdown */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5]">
          <h2 className="text-base font-bold text-[#18181B]">
            Répartition des candidatures par formulaire
          </h2>
          <p className="text-xs text-[#52525B]">
            Volume de candidatures, capacité configurée et statut actuel de chaque formulaire.
          </p>
        </div>

        <div className="divide-y divide-[#E6DFD5]">
          {formsSummary.map(({ form, fieldsCount, submissionsCount }) => {
            const hasMax = typeof form.max_responses === 'number' && form.max_responses > 0;
            const max = form.max_responses || 0;
            const pct = hasMax
              ? Math.min(100, Math.round((submissionsCount / max) * 100))
              : 0;
            const isFull = hasMax && submissionsCount >= max;

            return (
              <div key={form.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#18181B]">{form.title}</span>
                    <span className="text-xs text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DFD5]">
                      /f/{form.slug}
                    </span>
                    {hasMax ? (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isFull
                            ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                            : 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                        }`}
                      >
                        {isFull ? 'Complet (Quota atteint)' : `Plafond : ${max} max`}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        Places illimitées
                      </span>
                    )}
                  </div>

                  {/* Capacity-based progress bar */}
                  <div className="w-full bg-[#E6DFD5] h-2.5 rounded-full overflow-hidden mt-2">
                    {hasMax ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-[#DC2626]' : 'brand-gradient-bar'
                        }`}
                        style={{ width: `${Math.max(pct, submissionsCount > 0 ? 5 : 0)}%` }}
                      />
                    ) : (
                      <div
                        className="brand-gradient-bar h-full rounded-full transition-all duration-500"
                        style={{ width: submissionsCount > 0 ? '100%' : '0%' }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#71717A] pt-1 flex-wrap">
                    <span>{fieldsCount} question{fieldsCount > 1 ? 's' : ''}</span>
                    <span>Statut : <strong className="text-[#18181B]">{form.status}</strong></span>
                    {form.closes_at && (
                      <span className="text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                        Fin : {new Date(form.closes_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#18181B]">
                      {hasMax ? (
                        <>
                          <span>{submissionsCount}</span>
                          <span className="text-xs text-[#71717A] font-normal"> / {max}</span>
                        </>
                      ) : (
                        <span>{submissionsCount}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium">
                      {hasMax ? (
                        isFull ? (
                          <span className="text-[#DC2626] font-bold">100% (Complet)</span>
                        ) : (
                          <span className="text-[#71717A]">{pct}% du quota</span>
                        )
                      ) : (
                        <span className="text-[#059669]">Illimité</span>
                      )}
                    </div>
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
