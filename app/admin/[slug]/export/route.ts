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

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { slug } = await params;
  const { form, fields, submissions } = await getAdminSubmissions(slug);

  if (!form) {
    return new NextResponse('Form not found', { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  // If CSV explicitly requested, return CSV
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
  // GENERATE MODERN EXECUTIVE EXCEL (.xlsx) REPORT
  // Matching the New Era ECOS / Master Gradebook visual reference
  // ---------------------------------------------------------------------------
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'New Era Medical Club (NEMC)';
  workbook.lastModifiedBy = 'Administration NEMC';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sanitizedTabName = (form.title || 'Candidatures')
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 30);

  const worksheet = workbook.addWorksheet(sanitizedTabName, {
    properties: { tabColor: { argb: 'FF0F172A' } },
    views: [{ showGridLines: true }],
  });

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const sentEmails = submissions.filter((s) => s.email_status === 'sent').length;
  const deliveryRate = totalSubmissions > 0 ? Math.round((sentEmails / totalSubmissions) * 100) : 100;

  // Base fixed columns + dynamic questions
  const fixedHeaders = [
    '#',
    'Date de soumission',
    'Email du Candidat',
    'Statut Accusé',
    'Profil / Rôle',
  ];
  const questionHeaders = fields.map((f) => f.label || 'Question');
  const allHeaders = [...fixedHeaders, ...questionHeaders];
  const totalCols = Math.max(8, allHeaders.length);

  // Helper styles
  const navyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };

  const tealFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0D9488' },
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // 1. BANNER HEADER (Rows 1 & 2)
  worksheet.mergeCells(1, 1, 2, totalCols);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `NEW ERA MEDICAL CLUB • ${form.title.toUpperCase()} • RAPPORT DES CANDIDATURES`;
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = navyFill;
  worksheet.getRow(1).height = 18;
  worksheet.getRow(2).height = 18;

  // 2. ACCENT STRIPE (Row 3)
  worksheet.mergeCells(3, 1, 3, totalCols);
  const accentCell = worksheet.getCell(3, 1);
  accentCell.fill = tealFill;
  worksheet.getRow(3).height = 4;

  // 3. SPACER (Row 4)
  worksheet.getRow(4).height = 8;

  // 4. METADATA SECTION (Rows 5 to 7)
  const nowStr = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const metaRows = [
    {
      k1: "Export Timestamp (HH:MM:SS)",
      v1: nowStr,
      k2: "Institution Responsable",
      v2: "Club Médical New Era",
    },
    {
      k1: "Faculté / Établissement",
      v1: "Faculté de Médecine de Ouargla",
      k2: "Statut du Formulaire",
      v2: form.status === 'open' ? 'Ouvert (Actif)' : form.status === 'closed' ? 'Clôturé' : 'Brouillon',
    },
    {
      k1: "Portée du Rapport",
      v1: "Registre exhaustif des réponses reçues",
      k2: "Candidatures Enregistrées",
      v2: `${totalSubmissions} Candidature${totalSubmissions > 1 ? 's' : ''}`,
    },
  ];

  metaRows.forEach((m, idx) => {
    const rIdx = 5 + idx;
    worksheet.getRow(rIdx).height = 19;

    // Col 2 Label
    const k1Cell = worksheet.getCell(rIdx, 2);
    k1Cell.value = m.k1;
    k1Cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF475569' } };
    k1Cell.alignment = { vertical: 'middle', horizontal: 'left' };

    // Col 3-4 Value (Merged)
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

    // Col 7-8 Value (Merged)
    worksheet.mergeCells(rIdx, 7, rIdx, 8);
    const v2Cell = worksheet.getCell(rIdx, 7);
    v2Cell.value = m.v2;
    v2Cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    v2Cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // 5. SPACER (Row 8)
  worksheet.getRow(8).height = 8;

  // 6. KPI SUMMARY STATS CARDS (Row 9)
  worksheet.getRow(9).height = 28;

  // Card 1: Total Candidates (Cols 1-2)
  worksheet.mergeCells(9, 1, 9, 2);
  const card1 = worksheet.getCell(9, 1);
  card1.value = `Total : ${totalSubmissions} Candidats`;
  card1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
  card1.alignment = { vertical: 'middle', horizontal: 'center' };
  card1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  card1.border = {
    top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
  };

  // Card 2: Sent Emails (Cols 3-4)
  worksheet.mergeCells(9, 3, 9, 4);
  const card2 = worksheet.getCell(9, 3);
  card2.value = `Accusés Envoyés : ${sentEmails} / ${totalSubmissions}`;
  card2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
  card2.alignment = { vertical: 'middle', horizontal: 'center' };
  card2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
  card2.border = {
    top: { style: 'thin', color: { argb: 'FFA7F3D0' } },
    left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
    bottom: { style: 'thin', color: { argb: 'FFA7F3D0' } },
    right: { style: 'thin', color: { argb: 'FFA7F3D0' } },
  };

  // Card 3: Delivery Rate (Cols 5-6)
  worksheet.mergeCells(9, 5, 9, 6);
  const card3 = worksheet.getCell(9, 5);
  card3.value = `Taux de Délivrance : ${deliveryRate}%`;
  card3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF6B21A8' } };
  card3.alignment = { vertical: 'middle', horizontal: 'center' };
  card3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
  card3.border = {
    top: { style: 'thin', color: { argb: 'FFD8B4FE' } },
    left: { style: 'thin', color: { argb: 'FFD8B4FE' } },
    bottom: { style: 'thin', color: { argb: 'FFD8B4FE' } },
    right: { style: 'thin', color: { argb: 'FFD8B4FE' } },
  };

  // Card 4: Academic Year / Scope (Cols 7-8)
  worksheet.mergeCells(9, 7, 9, 8);
  const card4 = worksheet.getCell(9, 7);
  card4.value = `Exercice Académique : 2026-2027`;
  card4.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
  card4.alignment = { vertical: 'middle', horizontal: 'center' };
  card4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  card4.border = {
    top: { style: 'thin', color: { argb: 'FFFDE68A' } },
    left: { style: 'thin', color: { argb: 'FFFDE68A' } },
    bottom: { style: 'thin', color: { argb: 'FFFDE68A' } },
    right: { style: 'thin', color: { argb: 'FFFDE68A' } },
  };

  // 7. SPACER (Row 10)
  worksheet.getRow(10).height = 10;

  // 8. DATA TABLE HEADER (Row 11)
  const headerRow = worksheet.getRow(11);
  headerRow.height = 26;

  allHeaders.forEach((title, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = title;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colIdx === 0 ? 'center' : colIdx === 1 ? 'center' : 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // 9. DATA ROWS (Row 12+)
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

    // Translate email status
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
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

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
      cell.border = thinBorder;

      // Status pill coloring
      if (colIdx === 3) {
        if (sub.email_status === 'sent') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF065F46' } };
        } else if (sub.email_status === 'failed') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFDC2626' } };
        }
      }
    });
  });

  // 10. AUTO-FIT COLUMN WIDTHS
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

    const colWidth = Math.min(55, Math.max(12, maxLen + 4));
    worksheet.getColumn(colIdx + 1).width = colWidth;
  });

  // Make sure Col 1 (#) is compact
  worksheet.getColumn(1).width = 7;

  // 11. GENERATE BUFFER & RETURN
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
