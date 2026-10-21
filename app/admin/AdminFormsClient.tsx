'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminFormSummary } from '@/lib/supabase/admin';
import { FormRowActions } from './FormRowActions';

interface AdminFormsClientProps {
  initialForms: AdminFormSummary[];
}

export function AdminFormsClient({ initialForms }: AdminFormsClientProps) {
  const [deletedSlugs, setDeletedSlugs] = useState<string[]>([]);

  const handleDeleted = (deletedSlug: string) => {
    const target = deletedSlug.trim().toLowerCase();
    setDeletedSlugs((prev) => (prev.includes(target) ? prev : [...prev, target]));
  };

  const forms = initialForms.filter((item) => {
    const s = item.form.slug?.trim().toLowerCase() || '';
    const id = item.form.id?.trim().toLowerCase() || '';
    return !deletedSlugs.includes(s) && !deletedSlugs.includes(id);
  });

  return (
    <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-[#E6DFD5] bg-[#FAF8F5] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#18181B] transition-all duration-200">
            Formulaires disponibles ({forms.length})
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Cliquez sur &quot;Modifier&quot; pour éditer les questions ou &quot;Consulter&quot; pour voir les réponses.
          </p>
        </div>
      </div>

      {/* Forms List or Empty State */}
      <div className="divide-y divide-[#E6DFD5]">
        {forms.length === 0 ? (
          <div className="p-12 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E6DFD5] flex items-center justify-center mx-auto mb-3 text-xl shadow-2xs">
              📋
            </div>
            <h3 className="text-base font-semibold text-[#18181B]">Aucun formulaire actif</h3>
            <p className="text-xs text-[#52525B] max-w-sm mx-auto mt-1 mb-4">
              Vous n’avez aucun formulaire publié pour le moment. Vous pouvez en créer un nouveau en quelques secondes.
            </p>
            <Link
              href="/admin/forms/new"
              className="brand-gradient-btn px-4 py-2 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 shadow-xs"
            >
              + Créer un premier formulaire
            </Link>
          </div>
        ) : (
          forms.map(({ form, fieldsCount, submissionsCount }) => {
            const statusBadge = {
              open: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
              draft: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
              closed: 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]',
            }[form.status] || 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]';

            const hasCustomEmail = Boolean(
              form.custom_email_html && form.custom_email_html.trim().length > 0
            );

            return (
              <div
                key={form.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F5]/50 transition-all duration-200"
              >
                <div className="space-y-2 flex-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-[#18181B]">
                      {form.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadge}`}
                    >
                      {form.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6DFD5]">
                      Format: {form.layout === 'stepped' ? 'Étapes (1/page)' : 'Page unique'}
                    </span>

                    {/* Studio Emails IA Link Status Badge */}
                    {hasCustomEmail ? (
                      <Link
                        href={`/admin/emails?slug=${form.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] hover:bg-[#E0E7FF] transition shadow-2xs"
                        title="Courriel IA personnalisé actif — Cliquez pour l'ouvrir dans le Studio IA"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse"></span>
                        <span>✨ Modèle Email IA Lié</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/emails?slug=${form.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7] hover:bg-[#E4E4E7] hover:text-[#18181B] transition"
                        title="Aucun modèle IA lié — Cliquez pour créer un modèle dans le Studio IA"
                      >
                        <span>✉️ Modèle standard</span>
                        <span className="text-[10px] text-[#4F46E5] font-semibold ml-0.5">+ Lier IA</span>
                      </Link>
                    )}
                  </div>

                  {form.description && (
                    <p className="text-xs sm:text-sm text-[#52525B] line-clamp-2">
                      {form.description}
                    </p>
                  )}

                  <div className="text-xs text-[#71717A] flex items-center gap-4 pt-1 flex-wrap">
                    <span>
                      URL: <code className="font-mono text-[#18181B]">/f/{form.slug}</code>
                    </span>
                    <span>{fieldsCount} question{fieldsCount > 1 ? 's' : ''}</span>
                    <span>
                      Reçu candidat: {form.send_receipt ? 'Oui' : 'Non'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span>Courriel :</span>
                      {hasCustomEmail ? (
                        <span className="font-semibold text-[#4338CA] bg-[#EEF2FF] px-1.5 py-0.5 rounded border border-[#C7D2FE]">
                          Studio IA ({form.custom_email_subject || 'Modèle actif'})
                        </span>
                      ) : (
                        <span className="text-[#71717A]">Accusé standard</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-2 md:pt-0">
                  <FormRowActions
                    slug={form.slug}
                    title={form.title}
                    submissionsCount={submissionsCount}
                    hasAiEmail={hasCustomEmail}
                    onDeleted={handleDeleted}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
