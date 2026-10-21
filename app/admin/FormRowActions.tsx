'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { deleteFormAction } from '@/app/actions/formManagerActions';
import { useRouter } from 'next/navigation';

interface FormRowActionsProps {
  slug: string;
  title: string;
  submissionsCount: number;
}

export function FormRowActions({ slug, title, submissionsCount }: FormRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le formulaire "${title}" ? Toutes les candidatures associées seront effacées.`)) {
      startTransition(async () => {
        const res = await deleteFormAction(slug);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || 'Erreur lors de la suppression.');
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link
        href={`/admin/forms/${slug}/edit`}
        className="inline-flex items-center px-3 py-1.5 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#18181B] rounded-lg transition"
      >
        Modifier
      </Link>

      <Link
        href={`/admin/${slug}`}
        className="inline-flex items-center px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-white rounded-lg transition"
      >
        Consulter ({submissionsCount})
      </Link>

      <Link
        href={`/f/${slug}`}
        target="_blank"
        className="inline-flex items-center px-3 py-1.5 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#52525B] rounded-lg transition"
        title="Ouvrir le formulaire public dans un nouvel onglet"
      >
        Ouvrir ↗
      </Link>

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="inline-flex items-center px-2 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition disabled:opacity-50"
        title="Supprimer ce formulaire"
      >
        {isPending ? '...' : 'Supprimer'}
      </button>
    </div>
  );
}
