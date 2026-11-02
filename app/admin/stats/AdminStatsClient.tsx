'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FormRecord, FormFieldRecord, SubmissionRecord } from '@/types/form';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileSpreadsheet,
  Download,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface FormDataSummary {
  form: FormRecord;
  fields: FormFieldRecord[];
  submissionsCount: number;
}

interface AdminStatsClientProps {
  formsData: FormDataSummary[];
  submissions: SubmissionRecord[];
}

export function AdminStatsClient({ formsData, submissions }: AdminStatsClientProps) {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'forms' | 'timeline' | 'roles'>('all');

  // Overall KPIs
  const totalForms = formsData.length;
  const activeForms = formsData.filter((f) => f.form.status === 'open').length;
  const totalSubmissions = submissions.length;

  const sentCount = submissions.filter((s) => s.email_status === 'sent').length;
  const failedCount = submissions.filter((s) => s.email_status === 'failed').length;
  const pendingCount = submissions.filter((s) => s.email_status === 'pending').length;
  const emailRate = totalSubmissions > 0 ? Math.round((sentCount / totalSubmissions) * 100) : 100;

  // 1. DATA: Submissions per Form (for Bar Chart)
  const formVolumeData = useMemo(() => {
    return formsData.map(({ form, submissionsCount, fields }) => ({
      id: form.id,
      title: form.title,
      slug: form.slug,
      count: submissionsCount,
      status: form.status,
      max: form.max_responses,
      fieldsCount: fields.length,
      pctOfTotal: totalSubmissions > 0 ? Math.round((submissionsCount / totalSubmissions) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [formsData, totalSubmissions]);

  const maxFormSubmissions = useMemo(() => {
    return Math.max(1, ...formVolumeData.map((f) => f.count));
  }, [formVolumeData]);

  // 2. DATA: Submissions by Day of Week (Monday to Sunday)
  const dayOfWeekData = useMemo(() => {
    const days = [
      { day: 'Dim', fullName: 'Dimanche', count: 0 },
      { day: 'Lun', fullName: 'Lundi', count: 0 },
      { day: 'Mar', fullName: 'Mardi', count: 0 },
      { day: 'Mer', fullName: 'Mercredi', count: 0 },
      { day: 'Jeu', fullName: 'Jeudi', count: 0 },
      { day: 'Ven', fullName: 'Vendredi', count: 0 },
      { day: 'Sam', fullName: 'Samedi', count: 0 },
    ];

    submissions.forEach((sub) => {
      try {
        const d = new Date(sub.created_at);
        const dayIdx = d.getDay();
        if (days[dayIdx]) {
          days[dayIdx].count += 1;
        }
      } catch {}
    });

    // Reorder starting Monday: Lun, Mar, Mer, Jeu, Ven, Sam, Dim
    return [days[1], days[2], days[3], days[4], days[5], days[6], days[0]];
  }, [submissions]);

  const maxDayCount = useMemo(() => {
    return Math.max(1, ...dayOfWeekData.map((d) => d.count));
  }, [dayOfWeekData]);

  // 3. DATA: Submissions by Target Role / Profile
  const roleDistributionData = useMemo(() => {
    const roleCounts: Record<string, number> = {};

    submissions.forEach((sub) => {
      const answers = sub.answers || {};
      const role =
        (answers.target_role as string) ||
        (answers.role as string) ||
        (Array.isArray(answers.roles) ? (answers.roles[0] as string) : null) ||
        'Général / Non spécifié';

      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const entries = Object.entries(roleCounts).map(([name, count]) => ({
      name,
      count,
      pct: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    return entries.length > 0 ? entries : [{ name: 'Candidatures enregistrées', count: totalSubmissions, pct: 100 }];
  }, [submissions, totalSubmissions]);

  const maxRoleCount = useMemo(() => {
    return Math.max(1, ...roleDistributionData.map((r) => r.count));
  }, [roleDistributionData]);

  // 4. DATA: Email Deliverability Donut
  const deliverabilityDonut = useMemo(() => {
    const total = totalSubmissions || 1;
    const sentPct = (sentCount / total) * 100;
    const failedPct = (failedCount / total) * 100;
    const pendingPct = (pendingCount / total) * 100;
    return { sentPct, failedPct, pendingPct };
  }, [totalSubmissions, sentCount, failedCount, pendingCount]);

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B33FF]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B33FF]">
              Analytique &amp; Rapports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Statistiques &amp; Rapports d&apos;activité
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl">
            Visualisez les performances de vos formulaires en direct, la répartition des profils candidats et téléchargez les rapports officiels au format Excel stylisé.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition"
          >
            Retour aux formulaires
          </Link>
        </div>
      </div>

      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Total Candidatures
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#3B33FF]/10 text-[#3B33FF] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#18181B] tracking-tight">{totalSubmissions}</p>
          <div className="flex items-center gap-1.5 text-xs text-[#059669] font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Toutes sessions confondues</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Formulaires Actifs
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#059669] tracking-tight">
            {activeForms} <span className="text-sm font-normal text-[#71717A]">/ {totalForms}</span>
          </p>
          <p className="text-xs text-[#71717A]">
            {activeForms === totalForms ? 'Tous les formulaires sont ouverts' : `${totalForms - activeForms} fermé(s) ou brouillon(s)`}
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Délivrance Accusés
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#8B3EE1]/10 text-[#8B3EE1] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#8B3EE1] tracking-tight">{emailRate}%</p>
          <p className="text-xs text-[#71717A]">
            {sentCount} envoyé(s) avec succès
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Échecs SMTP
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${failedCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]'}`}>
            {failedCount}
          </p>
          <p className="text-xs text-[#71717A]">
            {failedCount === 0 ? '0 incident de transmission' : `${failedCount} notification(s) échouée(s)`}
          </p>
        </div>
      </div>

      {/* Chart View Selector Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-[#E6DFD5] shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveChartTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeChartTab === 'all'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF8F5]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Vue d&apos;ensemble</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('forms')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeChartTab === 'forms'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF8F5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Volume par Formulaire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('timeline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeChartTab === 'timeline'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF8F5]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Activité Hebdomadaire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeChartTab === 'roles'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF8F5]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Profils &amp; Rôles</span>
          </button>
        </div>

        <span className="text-[11px] font-semibold text-[#71717A] px-3 hidden sm:inline">
          Graphiques vectoriels interactifs
        </span>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: BAR CHART 1 (Volume par Formulaire)                      */}
      {/* =================================================================== */}
      {(activeChartTab === 'all' || activeChartTab === 'forms') && (
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6DFD5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#3B33FF]/10 text-[#3B33FF] flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Histogramme : Volume de candidatures par Formulaire
                </h3>
                <p className="text-xs text-[#71717A]">
                  Comparaison directe du nombre de candidatures reçues par rapport au plafond et au volume total.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#3B33FF] bg-[#3B33FF]/10 px-3 py-1 rounded-full self-start sm:self-auto">
              {totalSubmissions} réponses au total
            </span>
          </div>

          {formVolumeData.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A]">
              Aucun formulaire créé pour le moment.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {formVolumeData.map((f, idx) => {
                const barWidth = totalSubmissions > 0 ? (f.count / maxFormSubmissions) * 100 : 0;
                return (
                  <div key={f.id} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-[#FAF8F5] border border-[#E6DFD5] font-bold text-[10px] text-[#52525B] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#18181B] truncate">{f.title}</span>
                        <span className="text-[10px] text-[#71717A] font-mono">/f/{f.slug}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-[#18181B]">
                          {f.count} candidat{f.count > 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] text-[#71717A]">({f.pctOfTotal}%)</span>
                        <a
                          href={`/admin/${f.slug}/export`}
                          download
                          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] hover:underline bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]"
                          title="Télécharger le rapport Excel"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel</span>
                        </a>
                      </div>
                    </div>

                    {/* Visual Animated Bar */}
                    <div className="w-full h-4 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DFD5] p-0.5">
                      <div
                        className="h-full rounded-full brand-gradient-bar transition-all duration-700"
                        style={{ width: `${Math.max(barWidth, f.count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: CHARTS GRID (Weekly Timeline + Roles + Deliverability)   */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 2: Submissions by Day of Week (Vertical Bar Chart) */}
        {(activeChartTab === 'all' || activeChartTab === 'timeline') && (
          <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Activité : Répartition par Jour
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Jours de la semaine les plus sollicités par les candidats.
                  </p>
                </div>
              </div>
              <Activity className="w-4 h-4 text-[#71717A]" />
            </div>

            {/* Vertical Bar Histogram */}
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between gap-3 h-44 px-2">
                {dayOfWeekData.map((d) => {
                  const heightPct = (d.count / maxDayCount) * 100;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#18181B] group-hover:scale-110 transition-transform">
                        {d.count}
                      </span>
                      <div className="w-full max-w-[38px] bg-[#FAF8F5] rounded-t-lg h-32 flex items-end p-0.5 border border-[#E6DFD5]">
                        <div
                          className="w-full bg-[#059669] hover:bg-[#047857] rounded-t-md transition-all duration-500"
                          style={{ height: `${Math.max(heightPct, d.count > 0 ? 8 : 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#52525B] mt-1">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#71717A]">
              <span>Horodatage automatique</span>
              <span className="font-semibold text-[#18181B]">
                Pic d&apos;activité : {dayOfWeekData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev)).fullName}
              </span>
            </div>
          </div>
        )}

        {/* CHART 3: Deliverability Donut & Roles Breakdown */}
        {(activeChartTab === 'all' || activeChartTab === 'roles') && (
          <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B3EE1]/10 text-[#8B3EE1] flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Taux d&apos;accusés de réception &amp; SMTP
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Performance en temps réel de délivrabilité des notifications.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#059669] bg-[#059669]/10 px-2.5 py-0.5 rounded-full">
                {emailRate}% délivré
              </span>
            </div>

            {/* Visual Progress Stats Breakdown */}
            <div className="space-y-4 py-2">
              {/* Sent */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#059669]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span>Délivrés avec succès</span>
                  </span>
                  <span className="font-bold text-[#18181B]">
                    {sentCount} ({Math.round(deliverabilityDonut.sentPct)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DFD5]">
                  <div
                    className="h-full bg-[#059669] rounded-full transition-all duration-500"
                    style={{ width: `${deliverabilityDonut.sentPct}%` }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#3B33FF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B33FF]" />
                    <span>En attente / Sans accusé</span>
                  </span>
                  <span className="font-bold text-[#18181B]">
                    {pendingCount} ({Math.round(deliverabilityDonut.pendingPct)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DFD5]">
                  <div
                    className="h-full bg-[#3B33FF] rounded-full transition-all duration-500"
                    style={{ width: `${deliverabilityDonut.pendingPct}%` }}
                  />
                </div>
              </div>

              {/* Failed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#DC2626]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                    <span>Échecs de transmission</span>
                  </span>
                  <span className="font-bold text-[#18181B]">
                    {failedCount} ({Math.round(deliverabilityDonut.failedPct)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DFD5]">
                  <div
                    className="h-full bg-[#DC2626] rounded-full transition-all duration-500"
                    style={{ width: `${deliverabilityDonut.failedPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#71717A]">
              <span>Serveur SMTP Zoho Club</span>
              <span className="text-[11px] text-[#52525B]">
                event@new-era-medical-club-univ-ouargla.dz
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* SECTION 3: PROFILES & ROLES DISTRIBUTION                            */}
      {/* =================================================================== */}
      {(activeChartTab === 'all' || activeChartTab === 'roles') && (
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8B3EE1]/10 text-[#8B3EE1] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Répartition des Candidats par Rôle &amp; Profil Cible
                </h3>
                <p className="text-xs text-[#71717A]">
                  Distribution des répondants selon leur profil déclaré dans les formulaires.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {roleDistributionData.map((role) => (
              <div
                key={role.name}
                className="p-4 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5]/80 space-y-2 hover:bg-white transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#18181B] truncate">
                    {role.name}
                  </span>
                  <span className="text-xs font-extrabold text-[#8B3EE1] bg-[#8B3EE1]/10 px-2 py-0.5 rounded-full">
                    {role.count}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E6DFD5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8B3EE1] rounded-full transition-all duration-500"
                    style={{ width: `${(role.count / maxRoleCount) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>Proportion globale</span>
                  <span className="font-semibold">{role.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: MASTER TABLE WITH 1-CLICK EXCEL (.XLSX) DOWNLOADS        */}
      {/* =================================================================== */}
      <div className="bg-white border border-[#E6DFD5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#10B981]" />
              <span>Exports Excel Officiels par Formulaire</span>
            </h3>
            <p className="text-xs text-[#71717A]">
              Téléchargez le rapport stylisé Microsoft Excel (.xlsx) conforme au cahier des charges New Era.
            </p>
          </div>

          <span className="text-xs font-semibold text-[#52525B]">
            {formsData.length} formulaire{formsData.length > 1 ? 's' : ''} disponible{formsData.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y divide-[#E6DFD5]">
          {formsData.map(({ form, fields, submissionsCount }) => (
            <div
              key={form.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5]/50 transition"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-[#18181B]">{form.title}</h4>
                  <span className="text-[10px] font-mono text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DFD5]">
                    /f/{form.slug}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      form.status === 'open'
                        ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                        : 'bg-[#FAF8F5] text-[#71717A] border border-[#E6DFD5]'
                    }`}
                  >
                    {form.status === 'open' ? 'Ouvert' : form.status}
                  </span>
                </div>
                <p className="text-xs text-[#71717A]">
                  {fields.length} questions • {submissionsCount} candidatures enregistrées
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <Link
                  href={`/admin/${form.slug}`}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E6DFD5] text-[#18181B] hover:bg-[#FAF8F5] transition shadow-2xs"
                >
                  Consulter ({submissionsCount})
                </Link>

                <a
                  href={`/admin/${form.slug}/export`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  title="Télécharger le rapport Excel stylisé conforme à la référence"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
                  <span>Télécharger Excel (.xlsx)</span>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
