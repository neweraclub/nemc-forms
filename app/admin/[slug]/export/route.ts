import { NextRequest, NextResponse } from 'next/server';
import { getAdminSubmissions } from '@/lib/supabase/admin';

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

  // Headers row
  const headers = [
    'ID',
    'Date de soumission',
    'Email',
    'Statut Email',
    'IP Hash',
    ...fields.map((f) => f.label),
  ];

  const rows: string[] = [];
  rows.push(headers.map(csvEscape).join(','));

  for (const sub of submissions) {
    const row = [
      sub.id,
      new Date(sub.created_at).toLocaleString('fr-FR'),
      sub.submitter_email || '',
      sub.email_status,
      sub.ip_hash || '',
      ...fields.map((f) => {
        const val = sub.answers[f.key];
        return val !== undefined && val !== null ? val : '';
      }),
    ];
    rows.push(row.map(csvEscape).join(','));
  }

  // UTF-8 BOM for Excel / Numbers character encoding
  const csvContent = '\uFEFF' + rows.join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soumissions-${slug}-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
