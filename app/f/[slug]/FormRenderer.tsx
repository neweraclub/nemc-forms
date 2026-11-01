'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Image from 'next/image';
import { FormFieldRecord, FormRecord } from '@/types/form';
import { isFieldVisible } from '@/lib/schema-builder';
import { submitFormAction } from '@/app/actions/submitForm';
import { ClubSocialLinks } from '@/app/components/ClubSocialLinks';
import { Target, AlertTriangle, HelpCircle } from 'lucide-react';

interface FormRendererProps {
  form: FormRecord;
  fields: FormFieldRecord[];
}

const CHUNK_SIZE = 3; // Mobile: 3 questions per step

export function FormRenderer({ form, fields }: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mobileStep, setMobileStep] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);

  // Honeypot field
  const [honeypot, setHoneypot] = useState<string>('');

  // Stable idempotency key for this session
  const idempotencyKeyRef = useRef<string>('');
  const storageKey = `newera_form_draft_${form.slug}`;

  // Initialize idempotency key and restore localStorage draft
  useEffect(() => {
    idempotencyKeyRef.current =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          queueMicrotask(() => {
            setAnswers(parsed);
            setHasRestoredDraft(true);
            setSavedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
          });
        }
      }
    } catch {
      // ignore localStorage errors (e.g. private browsing)
    }
  }, [storageKey]);

  // Autosave to localStorage on changes
  const saveToLocalStorage = (updated: Record<string, unknown>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      // storage quota or disabled
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch { }
    setAnswers({});
    setErrors({});
    setMobileStep(0);
    setHasRestoredDraft(false);
    setSavedTime(null);
  };

  // Target roles configuration
  const hasRoles = Boolean(form.target_roles && form.target_roles.length > 0);
  const selectedRoleId = (answers['_target_role'] as string) || '';
  const selectedRole = form.target_roles?.find((r) => r.id === selectedRoleId);

  // Determine which fields are visible given current answers
  const visibleFields = fields.filter((f) => isFieldVisible(f, answers));

  // Role Selection Handler
  const handleRoleSelect = (roleId: string) => {
    const chosen = form.target_roles?.find((r) => r.id === roleId);
    const updated = {
      ...answers,
      _target_role: roleId,
      _target_role_label: chosen ? chosen.name : roleId,
    };
    setAnswers(updated);
    saveToLocalStorage(updated);

    if (errors['_target_role']) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next['_target_role'];
        return next;
      });
    }
  };

  // Mobile 3-by-3 Chunking
  const totalMobileSteps = Math.max(1, Math.ceil(visibleFields.length / CHUNK_SIZE));
  const safeMobileStep = Math.min(mobileStep, totalMobileSteps - 1);
  const currentMobileFields = visibleFields.slice(
    safeMobileStep * CHUNK_SIZE,
    (safeMobileStep + 1) * CHUNK_SIZE
  );
  const isLastMobileStep = safeMobileStep === totalMobileSteps - 1;

  // Track progress
  const answeredCount = visibleFields.filter((f) => {
    const val = answers[f.key];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const totalQuestions = visibleFields.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Field change handler
  const handleAnswerChange = (key: string, value: unknown) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    saveToLocalStorage(updated);

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Validate a single field on client
  const validateField = (field: FormFieldRecord): string | null => {
    const val = answers[field.key];
    const isVisible = isFieldVisible(field, answers);
    if (!isVisible) return null;

    if (field.required) {
      if (val === undefined || val === null || val === '') {
        return `${field.label} est obligatoire.`;
      }
      if (field.type === 'consent' && val !== true) {
        return 'Vous devez accepter cette condition pour continuer.';
      }
      if (field.type === 'checkboxes' && Array.isArray(val) && val.length === 0) {
        return `Veuillez sélectionner au moins une option pour ${field.label}.`;
      }
    }

    if (val !== undefined && val !== null && val !== '') {
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          return 'Veuillez saisir une adresse email valide.';
        }
      }
      if (field.type === 'phone') {
        const phoneRegex = /^[\d\s+\-().]{6,20}$/;
        if (!phoneRegex.test(String(val).trim())) {
          return 'Veuillez saisir un numéro de téléphone valide.';
        }
      }
      if (field.validation?.minLength && String(val).length < field.validation.minLength) {
        return `${field.label} doit comporter au moins ${field.validation.minLength} caractères.`;
      }
      if (field.validation?.maxLength && String(val).length > field.validation.maxLength) {
        return `${field.label} ne doit pas dépasser ${field.validation.maxLength} caractères.`;
      }
    }

    return null;
  };

  // Handle Mobile Next Step (validates current 3 questions)
  const handleNextMobileStep = (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors: Record<string, string> = {};

    // Validate role selection on first step
    if (safeMobileStep === 0 && hasRoles && !answers['_target_role']) {
      stepErrors['_target_role'] = 'Veuillez sélectionner votre profil / catégorie pour continuer.';
    }

    for (const field of currentMobileFields) {
      const err = validateField(field);
      if (err) {
        stepErrors[field.key] = err;
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      // Scroll to first error
      const firstErrKey = Object.keys(stepErrors)[0];
      const el = document.getElementById(`field_${firstErrKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!isLastMobileStep) {
      setMobileStep((prev) => Math.min(prev + 1, totalMobileSteps - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevMobileStep = () => {
    if (mobileStep > 0) {
      setMobileStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validate all visible fields
    const clientErrors: Record<string, string> = {};

    // Validate role selection
    if (hasRoles && !answers['_target_role']) {
      clientErrors['_target_role'] = 'Veuillez sélectionner votre profil / catégorie pour continuer.';
    }

    for (const field of visibleFields) {
      const err = validateField(field);
      if (err) {
        clientErrors[field.key] = err;
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      // If role error, scroll to it
      if (clientErrors['_target_role']) {
        const el = document.getElementById('field__target_role');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // For mobile: jump to the chunk containing the first error
        const firstErrorIndex = visibleFields.findIndex((f) => clientErrors[f.key]);
        if (firstErrorIndex !== -1) {
          setMobileStep(Math.floor(firstErrorIndex / CHUNK_SIZE));
        }
      }
      setGeneralError('Veuillez corriger les champs requis indiqués ci-dessous.');
      return;
    }

    const payload = {
      ...answers,
      _hp: honeypot,
    };

    startTransition(async () => {
      const res = await submitFormAction(form.slug, payload, idempotencyKeyRef.current);
      if (res.success) {
        setIsSubmitted(true);
        setSubmissionId(res.submissionId || '');
        setSubmissionMessage(
          res.message || form.confirmation_message || 'Votre candidature a bien été enregistrée.'
        );
        try {
          localStorage.removeItem(storageKey);
        } catch { }
      } else {
        if (res.errors) {
          setErrors(res.errors);
          const firstErrIndex = visibleFields.findIndex((f) => res.errors?.[f.key]);
          if (firstErrIndex !== -1) {
            setMobileStep(Math.floor(firstErrIndex / CHUNK_SIZE));
          }
        }
        setGeneralError(res.generalError || 'Une erreur est survenue lors de l’envoi.');
      }
    });
  };

  // --------------------------------------------------------------------------
  // SUCCESS / CONFIRMATION STATE
  // --------------------------------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 md:py-16">
        <div className="w-full h-1.5 bg-[#E6DFD5] rounded-full overflow-hidden mb-8">
          <div className="h-full w-full brand-gradient-bar" />
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-10 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#059669] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="New Era Medical Club Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          <p className="text-xs font-semibold text-[#52525B] tracking-wide uppercase mb-1">
            New Era Medical Club &bull; Faculté de Médecine Univ. Ouargla
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight mb-3">
            Formulaire envoyé avec succès
          </h1>

          {Boolean(answers['_target_role_label']) && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] text-[#18181B] mb-3">
              <span className="text-[#71717A]">Profil enregistré :</span>
              <span className="font-bold text-[#3B33FF]">{String(answers['_target_role_label'])}</span>
            </div>
          )}

          <p className="text-[#3F3F46] text-sm sm:text-base leading-relaxed mb-8">
            {submissionMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <a
              href={`/f/${form.slug}`}
              onClick={() => window.location.reload()}
              className="inline-flex justify-center items-center px-5 py-3 border border-[#E6DFD5] text-sm font-semibold text-[#18181B] bg-white rounded-lg hover:bg-[#FAF8F5] transition"
            >
              Soumettre une autre réponse
            </a>
          </div>

          <div className="pt-6 border-t border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#18181B]">Restez connectés avec le New Era Medical Club</p>
              <p className="text-[11px] text-[#71717A]">Suivez la suite du processus de recrutement sur nos réseaux</p>
            </div>
            <ClubSocialLinks />
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // INPUT COMPONENT RENDERER
  // --------------------------------------------------------------------------
  const renderField = (field: FormFieldRecord) => {
    const errorMsg = errors[field.key];
    const val = answers[field.key];
    const fieldId = `field_${field.key}`;
    const errorId = `err_${field.key}`;

    return (
      <div key={field.id} className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-semibold text-[#18181B]">
          {field.label}{' '}
          <span className={field.required ? 'text-[#E53888] font-normal text-xs' : 'text-[#71717A] font-normal text-xs'}>
            {field.required ? '(obligatoire)' : '(facultatif)'}
          </span>
        </label>

        {field.help_text && (
          <p className="text-xs text-[#52525B] leading-relaxed">
            {field.help_text}
          </p>
        )}

        {/* Short Text */}
        {field.type === 'short_text' && (
          <input
            id={fieldId}
            type="text"
            value={(val as string) || ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Email */}
        {field.type === 'email' && (
          <input
            id={fieldId}
            type="email"
            value={(val as string) || ''}
            placeholder={field.placeholder || 'nom@exemple.com'}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Phone */}
        {field.type === 'phone' && (
          <input
            id={fieldId}
            type="tel"
            value={(val as string) || ''}
            placeholder={field.placeholder || '0550 00 00 00'}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Long Text */}
        {field.type === 'long_text' && (
          <textarea
            id={fieldId}
            rows={3}
            value={(val as string) || ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Number */}
        {field.type === 'number' && (
          <input
            id={fieldId}
            type="number"
            value={val !== undefined ? String(val) : ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Date */}
        {field.type === 'date' && (
          <input
            id={fieldId}
            type="date"
            value={(val as string) || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          />
        )}

        {/* Select */}
        {field.type === 'select' && (
          <select
            id={fieldId}
            value={(val as string) || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base text-[#18181B] bg-white border rounded-lg transition focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
              }`}
          >
            <option value="">Sélectionnez une option</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Radio */}
        {field.type === 'radio' && (
          <div className="space-y-2 pt-1" role="radiogroup" aria-labelledby={fieldId}>
            {(field.options || []).map((opt) => {
              const isChecked = val === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg border cursor-pointer transition ${isChecked
                      ? 'border-[#3B33FF] bg-[#3B33FF]/5 text-[#18181B] font-medium'
                      : 'border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-[#3F3F46]'
                    }`}
                >
                  <input
                    type="radio"
                    name={field.key}
                    value={opt.value}
                    checked={isChecked}
                    onChange={() => handleAnswerChange(field.key, opt.value)}
                    className="w-4 h-4 text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF]"
                  />
                  <span className="ml-3 text-xs sm:text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Checkboxes */}
        {field.type === 'checkboxes' && (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt) => {
              const checkedList = Array.isArray(val) ? (val as string[]) : [];
              const isChecked = checkedList.includes(opt.value);

              const toggleOption = () => {
                if (isChecked) {
                  handleAnswerChange(
                    field.key,
                    checkedList.filter((item) => item !== opt.value)
                  );
                } else {
                  handleAnswerChange(field.key, [...checkedList, opt.value]);
                }
              };

              return (
                <label
                  key={opt.value}
                  className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg border cursor-pointer transition ${isChecked
                      ? 'border-[#3B33FF] bg-[#3B33FF]/5 text-[#18181B] font-medium'
                      : 'border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-[#3F3F46]'
                    }`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={isChecked}
                    onChange={toggleOption}
                    className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF]"
                  />
                  <span className="ml-3 text-xs sm:text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* File Upload */}
        {field.type === 'file' && (
          <div className="space-y-2">
            <input
              id={fieldId}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAnswerChange(field.key, `Fichier: ${file.name} (${Math.round(file.size / 1024)} Ko)`);
                }
              }}
              className="block w-full text-xs sm:text-sm text-[#52525B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#3B33FF]/10 file:text-[#3B33FF] hover:file:bg-[#3B33FF]/20 cursor-pointer"
            />
            {typeof val === 'string' && val.length > 0 && (
              <p className="text-xs text-[#059669] font-medium">{val}</p>
            )}
          </div>
        )}

        {/* Consent */}
        {field.type === 'consent' && (
          <label className="flex items-start min-h-[44px] p-3 rounded-lg border border-[#E6DFD5] bg-[#FAF8F5] cursor-pointer mt-1">
            <input
              id={fieldId}
              type="checkbox"
              checked={val === true}
              onChange={(e) => handleAnswerChange(field.key, e.target.checked)}
              className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF] mt-0.5"
            />
            <span className="ml-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
              {field.label}
            </span>
          </label>
        )}

        {/* Inline Error */}
        {errorMsg && (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#DC2626] pt-0.5">
            {errorMsg}
          </p>
        )}
      </div>
    );
  };

  // Check if a field is compact (fits in 1 column on PC) vs wide (spans 2 columns)
  const isCompactField = (field: FormFieldRecord) => {
    if (field.type === 'long_text' || field.type === 'checkboxes' || field.type === 'consent' || field.type === 'file') {
      return false;
    }
    if (field.type === 'radio' && (field.options?.length ?? 0) > 4) {
      return false;
    }
    return true;
  };

  // Target Role Selector Component
  const renderRoleSelector = (isMobile: boolean = false) => {
    if (!hasRoles || !form.target_roles || form.target_roles.length === 0) return null;
    const errorMsg = errors['_target_role'];

    return (
      <div
        id="field__target_role"
        className={`rounded-xl p-4 sm:p-5 transition-all ${
          errorMsg
            ? 'bg-[#FEF2F2] border-2 border-[#DC2626]'
            : 'bg-[#FAF8F5] border border-[#E6DFD5]'
        } ${isMobile ? 'mb-5' : 'mb-6 shadow-xs'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#3B33FF]/10 text-[#3B33FF] flex items-center justify-center font-bold text-sm">
              <Target className="w-4 h-4 text-[#3B33FF]" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#18181B] tracking-tight">
                Profil / Catégorie de participant <span className="text-[#E53888] font-normal text-xs">*</span>
              </h3>
              <p className="text-[11px] text-[#71717A]">
                Sélectionnez votre statut pour afficher les questions correspondantes
              </p>
            </div>
          </div>
          {selectedRole && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 hidden sm:inline-block"
              style={{
                backgroundColor: `${selectedRole.color || '#3B33FF'}15`,
                borderColor: `${selectedRole.color || '#3B33FF'}40`,
                color: selectedRole.color || '#3B33FF',
              }}
            >
              {selectedRole.name}
            </span>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-[#DC2626] font-semibold mt-1 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Dropdown for standard selection */}
        <div className="mt-3">
          <label htmlFor={`target_role_select_${isMobile ? 'm' : 'd'}`} className="sr-only">
            Sélectionnez votre profil
          </label>
          <select
            id={`target_role_select_${isMobile ? 'm' : 'd'}`}
            value={selectedRoleId}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm sm:text-base font-semibold rounded-lg border bg-white text-[#18181B] transition focus:ring-2 focus:ring-[#3B33FF]/20 focus:border-[#3B33FF] ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/40' : 'border-[#D4D4D8]'
            }`}
          >
            <option value="">-- Sélectionnez votre profil dans la liste --</option>
            {form.target_roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.description ? `(${r.description})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick visual selection tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {form.target_roles.map((r) => {
            const isSelected = selectedRoleId === r.id;
            const roleColor = r.color || '#3B33FF';
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-white shadow-sm ring-2'
                    : 'bg-white/80 hover:bg-white hover:border-[#A1A1AA] border-[#E6DFD5]'
                }`}
                style={{
                  borderColor: isSelected ? roleColor : undefined,
                  boxShadow: isSelected ? `0 0 0 1px ${roleColor}` : undefined,
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border"
                  style={{
                    backgroundColor: isSelected ? roleColor : `${roleColor}33`,
                    borderColor: roleColor,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-[#18181B] truncate">
                    {r.name}
                  </p>
                  {r.description && (
                    <p className="text-[11px] text-[#71717A] line-clamp-1">
                      {r.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <svg
                    className="w-4 h-4 shrink-0 text-[#10B981]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Pinned Top Brand Gradient Thread */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-[#E6DFD5]">
        <div
          className="h-full brand-gradient-bar transition-all duration-300 ease-out"
          style={{ width: `${Math.max(progressPercent, 4)}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Hidden Honeypot */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* ==================================================================== */}
      {/* 1. MOBILE VIEW (< md): 3 QUESTIONS PER STEP                          */}
      {/* ==================================================================== */}
      <div className="block md:hidden max-w-xl mx-auto px-4 py-6">
        <header className="mb-5 pt-1">
          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-[#E6DFD5] mb-3.5 bg-[#FAF8F5]">
            <Image
              src="/cover.png"
              alt="New Era Medical Club Banner"
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#52525B] tracking-wide uppercase">
                New Era Medical Club
              </p>
              <p className="text-[10px] text-[#71717A]">Faculté de Médecine Univ. Ouargla</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#18181B] tracking-tight">
            {form.title}
          </h1>
          <div className="flex items-center justify-between text-xs text-[#71717A] mt-2 pt-2 border-t border-[#E6DFD5]">
            <span>
              Étape {safeMobileStep + 1} sur {totalMobileSteps} (Questions {safeMobileStep * CHUNK_SIZE + 1} à{' '}
              {Math.min((safeMobileStep + 1) * CHUNK_SIZE, totalQuestions)})
            </span>
            <span className="font-semibold text-[#18181B]">{progressPercent}%</span>
          </div>
        </header>

        {generalError && (
          <div role="alert" className="mb-4 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-xs font-medium text-[#B91C1C]">
            {generalError}
          </div>
        )}

        <form onSubmit={isLastMobileStep ? handleSubmit : handleNextMobileStep} noValidate>
          {/* Role selector on Step 0 */}
          {safeMobileStep === 0 && renderRoleSelector(true)}

          {/* Role pill on subsequent steps */}
          {safeMobileStep > 0 && selectedRole && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5] mb-4 text-xs">
              <span className="text-[#71717A]">Profil sélectionné :</span>
              <span
                className="font-bold px-2 py-0.5 rounded-full border text-[11px]"
                style={{
                  backgroundColor: `${selectedRole.color || '#3B33FF'}15`,
                  borderColor: `${selectedRole.color || '#3B33FF'}40`,
                  color: selectedRole.color || '#3B33FF',
                }}
              >
                {selectedRole.name}
              </span>
            </div>
          )}

          {currentMobileFields.length > 0 ? (
            <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs mb-5 space-y-5">
              {currentMobileFields.map((field) => renderField(field))}
            </div>
          ) : (
            <div className="bg-white border border-[#E6DFD5] rounded-xl p-6 text-center text-xs text-[#71717A] mb-5">
              Sélectionnez votre profil ci-dessus pour afficher les questions correspondantes.
            </div>
          )}

          {/* Stepped Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevMobileStep}
              disabled={safeMobileStep === 0 || isPending}
              className={`min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-semibold border transition ${safeMobileStep === 0 || isPending
                  ? 'border-transparent text-[#A1A1AA] cursor-not-allowed'
                  : 'border-[#E6DFD5] text-[#18181B] bg-white hover:bg-[#FAF8F5]'
                }`}
            >
              Précédent
            </button>

            {isLastMobileStep ? (
              <button
                type="submit"
                disabled={isPending}
                className="brand-gradient-btn min-h-[48px] px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
              >
                {isPending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </button>
            ) : (
              <button
                type="submit"
                className="min-h-[48px] px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] transition"
              >
                Continuer (3 questions)
              </button>
            )}
          </div>
        </form>

        <footer className="mt-6 pt-3 border-t border-[#E6DFD5] space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#71717A]">
            <span>{savedTime ? `Brouillon sauvegardé à ${savedTime}` : 'Sauvegarde automatique active'}</span>
            {hasRestoredDraft && (
              <button type="button" onClick={clearDraft} className="text-[#DC2626] hover:underline">
                Effacer
              </button>
            )}
          </div>
          <div className="pt-2 border-t border-[#E6DFD5]/70 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-[#71717A]">Réseaux du club :</span>
            <ClubSocialLinks />
          </div>
        </footer>
      </div>

      {/* ==================================================================== */}
      {/* 2. PC / DESKTOP VIEW (>= md): TWO-SIDED EXPANDED VIEW                 */}
      {/* ==================================================================== */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* LEFT SIDE: Sticky Header, Progress & Reassurance (~38% width) */}
            <div className="col-span-5 sticky top-8 space-y-6">
              <div className="bg-white border border-[#E6DFD5] rounded-xl p-6 shadow-xs space-y-4">
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#E6DFD5] mb-2 bg-[#FAF8F5]">
                  <Image
                    src="/cover.png"
                    alt="New Era Medical Club Banner"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                    <Image
                      src="/logo_light_mode.png"
                      alt="New Era Medical Club Logo"
                      width={36}
                      height={36}
                      className="w-full h-full object-contain"
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

                <h1 className="text-2xl font-extrabold text-[#18181B] tracking-tight leading-tight">
                  {form.title}
                </h1>

                {form.description && (
                  <p className="text-xs text-[#52525B] leading-relaxed">
                    {form.description}
                  </p>
                )}

                {hasRoles && selectedRole && (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] flex items-center justify-between text-xs">
                    <span className="text-[#71717A] font-medium">Votre profil :</span>
                    <span
                      className="font-bold px-2.5 py-0.5 rounded-full border text-xs"
                      style={{
                        backgroundColor: `${selectedRole.color || '#3B33FF'}15`,
                        borderColor: `${selectedRole.color || '#3B33FF'}40`,
                        color: selectedRole.color || '#3B33FF',
                      }}
                    >
                      {selectedRole.name}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E6DFD5] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#18181B]">
                    <span>Progression</span>
                    <span>
                      {answeredCount} / {totalQuestions} remplis ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] border border-[#E6DFD5] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="brand-gradient-bar h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#71717A] flex items-center justify-between">
                  <span>
                    {savedTime ? `Sauvegardé à ${savedTime}` : 'Sauvegarde locale active'}
                  </span>
                  {hasRestoredDraft && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="text-[#DC2626] hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {generalError && (
                  <div role="alert" className="p-3 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-xs font-medium text-[#B91C1C]">
                    {generalError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="brand-gradient-btn w-full min-h-[48px] px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
                  >
                    {isPending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] text-xs text-[#71717A] space-y-3">
                <div>
                  <p className="font-semibold text-[#18181B]">Assistance aux étudiants :</p>
                  <p>En cas de doute, écrivez à <strong>contact@new-era-medical-club-univ-ouargla.dz</strong>.</p>
                </div>
                <div className="pt-2 border-t border-[#E6DFD5]/80">
                  <p className="text-[11px] font-semibold text-[#52525B] mb-2">Rejoignez nos réseaux officiels :</p>
                  <ClubSocialLinks />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Questions 2-Column Grid (~62% width) */}
            <div className="col-span-7 bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-8 shadow-xs">
              {/* Role Selector Header */}
              {renderRoleSelector(false)}

              {hasRoles && !selectedRoleId && (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] text-xs text-[#52525B] mb-5 flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#3B33FF] shrink-0" />
                  <span>Veuillez sélectionner votre profil ci-dessus pour découvrir les questions personnalisées.</span>
                </div>
              )}

              {visibleFields.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#71717A] bg-[#FAF8F5]/50 border border-dashed border-[#E6DFD5] rounded-xl my-4 space-y-1">
                  <p className="font-bold text-[#18181B]">Veuillez choisir votre profil ci-dessus</p>
                  <p className="text-xs">Les questions associées à votre statut apparaîtront ici.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {visibleFields.map((field) => {
                    const isCompact = isCompactField(field);
                    return (
                      <div
                        key={field.id}
                        className={isCompact ? 'sm:col-span-1' : 'sm:col-span-2'}
                      >
                        {renderField(field)}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-[#E6DFD5] flex items-center justify-between">
                <span className="text-xs text-[#71717A]">
                  Vérifiez vos réponses avant de transmettre votre dossier.
                </span>
                <button
                  type="submit"
                  disabled={isPending}
                  className="brand-gradient-btn min-h-[48px] px-8 py-3 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
                >
                  {isPending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
