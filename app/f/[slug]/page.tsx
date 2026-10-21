import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getFormBySlug } from '@/lib/supabase/server';
import { FormRenderer } from './FormRenderer';
import { ClubSocialLinks } from '@/app/components/ClubSocialLinks';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { form } = await getFormBySlug(slug);

  if (!form) {
    return {
      title: 'Formulaire introuvable — New Era Medical Club',
    };
  }

  return {
    title: `${form.title} — New Era Medical Club`,
    description: form.description || 'Formulaire officiel du New Era Medical Club.',
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
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#FAF6EE]">
        <div className="w-full max-w-lg bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-10 shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="New Era Medical Club Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#52525B] block">
                New Era Medical Club
              </span>
              <span className="text-[11px] text-[#71717A] block">
                Faculté de Médecine &bull; Univ. Ouargla
              </span>
            </div>
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

          <p className="text-xs text-[#71717A] leading-relaxed mb-6">
            Pour toute question ou demande particulière, vous pouvez contacter le bureau du club à{' '}
            <a
              href="mailto:event@new-era-medical-club-univ-ouargla.dz"
              className="text-[#3B33FF] underline underline-offset-2 font-medium"
            >
              event@new-era-medical-club-univ-ouargla.dz
            </a>
            .
          </p>

          <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-[#71717A]">Suivez nos actualités :</span>
            <ClubSocialLinks />
          </div>
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
