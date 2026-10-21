import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/lib/supabase/server';
import { FormRenderer } from './FormRenderer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { form } = await getFormBySlug(slug);

  if (!form) {
    return {
      title: 'Formulaire introuvable — Club Médical New Era',
    };
  }

  return {
    title: `${form.title} — Club Médical New Era`,
    description: form.description || 'Formulaire officiel du Club Médical New Era.',
  };
}

export default async function FormPage({ params }: PageProps) {
  const { slug } = await params;
  const { form, fields, state } = await getFormBySlug(slug);

  if (!form && state.code === 'closed') {
    notFound();
  }

  // Unavailable states: closed, not yet open, expired, capacity reached, or draft
  if (!state.isAvailable && form) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-10 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53888]" />
            <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
              Club Médical New Era
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] mb-2 tracking-tight">
            {form.title}
          </h1>

          <div className="my-6 p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
            <p className="text-sm font-semibold text-[#18181B] mb-1">{state.message}</p>
            {state.detail && (
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {state.detail}
              </p>
            )}
          </div>

          <p className="text-xs text-[#71717A] leading-relaxed">
            Pour toute question ou demande particulière, vous pouvez contacter le bureau du club à{' '}
            <a
              href="mailto:event@new-era-medical-club-univ-ouargla.dz"
              className="text-[#3B33FF] underline underline-offset-2 font-medium"
            >
              event@new-era-medical-club-univ-ouargla.dz
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  if (!form) {
    notFound();
  }

  return (
    <main className="min-h-screen py-4 sm:py-8">
      <FormRenderer form={form} fields={fields} />
    </main>
  );
}
