'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { FormFieldRecord, FormRecord } from '@/types/form';
import { isFieldVisible } from '@/lib/schema-builder';
import { submitFormAction } from '@/app/actions/submitForm';

interface FormRendererProps {
  form: FormRecord;
  fields: FormFieldRecord[];
}

export function FormRenderer({ form, fields }: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);

  // Honeypot field ref
  const [honeypot, setHoneypot] = useState<string>('');

  // Stable idempotency key for this session
  const idempotencyKeyRef = useRef<string>('');
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

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
    } catch {}
    setAnswers({});
    setErrors({});
    setCurrentStep(0);
    setHasRestoredDraft(false);
    setSavedTime(null);
  };

  // Determine which fields are visible given current answers
  const visibleFields = fields.filter((f) => isFieldVisible(f, answers));
  const isStepped = form.layout === 'stepped';

  // Current field for stepped mode
  const safeCurrentStep = Math.min(currentStep, Math.max(0, visibleFields.length - 1));
  const activeField = visibleFields[safeCurrentStep];
  const isLastStep = safeCurrentStep === visibleFields.length - 1;

  // Auto focus input when changing steps
  useEffect(() => {
    if (isStepped && activeInputRef.current) {
      activeInputRef.current.focus({ preventScroll: true });
    }
  }, [safeCurrentStep, isStepped]);

  // Field change handler
  const handleAnswerChange = (key: string, value: unknown) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    saveToLocalStorage(updated);

    // Clear field-specific error when user modifies it
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeField) return;

    const error = validateField(activeField);
    if (error) {
      setErrors((prev) => ({ ...prev, [activeField.key]: error }));
      return;
    }

    if (!isLastStep) {
      setCurrentStep((prev) => Math.min(prev + 1, visibleFields.length - 1));
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Form final submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validate all visible fields
    const clientErrors: Record<string, string> = {};
    for (const field of visibleFields) {
      const err = validateField(field);
      if (err) {
        clientErrors[field.key] = err;
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      // In stepped mode, jump to the first erroneous field
      if (isStepped) {
        const firstErrorIndex = visibleFields.findIndex((f) => clientErrors[f.key]);
        if (firstErrorIndex !== -1) {
          setCurrentStep(firstErrorIndex);
        }
      }
      setGeneralError('Veuillez corriger les champs requis indiqués ci-dessous.');
      return;
    }

    // Submit payload with honeypot
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
        } catch {}
      } else {
        if (res.errors) {
          setErrors(res.errors);
          if (isStepped) {
            const firstErrIndex = visibleFields.findIndex((f) => res.errors?.[f.key]);
            if (firstErrIndex !== -1) {
              setCurrentStep(firstErrIndex);
            }
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
        {/* Brand progress thread completed at 100% */}
        <div className="w-full h-1 bg-[#E6DFD5] rounded-full overflow-hidden mb-8">
          <div className="h-full w-full brand-gradient-bar" />
        </div>

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-10 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#059669] flex items-center justify-center mb-6">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="text-xs font-semibold text-[#52525B] tracking-wide uppercase mb-1">
            Club Médical New Era
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight mb-3">
            Candidature envoyée
          </h1>

          <p className="text-[#3F3F46] text-base leading-relaxed mb-6">
            {submissionMessage}
          </p>

          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg p-4 mb-8">
            <div className="text-xs text-[#71717A] mb-1">Numéro de confirmation</div>
            <div className="font-mono text-sm font-semibold text-[#18181B] tracking-wider select-all">
              {submissionId ? submissionId.slice(0, 13).toUpperCase() : 'REC-CONFIRMED'}
            </div>
            {form.send_receipt && (
              <div className="mt-2 pt-2 border-t border-[#E6DFD5] text-xs text-[#52525B]">
                Un accusé de réception récapitulatif a été expédié à votre adresse email.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`/f/${form.slug}`}
              onClick={() => window.location.reload()}
              className="inline-flex justify-center items-center px-5 py-3 border border-[#E6DFD5] text-sm font-semibold text-[#18181B] bg-white rounded-lg hover:bg-[#FAF8F5] transition"
            >
              Soumettre une autre réponse
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FIELD INPUT RENDER HELPER
  // --------------------------------------------------------------------------
  const renderFieldInput = (field: FormFieldRecord, isStepActive = true) => {
    const errorMsg = errors[field.key];
    const val = answers[field.key];
    const fieldId = `field_${field.key}`;
    const errorId = `err_${field.key}`;

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={fieldId} className="block text-sm sm:text-base font-semibold text-[#18181B]">
            {field.label}{' '}
            <span className={field.required ? 'text-[#E53888] font-normal text-xs sm:text-sm' : 'text-[#71717A] font-normal text-xs'}>
              {field.required ? '(obligatoire)' : '(facultatif)'}
            </span>
          </label>
        </div>

        {field.help_text && (
          <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
            {field.help_text}
          </p>
        )}

        {/* Short Text */}
        {field.type === 'short_text' && (
          <input
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="text"
            value={(val as string) || ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Email */}
        {field.type === 'email' && (
          <input
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="email"
            value={(val as string) || ''}
            placeholder={field.placeholder || 'nom@exemple.com'}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Phone */}
        {field.type === 'phone' && (
          <input
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="tel"
            value={(val as string) || ''}
            placeholder={field.placeholder || '0550 00 00 00'}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Long Text */}
        {field.type === 'long_text' && (
          <textarea
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLTextAreaElement>) : undefined}
            rows={4}
            value={(val as string) || ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Number */}
        {field.type === 'number' && (
          <input
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="number"
            value={val !== undefined ? String(val) : ''}
            placeholder={field.placeholder || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition placeholder:text-[#A1A1AA] focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Date */}
        {field.type === 'date' && (
          <input
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="date"
            value={(val as string) || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
            }`}
          />
        )}

        {/* Select */}
        {field.type === 'select' && (
          <select
            id={fieldId}
            ref={isStepActive ? (activeInputRef as React.RefObject<HTMLSelectElement>) : undefined}
            value={(val as string) || ''}
            onChange={(e) => handleAnswerChange(field.key, e.target.value)}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? errorId : undefined}
            className={`w-full min-h-[48px] px-3.5 py-2.5 text-base text-[#18181B] bg-white border rounded-lg transition focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 ${
              errorMsg ? 'border-[#DC2626] bg-[#FEF2F2]/30' : 'border-[#D4D4D8]'
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
          <div className="space-y-2.5 pt-1" role="radiogroup" aria-labelledby={fieldId}>
            {(field.options || []).map((opt) => {
              const isChecked = val === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-lg border cursor-pointer transition ${
                    isChecked
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
                  <span className="ml-3 text-sm sm:text-base">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Checkboxes */}
        {field.type === 'checkboxes' && (
          <div className="space-y-2.5 pt-1">
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
                  className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-lg border cursor-pointer transition ${
                    isChecked
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
                  <span className="ml-3 text-sm sm:text-base">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* File Upload (Supabase storage or URL fallback) */}
        {field.type === 'file' && (
          <div className="space-y-2">
            <input
              id={fieldId}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // In client demo/prototype: save file name & approximate size
                  handleAnswerChange(field.key, `Fichier: ${file.name} (${Math.round(file.size / 1024)} Ko)`);
                }
              }}
              className="block w-full text-sm text-[#52525B] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3B33FF]/10 file:text-[#3B33FF] hover:file:bg-[#3B33FF]/20 cursor-pointer"
            />
            {typeof val === 'string' && val.length > 0 && (
              <p className="text-xs text-[#059669] font-medium">Fichier sélectionné: {val}</p>
            )}
          </div>
        )}

        {/* Consent Checkbox */}
        {field.type === 'consent' && (
          <label className="flex items-start min-h-[44px] p-3 rounded-lg border border-[#E6DFD5] bg-[#FAF8F5] cursor-pointer mt-2">
            <input
              id={fieldId}
              type="checkbox"
              checked={val === true}
              onChange={(e) => handleAnswerChange(field.key, e.target.checked)}
              className="w-5 h-5 rounded text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF] mt-0.5"
            />
            <span className="ml-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
              {field.label}
            </span>
          </label>
        )}

        {/* Inline Accessible Error Message */}
        {errorMsg && (
          <p id={errorId} role="alert" className="text-xs sm:text-sm font-medium text-[#DC2626] pt-1">
            {errorMsg}
          </p>
        )}
      </div>
    );
  };

  // Progress percentage
  const totalSteps = visibleFields.length;
  const progressPercent = totalSteps > 0 ? Math.round(((safeCurrentStep + 1) / totalSteps) * 100) : 0;

  // --------------------------------------------------------------------------
  // STEPPED LAYOUT (Mobile first, one focused question at a time)
  // --------------------------------------------------------------------------
  if (isStepped) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
        {/* Fixed or sticky Brand Gradient Vital Progress Thread */}
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-[#E6DFD5]">
          <div
            className="h-full brand-gradient-bar transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Form Header */}
        <header className="mb-6 sm:mb-8 pt-2">
          <p className="text-xs font-semibold text-[#52525B] tracking-wide uppercase mb-1">
            Club Médical New Era
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
            {form.title}
          </h1>
          <div className="flex items-center justify-between text-xs text-[#71717A] mt-2 pt-2 border-t border-[#E6DFD5]">
            <span>
              Question {safeCurrentStep + 1} sur {totalSteps}
            </span>
            <span>{progressPercent}% complété</span>
          </div>
        </header>

        {/* Global Error Banner if any */}
        {generalError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-sm font-medium text-[#B91C1C]"
          >
            {generalError}
          </div>
        )}

        {/* Active Question Card */}
        <form onSubmit={isLastStep ? handleSubmit : handleNextStep} noValidate>
          {/* Honeypot field (hidden from assistive tech and regular users) */}
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

          <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-8 shadow-xs mb-6 min-h-[220px] flex flex-col justify-between">
            <div>
              {activeField ? (
                renderFieldInput(activeField, true)
              ) : (
                <p className="text-sm text-[#71717A]">Aucune question disponible.</p>
              )}
            </div>
          </div>

          {/* Stepped Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={safeCurrentStep === 0 || isPending}
              className={`min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold border transition ${
                safeCurrentStep === 0 || isPending
                  ? 'border-transparent text-[#A1A1AA] cursor-not-allowed'
                  : 'border-[#E6DFD5] text-[#18181B] bg-white hover:bg-[#FAF8F5]'
              }`}
            >
              Précédent
            </button>

            {isLastStep ? (
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
                className="min-h-[48px] px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#18181B] hover:bg-[#27272A] transition focus:ring-2 focus:ring-[#18181B]"
              >
                Continuer
              </button>
            )}
          </div>
        </form>

        {/* Draft Reassurance & Reset Option */}
        <footer className="mt-8 pt-4 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#71717A]">
          <div>
            {savedTime ? (
              <span>Brouillon enregistré à {savedTime}</span>
            ) : (
              <span>Sauvegarde automatique locale active</span>
            )}
          </div>
          {hasRestoredDraft && (
            <button
              type="button"
              onClick={clearDraft}
              className="text-[#DC2626] hover:underline"
            >
              Effacer le brouillon
            </button>
          )}
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SINGLE PAGE LAYOUT
  // --------------------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Brand Gradient Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] brand-gradient-bar" />

      <header className="mb-8">
        <p className="text-xs font-semibold text-[#52525B] tracking-wide uppercase mb-1">
          Club Médical New Era
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-sm sm:text-base text-[#52525B] mt-2 leading-relaxed">
            {form.description}
          </p>
        )}
      </header>

      {generalError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-sm font-medium text-[#B91C1C]"
        >
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot field */}
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

        <div className="bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 sm:space-y-8 mb-8">
          {visibleFields.map((field) => renderFieldInput(field, false))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#71717A]">
            {savedTime ? `Brouillon sauvegardé à ${savedTime}` : 'Sauvegarde automatique active'}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="brand-gradient-btn w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
          >
            {isPending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </button>
        </div>
      </form>
    </div>
  );
}
