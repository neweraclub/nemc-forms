import Link from 'next/link';
import { getAdminForms } from '@/lib/supabase/admin';
import { AdminFormsClient } from './AdminFormsClient';

export const metadata = {
  title: 'Formulaires — Administration New Era Medical Club',
};

export const dynamic = 'force-dynamic';

export default async function AdminFormsPage() {
  const forms = await getAdminForms();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            Formulaires
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5">
            Créez, modifiez et gérez tous vos formulaires en ligne sans aucune ligne de code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/forms/new"
            className="brand-gradient-btn min-h-[44px] px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-xs inline-flex items-center justify-center"
          >
            + Créer un formulaire
          </Link>
        </div>
      </div>

      {/* Forms List Card with Optimistic Real-Time Updates */}
      <AdminFormsClient initialForms={forms} />
    </div>
  );
}

