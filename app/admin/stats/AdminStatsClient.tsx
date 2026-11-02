'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FormRecord, FormFieldRecord, SubmissionRecord } from '@/types/form';
import {
  BarChart3,
  PieChart,
  CircleDot,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Download,
  Activity,
  Layers,
  Sparkles,
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

export interface ChartSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

// ---------------------------------------------------------------------------
// VIBRANT COLOR PALETTES FOR CIRCULAR PIE & DONUT CHARTS
// ---------------------------------------------------------------------------
const CIRCLE_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#3B82F6', // Cobalt Blue
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Violet
  '#84CC16', // Lime
];

// ---------------------------------------------------------------------------
// ROBUST INTERACTIVE SVG CIRCULAR PIE & DONUT CHART COMPONENT
// ---------------------------------------------------------------------------
interface SvgCircularChartProps {
  title: string;
  subtitle: string;
  slices: ChartSlice[];
  totalLabel?: string;
  centerDefaultOverride?: { value: string | number; label: string };
  defaultType?: 'donut' | 'pie';
}

function SvgCircularChart({
  title,
  subtitle,
  slices,
  totalLabel = 'candidats',
  centerDefaultOverride,
  defaultType = 'donut',
}: SvgCircularChartProps) {
  const [chartType, setChartType] = useState<'donut' | 'pie'>(defaultType);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = useMemo(() => {
    return slices.reduce((acc, s) => acc + s.value, 0);
  }, [slices]);

  const cx = 100;
  const cy = 100;
  const defaultR = 76;
  const defaultInnerR = chartType === 'donut' ? 48 : 0;

  // Filter non-zero slices for actual SVG arc geometry
  const nonZeroSlices = useMemo(() => {
    return slices.filter((s) => s.value > 0);
  }, [slices]);

  // Compute angles & SVG paths for non-zero slices
  const computedArcs = useMemo(() => {
    if (total === 0 || nonZeroSlices.length === 0) return [];

    // Case 1: Exactly 1 non-zero slice => Full 360 circle
    if (nonZeroSlices.length === 1) {
      const single = nonZeroSlices[0];
      return [
        {
          ...single,
          isFullCircle: true,
          pct: 100,
          pathData: '',
        },
      ];
    }

    // Case 2: Multiple non-zero slices => Compute SVG arc paths
    let currentAngle = -Math.PI / 2; // 12 o'clock

    return nonZeroSlices.map((slice) => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle += sliceAngle;

      const isHovered = hoveredId === slice.id;
      const rOut = isHovered ? defaultR + 5 : defaultR;
      const rIn = defaultInnerR;

      // Slight pop-out shift along midAngle on hover
      const shiftDist = isHovered ? 3 : 0;
      const shiftX = Math.cos(midAngle) * shiftDist;
      const shiftY = Math.sin(midAngle) * shiftDist;

      const x1Out = cx + shiftX + rOut * Math.cos(startAngle);
      const y1Out = cy + shiftY + rOut * Math.sin(startAngle);
      const x2Out = cx + shiftX + rOut * Math.cos(endAngle);
      const y2Out = cy + shiftY + rOut * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const pct = Math.round((slice.value / total) * 100);

      let pathData = '';
      if (rIn > 0) {
        // Donut arc path
        const x2In = cx + shiftX + rIn * Math.cos(endAngle);
        const y2In = cy + shiftY + rIn * Math.sin(endAngle);
        const x1In = cx + shiftX + rIn * Math.cos(startAngle);
        const y1In = cy + shiftY + rIn * Math.sin(startAngle);

        pathData = `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1In} ${y1In} Z`;
      } else {
        // Pie arc path
        pathData = `M ${cx + shiftX} ${cy + shiftY} L ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2Out} ${y2Out} Z`;
      }

      return {
        ...slice,
        isFullCircle: false,
        pct,
        pathData,
      };
    });
  }, [nonZeroSlices, total, hoveredId, chartType, defaultInnerR]);

  // Active slice when user hovers either on the circular chart or on the legend row
  const activeSlice = useMemo(() => {
    if (!hoveredId) return null;
    const found = slices.find((s) => s.id === hoveredId);
    if (!found) return null;
    const pct = total > 0 ? Math.round((found.value / total) * 100) : 0;
    return { ...found, pct };
  }, [hoveredId, slices, total]);

  return (
    <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
      {/* Card Header: Title & View Toggle */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E6DFD5]">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-[#18181B] truncate">
            {title}
          </h3>
          <p className="text-[11px] text-[#71717A] truncate mt-0.5">{subtitle}</p>
        </div>

        {/* Donut vs Pie Toggle */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E6DFD5] shrink-0">
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md flex items-center gap-1 transition cursor-pointer ${
              chartType === 'donut'
                ? 'bg-white text-[#18181B] shadow-2xs font-bold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
            title="Mode Anneau"
          >
            <CircleDot className="w-3 h-3" />
            <span className="hidden sm:inline">Anneau</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md flex items-center gap-1 transition cursor-pointer ${
              chartType === 'pie'
                ? 'bg-white text-[#18181B] shadow-2xs font-bold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
            title="Mode Camembert Plein"
          >
            <PieChart className="w-3 h-3" />
            <span className="hidden sm:inline">Plein</span>
          </button>
        </div>
      </div>

      {/* Main Chart Section: Circular Graphic Centered */}
      <div className="py-2 flex justify-center items-center">
        <div className="relative w-[190px] h-[190px] sm:w-[200px] sm:h-[200px] shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-sm select-none"
          >
            {total === 0 || nonZeroSlices.length === 0 ? (
              // Empty State Ring
              <circle
                cx={cx}
                cy={cy}
                r={defaultR - 10}
                fill="none"
                stroke="#E6DFD5"
                strokeWidth={14}
                strokeDasharray="4 4"
              />
            ) : computedArcs.length === 1 && computedArcs[0].isFullCircle ? (
              // Full 360 circle (Single Active Slice)
              chartType === 'donut' ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={(defaultR + defaultInnerR) / 2}
                  fill="none"
                  stroke={computedArcs[0].color}
                  strokeWidth={defaultR - defaultInnerR}
                  onMouseEnter={() => setHoveredId(computedArcs[0].id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer transition-all duration-300 hover:brightness-105"
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={defaultR}
                  fill={computedArcs[0].color}
                  onMouseEnter={() => setHoveredId(computedArcs[0].id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer transition-all duration-300 hover:brightness-105"
                />
              )
            ) : (
              // Multiple Slice Arcs
              computedArcs.map((arc) => {
                const isHovered = hoveredId === arc.id;
                return (
                  <path
                    key={arc.id}
                    d={arc.pathData}
                    fill={arc.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    onMouseEnter={() => setHoveredId(arc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="cursor-pointer transition-all duration-200 hover:brightness-110"
                    style={{
                      transformOrigin: '100px 100px',
                      filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))' : 'none',
                    }}
                  />
                );
              })
            )}
          </svg>

          {/* Donut Center Display */}
          {chartType === 'donut' && (
            <div className="absolute inset-0 m-auto w-[88px] h-[88px] rounded-full bg-white shadow-xs flex flex-col items-center justify-center text-center p-1.5 pointer-events-none transition-all duration-150">
              {activeSlice ? (
                <div className="space-y-0.5 animate-in fade-in duration-100">
                  <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-wider block truncate max-w-[76px]">
                    {activeSlice.label}
                  </span>
                  <span className="text-lg font-black text-[#18181B] leading-none block">
                    {activeSlice.value}
                  </span>
                  <span
                    className="text-[10px] font-black px-1.5 py-0.2 rounded-full inline-block"
                    style={{
                      color: activeSlice.color,
                      backgroundColor: `${activeSlice.color}15`,
                    }}
                  >
                    {activeSlice.pct}%
                  </span>
                </div>
              ) : centerDefaultOverride ? (
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-[#18181B] leading-none block">
                    {centerDefaultOverride.value}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] block truncate max-w-[76px]">
                    {centerDefaultOverride.label}
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-[#18181B] leading-none block">
                    {total}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] block">
                    {totalLabel}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend Rows List: Clean, Balanced, Right-Aligned Metrics */}
      <div className="space-y-1.5 pt-2 border-t border-[#E6DFD5]">
        <div className="max-h-44 overflow-y-auto space-y-1 pr-1 scrollbar-none">
          {slices.map((slice) => {
            const isHovered = hoveredId === slice.id;
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  isHovered
                    ? 'bg-[#FAF8F5] ring-1 ring-[#E6DFD5] shadow-2xs'
                    : 'hover:bg-[#FAF8F5]/70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs transition-transform"
                    style={{
                      backgroundColor: slice.color,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#18181B] truncate">{slice.label}</p>
                    {slice.subtext && (
                      <p className="text-[10px] text-[#71717A] truncate">{slice.subtext}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-[#18181B] tabular-nums">
                    {slice.value}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                    style={{
                      backgroundColor: `${slice.color}15`,
                      color: slice.color,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN ADMIN STATS CLIENT PAGE
// ---------------------------------------------------------------------------
export function AdminStatsClient({ formsData, submissions }: AdminStatsClientProps) {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'pies' | 'forms' | 'timeline'>('all');

  // Overall KPIs
  const totalForms = formsData.length;
  const activeForms = formsData.filter((f) => f.form.status === 'open').length;
  const totalSubmissions = submissions.length;

  const sentCount = submissions.filter((s) => s.email_status === 'sent').length;
  const failedCount = submissions.filter((s) => s.email_status === 'failed').length;
  const pendingCount = submissions.filter((s) => s.email_status === 'pending').length;
  const emailRate = totalSubmissions > 0 ? Math.round((sentCount / totalSubmissions) * 100) : 100;

  // 1. DATA: Submissions per Form (Volumes & Colors)
  const formVolumeData = useMemo(() => {
    return formsData.map(({ form, submissionsCount, fields }, idx) => ({
      id: form.id,
      title: form.title,
      slug: form.slug,
      count: submissionsCount,
      status: form.status,
      max: form.max_responses,
      fieldsCount: fields.length,
      pctOfTotal: totalSubmissions > 0 ? Math.round((submissionsCount / totalSubmissions) * 100) : 0,
      color: CIRCLE_COLORS[idx % CIRCLE_COLORS.length],
    })).sort((a, b) => b.count - a.count);
  }, [formsData, totalSubmissions]);

  const maxFormSubmissions = useMemo(() => {
    return Math.max(1, ...formVolumeData.map((f) => f.count));
  }, [formVolumeData]);

  // Slices for Form Pie Chart
  const formPieSlices: ChartSlice[] = useMemo(() => {
    return formVolumeData.map((f) => ({
      id: f.id,
      label: f.title,
      value: f.count,
      color: f.color,
      subtext: `/f/${f.slug}`,
    }));
  }, [formVolumeData]);

  // 2. DATA: Submissions by Target Role / Profile (Pie Chart)
  const rolePieSlices: ChartSlice[] = useMemo(() => {
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

    const entries = Object.entries(roleCounts).map(([name, count], idx) => ({
      id: `role-${idx}`,
      label: name,
      value: count,
      color: CIRCLE_COLORS[idx % CIRCLE_COLORS.length],
      subtext: `${count} candidat(s)`,
    })).sort((a, b) => b.value - a.value);

    return entries.length > 0
      ? entries
      : [{ id: 'role-0', label: 'Candidatures enregistrées', value: totalSubmissions, color: '#4F46E5' }];
  }, [submissions, totalSubmissions]);

  // 3. DATA: Email Deliverability Radial Donut Slices
  const emailDeliverabilitySlices: ChartSlice[] = useMemo(() => {
    return [
      {
        id: 'sent',
        label: 'Délivrés avec succès',
        value: sentCount,
        color: '#10B981', // Emerald
        subtext: 'Accusé réception envoyé',
      },
      {
        id: 'pending',
        label: 'En attente / Sans accusé',
        value: pendingCount,
        color: '#3B82F6', // Cobalt Blue
        subtext: 'Enregistré dans la base',
      },
      {
        id: 'failed',
        label: 'Échecs de transmission',
        value: failedCount,
        color: '#EF4444', // Coral Red
        subtext: 'Erreur SMTP ou boîte pleine',
      },
    ];
  }, [sentCount, pendingCount, failedCount]);

  // 4. DATA: Submissions by Day of Week
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

    return [days[1], days[2], days[3], days[4], days[5], days[6], days[0]];
  }, [submissions]);

  const maxDayCount = useMemo(() => {
    return Math.max(1, ...dayOfWeekData.map((d) => d.count));
  }, [dayOfWeekData]);

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
              Analytique &amp; Rapports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Tableau de Bord Analytique &amp; Statistiques
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl">
            Visualisez les performances en direct via des anneaux et camemberts interactifs, et téléchargez les classeurs Excel (.xlsx) thématisés pour chaque formulaire.
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

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Total Candidatures
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#18181B] tracking-tight">{totalSubmissions}</p>
          <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
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
            <span className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#10B981] tracking-tight">
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
            <span className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#8B5CF6] tracking-tight">{emailRate}%</p>
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
            <span className="w-8 h-8 rounded-lg bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${failedCount > 0 ? 'text-[#EF4444]' : 'text-[#71717A]'}`}>
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
            <PieChart className="w-3.5 h-3.5" />
            <span>Tous les Graphiques</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('pies')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeChartTab === 'pies'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-transparent text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF8F5]'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Anneaux &amp; Camemberts</span>
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
        </div>

        <span className="text-[11px] font-semibold text-[#71717A] px-3 hidden sm:inline">
          Graphiques vectoriels interactifs SVG
        </span>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: BALANCED 3-COLUMN CIRCULAR CHARTS GRID                   */}
      {/* =================================================================== */}
      {(activeChartTab === 'all' || activeChartTab === 'pies') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Circular Chart 1: Role / Target Profile Distribution */}
          <SvgCircularChart
            title="Profils &amp; Rôles Cibles"
            subtitle="Répartition des filières candidates"
            slices={rolePieSlices}
            totalLabel="candidats"
            defaultType="donut"
          />

          {/* Circular Chart 2: Forms Submission Distribution */}
          <SvgCircularChart
            title="Volume par Formulaire"
            subtitle="Part de chaque formulaire dans le total"
            slices={formPieSlices}
            totalLabel="réponses"
            defaultType="donut"
          />

          {/* Circular Chart 3: Email Deliverability Ring */}
          <SvgCircularChart
            title="Délivrance Accusés (SMTP)"
            subtitle="Taux de transmission des notifications"
            slices={emailDeliverabilitySlices}
            totalLabel="notifications"
            centerDefaultOverride={{ value: `${emailRate}%`, label: 'Délivrés' }}
            defaultType="donut"
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: VOLUME HISTOGRAM (Horizontal Bar Chart)                  */}
      {/* =================================================================== */}
      {(activeChartTab === 'all' || activeChartTab === 'forms') && (
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6DFD5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Histogramme : Volume de candidatures par Formulaire
                </h3>
                <p className="text-xs text-[#71717A]">
                  Comparaison directe du nombre de candidatures reçues avec lien direct d&apos;exportation Excel (.xlsx) stylisé.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-1 rounded-full self-start sm:self-auto">
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
                        <span
                          className="w-5 h-5 rounded-md font-bold text-[10px] text-white flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: f.color }}
                        >
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
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:underline bg-[#ECFDF5] px-2.5 py-0.5 rounded-lg border border-[#A7F3D0]"
                          title="Télécharger le rapport Excel stylisé personnalisé"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel (.xlsx)</span>
                        </a>
                      </div>
                    </div>

                    {/* Colored Progress Bar */}
                    <div className="w-full h-3.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DFD5] p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(barWidth, f.count > 0 ? 3 : 0)}%`,
                          backgroundColor: f.color,
                        }}
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
      {/* SECTION 3: WEEKLY ACTIVITY HISTOGRAM                                */}
      {/* =================================================================== */}
      {(activeChartTab === 'all' || activeChartTab === 'timeline') && (
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#18181B]">
                  Activité Hebdomadaire : Répartition par Jour
                </h3>
                <p className="text-xs text-[#71717A]">
                  Fréquentation et volume de soumissions enregistrées du Lundi au Dimanche.
                </p>
              </div>
            </div>
            <Activity className="w-4 h-4 text-[#71717A]" />
          </div>

          {/* Vertical Bar Histogram */}
          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between gap-3 h-48 px-2">
              {dayOfWeekData.map((d) => {
                const heightPct = (d.count / maxDayCount) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-bold text-[#18181B] group-hover:scale-110 transition-transform">
                      {d.count}
                    </span>
                    <div className="w-full max-w-[44px] bg-[#FAF8F5] rounded-t-xl h-36 flex items-end p-1 border border-[#E6DFD5]">
                      <div
                        className="w-full bg-[#10B981] hover:bg-[#059669] rounded-t-lg transition-all duration-500 shadow-2xs"
                        style={{ height: `${Math.max(heightPct, d.count > 0 ? 8 : 3)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#52525B] mt-1">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#71717A]">
            <span>Horodatage en temps réel</span>
            <span className="font-semibold text-[#18181B]">
              Jour le plus actif : {dayOfWeekData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev)).fullName}
            </span>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: MASTER TABLE WITH 1-CLICK DYNAMIC EXCEL DOWNLOADS        */}
      {/* =================================================================== */}
      <div className="bg-white border border-[#E6DFD5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#10B981]" />
              <span>Exports Excel Personnalisés par Formulaire</span>
            </h3>
            <p className="text-xs text-[#71717A]">
              Chaque formulaire dispose d&apos;une palette de couleurs dynamique exclusive liée à son identité et d&apos;en-têtes de colonnes structurés.
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
                  title="Télécharger le rapport Excel personnalisé avec thème exclusif"
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
