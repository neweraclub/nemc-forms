'use client';

import React, { useState } from 'react';
import { FormFieldRecord, FormRecord, SubmissionRecord } from '@/types/form';

interface SubmissionsExplorerProps {
  form: FormRecord;
  fields: FormFieldRecord[];
  submissions: SubmissionRecord[];
}

export function SubmissionsExplorer({ form, fields, submissions }: SubmissionsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);

  // Filter submissions by search query
  const filtered = submissions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (sub.submitter_email && sub.submitter_email.toLowerCase().includes(q)) return true;
    if (sub.id.toLowerCase().includes(q)) return true;

    // Search inside answers
    for (const val of Object.values(sub.answers)) {
      if (val !== null && val !== undefined) {
        const str = Array.isArray(val) ? val.join(' ') : String(val);
        if (str.toLowerCase().includes(q)) return true;
      }
    }
    return false;
  });

  const sentCount = submissions.filter((s) => s.email_status === 'sent').length;
  const failedCount = submissions.filter((s) => s.email_status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Total réponses
          </p>
          <p className="text-2xl font-bold text-[#18181B] mt-1">{submissions.length}</p>
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Emails envoyés
          </p>
          <p className="text-2xl font-bold text-[#059669] mt-1">{sentCount}</p>
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
            Emails en échec
          </p>
          <p className={`text-2xl font-bold mt-1 ${failedCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]'}`}>
            {failedCount}
          </p>
        </div>
      </div>

      {/* Action Bar: Search & CSV Export */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé, nom, email, valeur..."
            className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#18181B] bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg focus:border-[#3B33FF] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/admin/${form.slug}/export`}
            download
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] rounded-lg text-xs sm:text-sm font-semibold text-[#18181B] transition"
          >
            Exporter en CSV ({submissions.length})
          </a>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#71717A]">
            <p className="text-sm">
              {searchQuery ? 'Aucune réponse ne correspond à votre recherche.' : 'Aucune réponse enregistrée pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#52525B]">
                  <th className="py-3 px-4 whitespace-nowrap">Date</th>
                  {fields.map((f) => (
                    <th key={f.id || f.key} className="py-3 px-4 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 whitespace-nowrap">Statut Email</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5]">
                {filtered.map((sub) => {
                  const emailBadge = {
                    sent: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
                    failed: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
                    pending: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
                    not_requested: 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]',
                  }[sub.email_status];

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-[#FAF8F5]/60 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-xs text-[#71717A] whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      {fields.map((f) => {
                        const raw = sub.answers[f.key];
                        let display = '—';
                        if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
                          if (Array.isArray(raw)) {
                            display = raw.join(', ');
                          } else if (typeof raw === 'boolean') {
                            display = raw ? 'Oui' : 'Non';
                          } else {
                            display = String(raw);
                          }
                        }
                        return (
                          <td
                            key={f.id || f.key}
                            className="py-3.5 px-4 text-xs text-[#18181B] max-w-xs truncate whitespace-nowrap font-normal"
                            title={display}
                          >
                            {display}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full border font-medium ${emailBadge}`}
                        >
                          {sub.email_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(sub);
                          }}
                          className="text-xs font-semibold text-[#3B33FF] hover:underline"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Submission Detail Drawer / Modal */}
      {selectedSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white border border-[#E6DFD5] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E6DFD5] pb-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wide">
                  Détail de la candidature
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-[#18181B]">
                  {(selectedSubmission.answers['full_name'] as string) || 'Candidat'}
                </h3>
                <p className="text-xs text-[#71717A] mt-1">
                  ID: <code className="font-mono">{selectedSubmission.id}</code> &bull; Reçu le{' '}
                  {new Date(selectedSubmission.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-lg border border-[#E6DFD5] flex items-center justify-center text-[#52525B] hover:bg-[#FAF8F5]"
              >
                ✕
              </button>
            </div>

            {/* Answer Rows */}
            <div className="space-y-4">
              {fields.map((f) => {
                const answerVal = selectedSubmission.answers[f.key];
                let displayVal = '—';
                if (answerVal !== undefined && answerVal !== null && answerVal !== '') {
                  if (Array.isArray(answerVal)) {
                    displayVal = answerVal.join(', ');
                  } else if (typeof answerVal === 'boolean') {
                    displayVal = answerVal ? 'Oui (Accepté)' : 'Non';
                  } else {
                    displayVal = String(answerVal);
                  }
                }

                return (
                  <div key={f.id} className="border-b border-[#E6DFD5]/60 pb-3">
                    <p className="text-xs font-semibold text-[#52525B] mb-1">{f.label}</p>
                    <p className="text-sm text-[#18181B] whitespace-pre-wrap leading-relaxed">
                      {displayVal}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Technical Metadata */}
            <div className="mt-6 pt-4 border-t border-[#E6DFD5] bg-[#FAF8F5] p-4 rounded-lg space-y-1 text-xs text-[#71717A]">
              <p>
                <strong>Statut email:</strong> {selectedSubmission.email_status}
              </p>
              <p>
                <strong>IP Hash (SHA-256):</strong>{' '}
                <code className="font-mono text-[11px]">{selectedSubmission.ip_hash || 'N/A'}</code>
              </p>
              <p>
                <strong>User Agent:</strong> {selectedSubmission.user_agent || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
