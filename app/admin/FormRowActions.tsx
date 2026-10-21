'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { deleteFormAction } from '@/app/actions/formManagerActions';
import { useRouter } from 'next/navigation';
import { showAdminToast } from './AdminToast';

interface FormRowActionsProps {
  slug: string;
  title: string;
  submissionsCount: number;
}

export function FormRowActions({ slug, title, submissionsCount }: FormRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!showConfirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal, isPending]);

  const confirmDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteFormAction(slug);
      if (res.success) {
        setShowConfirmModal(false);
        showAdminToast({
          type: 'success',
          title: 'Formulaire supprimé',
          message: `Le formulaire "${title}" a été supprimé définitivement. Toutes les candidatures associées ont été effacées.`,
        });
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Erreur lors de la suppression.');
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/admin/forms/${slug}/edit`}
          className="inline-flex items-center px-3 py-1.5 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#18181B] rounded-lg transition shadow-2xs"
        >
          Modifier
        </Link>

        <Link
          href={`/admin/${slug}`}
          className="inline-flex items-center px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-white rounded-lg transition shadow-2xs"
        >
          Consulter ({submissionsCount})
        </Link>

        <Link
          href={`/f/${slug}`}
          target="_blank"
          className="inline-flex items-center px-3 py-1.5 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#52525B] rounded-lg transition shadow-2xs"
          title="Ouvrir le formulaire public dans un nouvel onglet"
        >
          Ouvrir ↗
        </Link>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setErrorMessage(null);
            setShowConfirmModal(true);
          }}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition disabled:opacity-50"
          title="Supprimer ce formulaire"
        >
          Supprimer
        </button>
      </div>

      {/* Modern High-End Delete Confirmation Modal (Replaces browser default confirm) */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isPending) {
              setShowConfirmModal(false);
              setErrorMessage(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon Badge */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 shadow-xs">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 id="delete-dialog-title" className="text-base font-bold text-[#18181B] leading-tight">
                  Supprimer définitivement ce formulaire ?
                </h3>
                <p className="text-xs text-[#71717A]">
                  Cette action est irréversible et effacera toutes les données collectées.
                </p>
              </div>
            </div>

            {/* Exact Warning Prompt Box */}
            <div className="p-4 bg-[#FEF2F2]/60 border border-[#FEE2E2] rounded-xl text-xs sm:text-sm text-[#18181B] leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le formulaire{' '}
              <strong className="text-[#18181B] font-bold">&quot;{title}&quot;</strong> ?{' '}
              <span className="text-[#DC2626] font-semibold block mt-1.5">
                Toutes les candidatures associées seront effacées.
              </span>
              {submissionsCount > 0 && (
                <span className="text-xs text-[#71717A] mt-1 block">
                  (Actuellement {submissionsCount} candidature{submissionsCount > 1 ? 's' : ''} enregistrée{submissionsCount > 1 ? 's' : ''})
                </span>
              )}
            </div>

            {/* Error Message if deletion fails */}
            {errorMessage && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg text-xs text-[#DC2626] font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6DFD5]">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setShowConfirmModal(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-white border border-[#D4D4D8] hover:bg-[#FAF8F5] rounded-lg transition"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Suppression en cours...</span>
                  </>
                ) : (
                  <span>Confirmer la suppression</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
