import { NextRequest, NextResponse } from 'next/server';
import { getAdminSubmissions } from '@/lib/supabase/admin';
import ExcelJS from 'exceljs';

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = Array.isArray(val) ? val.join('; ') : String(val);
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// ---------------------------------------------------------------------------
// DYNAMIC COLOR THEMES ENGINE (100% Unique Palette per Form)
// ---------------------------------------------------------------------------
interface ExcelTheme {
  name: string;
  tabColor: string;
  bannerPrimary: string;
  bannerAccent: string;
  superHeaderSystem: string;
  superHeaderCandidate: string;
  superHeaderQuestions: string;
  colHeaderSystem: string;
  colHeaderCandidate: string;
  colHeaderQuestions: string;
  zebraEven: string;
  zebraOdd: string;
  borderColor: string;
  kpiCards: [
    { title: string; bg: string; text: string; border: string },
    { title: string; bg: string; text: string; border: string },
    { title: string; bg: string; text: string; border: string },
    { title: string; bg: string; text: string; border: string },
  ];
}

const THEME_PALETTES: ExcelTheme[] = [
  // 1. Emerald & Mint (Medical Health)
  {
    name: 'Émeraude Médicale',
    tabColor: 'FF064E3B',
    bannerPrimary: 'FF064E3B',
    bannerAccent: 'FF10B981',
    superHeaderSystem: 'FF134E4A',
    superHeaderCandidate: 'FF065F46',
    superHeaderQuestions: 'FF047857',
    colHeaderSystem: 'FF0F766E',
    colHeaderCandidate: 'FF047857',
    colHeaderQuestions: 'FF065F46',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFF0FDF4',
    borderColor: 'FFA7F3D0',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Accusés E-mail', bg: 'FFF0FDF4', text: 'FF166534', border: 'FFBBF7D0' },
      { title: 'Questions Actives', bg: 'FFF0FDFA', text: 'FF0F766E', border: 'FF99F6E4' },
      { title: 'Capacité Quota', bg: 'FFFEF9C3', text: 'FF854D0E', border: 'FFFEF08A' },
    ],
  },
  // 2. Cobalt Sapphire & Electric Sky (Kasdi Merbah University)
  {
    name: 'Saphir Cobalt',
    tabColor: 'FF1E3A8A',
    bannerPrimary: 'FF1E3A8A',
    bannerAccent: 'FF0284C7',
    superHeaderSystem: 'FF1E293B',
    superHeaderCandidate: 'FF1E40AF',
    superHeaderQuestions: 'FF1D4ED8',
    colHeaderSystem: 'FF334155',
    colHeaderCandidate: 'FF2563EB',
    colHeaderQuestions: 'FF1D4ED8',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFF0F9FF',
    borderColor: 'FFBAE6FD',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFEFF6FF', text: 'FF1E40AF', border: 'FFBFDBFE' },
      { title: 'Accusés E-mail', bg: 'FFF0FDF4', text: 'FF166534', border: 'FFBBF7D0' },
      { title: 'Questions Actives', bg: 'FFF0F9FF', text: 'FF0369A1', border: 'FFBAE6FD' },
      { title: 'Capacité Quota', bg: 'FFFEF3C7', text: 'FF92400E', border: 'FFFDE68A' },
    ],
  },
  // 3. Royal Violet & Lavender (Academic Excellence)
  {
    name: 'Violet Royal',
    tabColor: 'FF4C1D95',
    bannerPrimary: 'FF4C1D95',
    bannerAccent: 'FF8B5CF6',
    superHeaderSystem: 'FF312E81',
    superHeaderCandidate: 'FF5B21B6',
    superHeaderQuestions: 'FF6D28D9',
    colHeaderSystem: 'FF4338CA',
    colHeaderCandidate: 'FF6D28D9',
    colHeaderQuestions: 'FF5B21B6',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFF5F3FF',
    borderColor: 'FFDDD6FE',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFF5F3FF', text: 'FF5B21B6', border: 'FFDDD6FE' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFEDE9FE', text: 'FF6D28D9', border: 'FFC4B5FD' },
      { title: 'Capacité Quota', bg: 'FFFFFBEB', text: 'FFB45309', border: 'FFFDE68A' },
    ],
  },
  // 4. Crimson Ruby & Coral (Clinical Urgentology)
  {
    name: 'Rubis Clinique',
    tabColor: 'FF881337',
    bannerPrimary: 'FF881337',
    bannerAccent: 'FFF43F5E',
    superHeaderSystem: 'FF4C0519',
    superHeaderCandidate: 'FF9F1239',
    superHeaderQuestions: 'FFBE123C',
    colHeaderSystem: 'FF881337',
    colHeaderCandidate: 'FFE11D48',
    colHeaderQuestions: 'FFBE123C',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFFFF1F2',
    borderColor: 'FFFECDD3',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFFFF1F2', text: 'FF9F1239', border: 'FFFECDD3' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFFFE4E6', text: 'FFBE123C', border: 'FFF43F5E' },
      { title: 'Capacité Quota', bg: 'FFFEF3C7', text: 'FF92400E', border: 'FFFDE68A' },
    ],
  },
  // 5. Deep Abyssal Teal & Cyan (Kasdi Merbah Oasis)
  {
    name: 'Oasis Kasdi Merbah',
    tabColor: 'FF0F3A4B',
    bannerPrimary: 'FF0F3A4B',
    bannerAccent: 'FF14B8A6',
    superHeaderSystem: 'FF134E4A',
    superHeaderCandidate: 'FF115E59',
    superHeaderQuestions: 'FF0D9488',
    colHeaderSystem: 'FF115E59',
    colHeaderCandidate: 'FF0D9488',
    colHeaderQuestions: 'FF14B8A6',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFF0FDFA',
    borderColor: 'FF99F6E4',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFF0FDFA', text: 'FF115E59', border: 'FF99F6E4' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFF0F9FF', text: 'FF075985', border: 'FFBAE6FD' },
      { title: 'Capacité Quota', bg: 'FFFEF9C3', text: 'FF854D0E', border: 'FFFEF08A' },
    ],
  },
  // 6. Sahara Terracotta & Amber (Ouargla Desert Sun)
  {
    name: 'Ambre Sahara',
    tabColor: 'FF7C2D12',
    bannerPrimary: 'FF7C2D12',
    bannerAccent: 'FFF59E0B',
    superHeaderSystem: 'FF431407',
    superHeaderCandidate: 'FF9A3412',
    superHeaderQuestions: 'FFC2410C',
    colHeaderSystem: 'FF7C2D12',
    colHeaderCandidate: 'FFEA580C',
    colHeaderQuestions: 'FFC2410C',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFFFF7ED',
    borderColor: 'FFFED7AA',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFFFF7ED', text: 'FF9A3412', border: 'FFFED7AA' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFFEF3C7', text: 'FFB45309', border: 'FFFDE68A' },
      { title: 'Capacité Quota', bg: 'FFFFFBEB', text: 'FFB45309', border: 'FFFDE68A' },
    ],
  },
  // 7. Executive Midnight Slate & Gold (Lead Board)
  {
    name: 'Ardoise Exécutive',
    tabColor: 'FF0F172A',
    bannerPrimary: 'FF0F172A',
    bannerAccent: 'FFEAB308',
    superHeaderSystem: 'FF1E293B',
    superHeaderCandidate: 'FF334155',
    superHeaderQuestions: 'FF1E293B',
    colHeaderSystem: 'FF334155',
    colHeaderCandidate: 'FF475569',
    colHeaderQuestions: 'FF1E293B',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFF8FAFC',
    borderColor: 'FFCBD5E1',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFF8FAFC', text: 'FF0F172A', border: 'FFE2E8F0' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFEFF6FF', text: 'FF1E40AF', border: 'FFBFDBFE' },
      { title: 'Capacité Quota', bg: 'FFFFFBEB', text: 'FFB45309', border: 'FFFDE68A' },
    ],
  },
  // 8. Plum Orchid & Fuchsia (New Era Creative)
  {
    name: 'Orchidée New Era',
    tabColor: 'FF581C87',
    bannerPrimary: 'FF581C87',
    bannerAccent: 'FFD946EF',
    superHeaderSystem: 'FF3B0764',
    superHeaderCandidate: 'FF6B21A8',
    superHeaderQuestions: 'FF7E22CE',
    colHeaderSystem: 'FF581C87',
    colHeaderCandidate: 'FF9333EA',
    colHeaderQuestions: 'FF7E22CE',
    zebraEven: 'FFFFFFFF',
    zebraOdd: 'FFFAF5FF',
    borderColor: 'FFF5D0FE',
    kpiCards: [
      { title: 'Total Candidatures', bg: 'FFFAF5FF', text: 'FF6B21A8', border: 'FFF5D0FE' },
      { title: 'Accusés E-mail', bg: 'FFECFDF5', text: 'FF065F46', border: 'FFA7F3D0' },
      { title: 'Questions Actives', bg: 'FFFDF4FF', text: 'FF86198F', border: 'FFF0ABFC' },
      { title: 'Capacité Quota', bg: 'FFFEF3C7', text: 'FF92400E', border: 'FFFDE68A' },
    ],
  },
];

function getFormTheme(slug: string, title: string): ExcelTheme {
  let hash = 0;
  const str = `${slug}-${title}`.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THEME_PALETTES.length;
  return THEME_PALETTES[index];
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { slug } = await params;
  const { form, fields, submissions } = await getAdminSubmissions(slug);

  if (!form) {
    return new NextResponse('Form not found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  // If CSV explicitly requested, return standard CSV
  if (format === 'csv') {
    const headers = [
      '#',
      'Date de soumission',
      'Email',
      'Statut Email',
      'Profil / Rôle',
      ...fields.map((f) => f.label),
    ];

    const rows: string[] = [];
    rows.push(headers.map(csvEscape).join(','));

    submissions.forEach((sub, idx) => {
      const answers = sub.answers || {};
      const roleVal =
        answers.target_role ||
        answers.role ||
        (Array.isArray(answers.roles) ? answers.roles.join(', ') : '') ||
        'Général';

      const row = [
        String(idx + 1),
        new Date(sub.created_at).toLocaleString('fr-FR'),
        sub.submitter_email || '',
        sub.email_status,
        roleVal,
        ...fields.map((f) => {
          const val = answers[f.key] ?? answers[f.label] ?? answers[f.id];
          if (val === undefined || val === null) return '';
          if (Array.isArray(val)) return val.join('; ');
          if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
          return String(val);
        }),
      ];
      rows.push(row.map(csvEscape).join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="candidatures-${slug}-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // GENERATE DYNAMIC CREATIVE EXCEL (.xlsx) REPORT
  // Every form gets its own bespoke theme, dynamic column linking & custom palette
  // ---------------------------------------------------------------------------
  const theme = getFormTheme(form.slug, form.title);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Club Médical New Era (Université Kasdi Merbah Ouargla)';
  workbook.lastModifiedBy = 'Administration NEMC';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sanitizedTabName = (form.title || 'Candidatures')
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 30);

  const worksheet = workbook.addWorksheet(sanitizedTabName, {
    properties: { tabColor: { argb: theme.tabColor } },
    views: [{ showGridLines: true }],
  });

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const sentEmails = submissions.filter((s) => s.email_status === 'sent').length;
  const deliveryRate = totalSubmissions > 0 ? Math.round((sentEmails / totalSubmissions) * 100) : 100;

  // Header structure: System (2 cols), Candidate (3 cols), Questions (N cols)
  const systemHeaders = ['#', 'Date de soumission'];
  const candidateHeaders = ['Email du Candidat', 'Statut Accusé', 'Profil / Rôle'];
  const questionHeaders = fields.map((f, idx) => `Q${idx + 1} • ${f.label}${f.required ? ' *' : ''}`);
  const allHeaders = [...systemHeaders, ...candidateHeaders, ...questionHeaders];
  const totalCols = Math.max(8, allHeaders.length);

  // Common thin border
  const standardBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: theme.borderColor } },
    left: { style: 'thin', color: { argb: theme.borderColor } },
    bottom: { style: 'thin', color: { argb: theme.borderColor } },
    right: { style: 'thin', color: { argb: theme.borderColor } },
  };

  // 1. BANNER HEADER ROW 1: Institution Header
  worksheet.mergeCells(1, 1, 1, totalCols);
  const instCell = worksheet.getCell(1, 1);
  instCell.value = 'CLUB MÉDICAL NEW ERA • FACULTÉ DE MÉDECINE DE OUARGLA';
  instCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFE2E8F0' } };
  instCell.alignment = { vertical: 'middle', horizontal: 'center' };
  instCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bannerPrimary } };
  worksheet.getRow(1).height = 20;

  // 2. BANNER HEADER ROW 2: Form Title
  worksheet.mergeCells(2, 1, 2, totalCols);
  const titleCell = worksheet.getCell(2, 1);
  titleCell.value = `${form.title.toUpperCase()} — REGISTRE OFFICIEL DES CANDIDATURES`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bannerPrimary } };
  worksheet.getRow(2).height = 28;

  // 3. BANNER HEADER ROW 3: Subtitle & Theme Tag
  const nowStr = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  worksheet.mergeCells(3, 1, 3, totalCols);
  const subCell = worksheet.getCell(3, 1);
  subCell.value = `Formulaire interactif : /f/${form.slug}   |   Thème visuel : ${theme.name}   |   Exporté le : ${nowStr}`;
  subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FFCBD5E1' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bannerPrimary } };
  worksheet.getRow(3).height = 18;

  // 4. ACCENT STRIPE (Row 4)
  worksheet.mergeCells(4, 1, 4, totalCols);
  const accentCell = worksheet.getCell(4, 1);
  accentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bannerAccent } };
  worksheet.getRow(4).height = 4;

  // 5. SPACER (Row 5)
  worksheet.getRow(5).height = 8;

  // 6. METADATA SECTION (Rows 6 & 7)
  const metaRows = [
    {
      k1: 'Établissement Universitaire',
      v1: 'Faculté de Médecine — Université Kasdi Merbah Ouargla',
      k2: 'Statut du Formulaire',
      v2: form.status === 'open' ? 'Ouvert aux candidatures' : form.status === 'closed' ? 'Clôturé' : 'Brouillon',
    },
    {
      k1: 'Périmètre Académique',
      v1: 'Année Universitaire 2026-2027',
      k2: 'Nombre de Questions',
      v2: `${fields.length} questions interactives configurées`,
    },
  ];

  metaRows.forEach((m, idx) => {
    const rIdx = 6 + idx;
    worksheet.getRow(rIdx).height = 19;

    // Col 2 Label
    const k1Cell = worksheet.getCell(rIdx, 2);
    k1Cell.value = m.k1;
    k1Cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF475569' } };
    k1Cell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Col 3-4 Value
    worksheet.mergeCells(rIdx, 3, rIdx, 4);
    const v1Cell = worksheet.getCell(rIdx, 3);
    v1Cell.value = m.v1;
    v1Cell.font = { name: 'Calibri', size: 9.5, bold: false, color: { argb: 'FF0F172A' } };
    v1Cell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Col 6 Label
    const k2Cell = worksheet.getCell(rIdx, 6);
    k2Cell.value = m.k2;
    k2Cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF475569' } };
    k2Cell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Col 7-8 Value
    worksheet.mergeCells(rIdx, 7, rIdx, 8);
    const v2Cell = worksheet.getCell(rIdx, 7);
    v2Cell.value = m.v2;
    v2Cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    v2Cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // 7. DYNAMIC THEMED KPI CARDS (Row 8)
  worksheet.getRow(8).height = 28;

  const kpiData = [
    { text: `Total : ${totalSubmissions} Candidats`, style: theme.kpiCards[0], cols: [1, 2] },
    { text: `Accusés : ${sentEmails} / ${totalSubmissions} (${deliveryRate}%)`, style: theme.kpiCards[1], cols: [3, 4] },
    { text: `Questions : ${fields.length} Champs`, style: theme.kpiCards[2], cols: [5, 6] },
    { text: `Plafond : ${form.max_responses ? form.max_responses + ' max' : 'Illimité'}`, style: theme.kpiCards[3], cols: [7, 8] },
  ];

  kpiData.forEach(({ text, style, cols }) => {
    worksheet.mergeCells(8, cols[0], 8, cols[1]);
    const cell = worksheet.getCell(8, cols[0]);
    cell.value = text;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: style.text } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
    cell.border = {
      top: { style: 'thin', color: { argb: style.border } },
      left: { style: 'thin', color: { argb: style.border } },
      bottom: { style: 'thin', color: { argb: style.border } },
      right: { style: 'thin', color: { argb: style.border } },
    };
  });

  // 8. SPACER (Row 9)
  worksheet.getRow(9).height = 8;

  // 9. SUPER-CATEGORY HEADER ROW (Row 10)
  // Categorizes columns into distinct themed sections: Index, Candidate Info, and Form Questions
  const superRow = worksheet.getRow(10);
  superRow.height = 20;

  // Cols 1-2: Index & Date
  worksheet.mergeCells(10, 1, 10, 2);
  const superSysCell = worksheet.getCell(10, 1);
  superSysCell.value = 'INDEXATION & HORODATAGE';
  superSysCell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FFFFFFFF' } };
  superSysCell.alignment = { vertical: 'middle', horizontal: 'center' };
  superSysCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.superHeaderSystem } };

  // Cols 3-5: Candidate Identity
  worksheet.mergeCells(10, 3, 10, 5);
  const superCandCell = worksheet.getCell(10, 3);
  superCandCell.value = 'IDENTITÉ & CONTACT CANDIDAT';
  superCandCell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FFFFFFFF' } };
  superCandCell.alignment = { vertical: 'middle', horizontal: 'center' };
  superCandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.superHeaderCandidate } };

  // Cols 6 to totalCols: Form Questionnaire
  if (totalCols >= 6) {
    worksheet.mergeCells(10, 6, 10, totalCols);
    const superQuestCell = worksheet.getCell(10, 6);
    superQuestCell.value = `QUESTIONNAIRE SPÉCIFIQUE DU FORMULAIRE (${fields.length} QUESTIONS DYNAMIQUES)`;
    superQuestCell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FFFFFFFF' } };
    superQuestCell.alignment = { vertical: 'middle', horizontal: 'center' };
    superQuestCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.superHeaderQuestions } };
  }

  // 10. MAIN TABLE COLUMN HEADERS (Row 11)
  const headerRow = worksheet.getRow(11);
  headerRow.height = 28;

  allHeaders.forEach((title, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = title;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };

    // Dynamic header coloring per column section
    const colBg =
      colIdx < 2
        ? theme.colHeaderSystem
        : colIdx < 5
        ? theme.colHeaderCandidate
        : theme.colHeaderQuestions;

    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colBg } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colIdx === 0 || colIdx === 1 ? 'center' : colIdx === 3 ? 'center' : 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: theme.borderColor } },
      bottom: { style: 'medium', color: { argb: theme.bannerPrimary } },
      left: { style: 'thin', color: { argb: theme.borderColor } },
      right: { style: 'thin', color: { argb: theme.borderColor } },
    };
  });

  // 11. DATA ROWS (Row 12+)
  submissions.forEach((sub, rowIdx) => {
    const currentRIdx = 12 + rowIdx;
    const dataRow = worksheet.getRow(currentRIdx);
    dataRow.height = 22;

    const answers = sub.answers || {};
    const roleVal = String(
      answers.target_role ||
      answers.role ||
      (Array.isArray(answers.roles) ? answers.roles.join(', ') : '') ||
      'Général'
    );

    const dateFormatted = new Date(sub.created_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const statusLabel =
      sub.email_status === 'sent'
        ? 'Délivré'
        : sub.email_status === 'failed'
        ? 'Échoué'
        : 'En attente';

    const rowValues: (string | number)[] = [
      rowIdx + 1,
      dateFormatted,
      sub.submitter_email || 'Non renseigné',
      statusLabel,
      roleVal,
      ...fields.map((f) => {
        const val = answers[f.key] ?? answers[f.label] ?? answers[f.id];
        if (val === undefined || val === null) return '';
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
        return String(val);
      }),
    ];

    const isEven = rowIdx % 2 === 0;
    const rowBg = isEven ? theme.zebraEven : theme.zebraOdd;

    rowValues.forEach((val, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = val;
      cell.font = {
        name: 'Calibri',
        size: 9.5,
        color: colIdx === 2 && sub.submitter_email ? { argb: 'FF2563EB' } : { argb: 'FF18181B' },
        bold: colIdx === 0,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIdx === 0 || colIdx === 1 ? 'center' : colIdx === 3 ? 'center' : 'left',
      };
      cell.border = standardBorder;

      // Status pill coloring
      if (colIdx === 3) {
        if (sub.email_status === 'sent') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        } else if (sub.email_status === 'failed') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFDC2626' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      }
    });
  });

  // 12. SUMMARY BOTTOM ROW
  const finalRowIdx = 12 + submissions.length;
  const summaryRow = worksheet.getRow(finalRowIdx);
  summaryRow.height = 24;

  worksheet.mergeCells(finalRowIdx, 1, finalRowIdx, totalCols);
  const summaryCell = worksheet.getCell(finalRowIdx, 1);
  summaryCell.value = `TOTAL ENREGISTRÉ : ${totalSubmissions} CANDIDATURE(S) TRAITÉE(S)   •   ACCUSÉS ENVOYÉS : ${sentEmails} (${deliveryRate}%)   •   CLUB MÉDICAL NEW ERA`;
  summaryCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bannerPrimary } };
  summaryCell.border = {
    top: { style: 'medium', color: { argb: theme.bannerAccent } },
    bottom: { style: 'double', color: { argb: theme.bannerPrimary } },
  };

  // 13. DYNAMIC COLUMN WIDTHS CALCULATION
  allHeaders.forEach((title, colIdx) => {
    let maxLen = title.length;
    submissions.forEach((sub) => {
      const answers = sub.answers || {};
      let valStr = '';
      if (colIdx === 0) valStr = '100';
      else if (colIdx === 1) valStr = '02/11/2026 à 12:00';
      else if (colIdx === 2) valStr = sub.submitter_email || '';
      else if (colIdx === 3) valStr = sub.email_status || '';
      else if (colIdx === 4) valStr = String(answers.target_role || 'Général');
      else {
        const f = fields[colIdx - 5];
        if (f) {
          const val = answers[f.key] ?? answers[f.label] ?? answers[f.id];
          valStr = Array.isArray(val) ? val.join(', ') : String(val || '');
        }
      }
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });

    const colWidth = Math.min(50, Math.max(13, maxLen + 3));
    worksheet.getColumn(colIdx + 1).width = colWidth;
  });

  // Make index column compact
  worksheet.getColumn(1).width = 7;

  // 14. GENERATE BUFFER & RETURN
  const buffer = await workbook.xlsx.writeBuffer();
  const fileDate = new Date().toISOString().split('T')[0];
  const filename = `Rapport-Candidatures-${slug}-${fileDate}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
