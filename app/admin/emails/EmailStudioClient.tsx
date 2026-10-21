'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { FormRecord, FormFieldRecord } from '@/types/form';
import { AdminFormWithFields } from '@/lib/supabase/admin';
import {
  generateAiEmailAction,
  refineAiEmailAction,
  sendAiTestEmailAction,
  attachAiEmailToFormAction,
  diagnoseSmtpAction,
} from '@/app/actions/aiEmailActions';
import {
  listHtmlTemplatesAction,
  getHtmlTemplateContentAction,
  insertHtmlTemplateAction,
  deleteHtmlTemplateAction,
} from '@/app/actions/htmlStorageActions';
import { HtmlStorageItem } from '@/lib/supabase/html-storage';
import { GeneratedEmailResult } from '@/lib/gemini';
import { SmtpDiagnosticResult } from '@/lib/mailer';
import { showAdminToast } from '../AdminToast';

export interface EmailStudioClientProps {
  formsWithFields?: AdminFormWithFields[];
  forms?: FormRecord[];
  initialSelectedSlug?: string;
}

export function EmailStudioClient({
  formsWithFields,
  forms,
  initialSelectedSlug,
}: EmailStudioClientProps) {
  // Normalize forms list
  const formsList: FormRecord[] = formsWithFields
    ? formsWithFields.map((f) => f.form)
    : forms || [];

  const defaultSlug =
    initialSelectedSlug && formsList.some((f) => f.slug === initialSelectedSlug)
      ? initialSelectedSlug
      : formsList[0]?.slug || '';

  // 1. Target Form Selection State (Always first)
  const [selectedFormSlug, setSelectedFormSlug] = useState<string>(() => defaultSlug);

  const activeFormWithFields = formsWithFields?.find((f) => f.form.slug === selectedFormSlug);
  const currentForm: FormRecord | undefined =
    activeFormWithFields?.form || formsList.find((f) => f.slug === selectedFormSlug);
  const currentFields: FormFieldRecord[] = activeFormWithFields?.fields || [];
  const hasEmailField = currentFields.some((f) => f.type === 'email');

  // 2. Variable Selection State (100% dynamic, strict form questions only)
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>(() => {
    return currentFields.map((f) => f.key);
  });

  // Keep selectedFieldKeys in sync with active form fields
  useEffect(() => {
    if (currentFields.length > 0) {
      const validKeys = currentFields.map((f) => f.key);
      setSelectedFieldKeys((prev) => {
        const stillValid = prev.filter((k) => validKeys.includes(k));
        return stillValid.length > 0 ? stillValid : validKeys;
      });
    } else {
      setSelectedFieldKeys([]);
    }
  }, [selectedFormSlug, formsWithFields]);

  // When selected form changes, update active fields and default filename
  const handleFormChange = (slug: string) => {
    setSelectedFormSlug(slug);
    setSaveFileName(`${slug}.html`);
    const target = formsWithFields?.find((f) => f.form.slug === slug);
    if (target) {
      setSelectedFieldKeys(target.fields.map((f) => f.key));
      setSubject(`Accusé de réception : ${target.form.title} — New Era Medical Club`);
    } else {
      setSelectedFieldKeys([]);
    }
  };

  const toggleFieldKey = (key: string) => {
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // 3. Message Parameters State
  const defaultSubject = currentForm
    ? `Accusé de réception : ${currentForm.title} — New Era Medical Club`
    : "Accusé de réception — New Era Medical Club";
  const [subject, setSubject] = useState(defaultSubject);
  const [contextType, setContextType] = useState("Accusé de réception");
  const [contentPrompt, setContentPrompt] = useState(
    "Remercier pour la soumission du formulaire. Confirmer la bonne réception des informations et préciser que notre équipe reste à disposition pour toute question ou étape suivante."
  );
  const [importantNote, setImportantNote] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState<'officiel' | 'chaleureux' | 'urgent'>('chaleureux');
  const [designMode, setDesignMode] = useState<'cream' | 'dark' | 'light'>('cream');
  const [infoPresentation, setInfoPresentation] = useState<
    'divider table' | '2x2 grid of small blocks' | 'vertical timeline' | 'ticket style'
  >('divider table');

  // AI Generation State
  const [isGenerating, startGenerating] = useTransition();
  const [isRefining, startRefining] = useTransition();
  const [isSendingTest, startSendingTest] = useTransition();
  const [isAttaching, startAttaching] = useTransition();

  const [emailResult, setEmailResult] = useState<GeneratedEmailResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [userSuggestion, setUserSuggestion] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test Email & File Name State
  const [testEmailAddress, setTestEmailAddress] = useState('event@new-era-medical-club-univ-ouargla.dz');
  const [copiedCode, setCopiedCode] = useState(false);

  // SMTP Diagnostic & Debug Mode State
  const [smtpDiagnostic, setSmtpDiagnostic] = useState<SmtpDiagnosticResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [testDebugLogs, setTestDebugLogs] = useState<string[] | null>(null);
  const [testDeliveryStatus, setTestDeliveryStatus] = useState<{
    success: boolean;
    messageId?: string;
    response?: string;
    error?: string;
  } | null>(null);

  const runSmtpDiagnostic = async () => {
    setIsDiagnosing(true);
    setShowDebugConsole(true);
    const result = await diagnoseSmtpAction();
    setSmtpDiagnostic(result);
    setIsDiagnosing(false);
    showAdminToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Connexion SMTP Vérifiée' : 'Erreur Diagnostic SMTP',
      message: result.message,
    });
  };

  // Supabase Storage 'Html_forms' state
  const [storageTemplates, setStorageTemplates] = useState<HtmlStorageItem[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [saveFileName, setSaveFileName] = useState(
    formsList[0]?.slug ? `${formsList[0].slug}.html` : 'recrutement-2026.html'
  );
  const [isSavingToStorage, setIsSavingToStorage] = useState(false);
  const [storageDrawerOpen, setStorageDrawerOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Close delete modal on Escape key
  useEffect(() => {
    if (!fileToDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeletingFile) {
        setFileToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileToDelete, isDeletingFile]);

  const refreshStorageList = async () => {
    setIsLoadingStorage(true);
    const res = await listHtmlTemplatesAction();
    if (res.success && res.templates) {
      setStorageTemplates(res.templates);
    }
    setIsLoadingStorage(false);
  };

  useEffect(() => {
    let mounted = true;
    listHtmlTemplatesAction().then((res) => {
      if (mounted && res.success && res.templates) {
        setStorageTemplates(res.templates);
      }
      if (mounted) setIsLoadingStorage(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleInsertToStorage = async () => {
    if (!emailResult?.html) return;
    const name = saveFileName.trim() || `${selectedFormSlug || 'modele'}.html`;
    setIsSavingToStorage(true);
    setStatusMessage(null);
    const res = await insertHtmlTemplateAction(name, emailResult.html);
    setIsSavingToStorage(false);
    if (res.success) {
      showAdminToast({
        type: 'success',
        title: 'Modèle inséré dans le Bucket',
        message: `Le fichier "${name}" est désormais persisté dans le bucket Supabase "Html_forms".`,
      });
      setStatusMessage({
        type: 'success',
        text: `✓ Modèle inséré avec succès dans le bucket 'Html_forms' (${res.path}).`,
      });
      refreshStorageList();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || "Erreur lors de l'insertion dans 'Html_forms'.",
      });
    }
  };

  const handleLoadFromStorage = async (fileName: string) => {
    setStatusMessage(null);
    const res = await getHtmlTemplateContentAction(fileName);
    if (res.success && res.html) {
      const titleMatch = res.html.match(/<title>([^<]+)<\/title>/i);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : '';
      const fallbackSubject = activeFormWithFields?.form.title
        ? `Accusé de réception : ${activeFormWithFields.form.title} — New Era Medical Club`
        : 'Accusé de réception — New Era Medical Club';

      setEmailResult({
        subject:
          extractedTitle &&
          !extractedTitle.toLowerCase().endsWith('.html') &&
          !extractedTitle.toLowerCase().startsWith('modèle ')
            ? extractedTitle
            : fallbackSubject,
        badge: 'HTML_FORMS',
        headline: activeFormWithFields?.form.title || fileName.replace('.html', ''),
        preheader: `Accusé de réception officiel`,
        html: res.html,
        plainText: 'Accusé de réception officiel',
      });
      setSaveFileName(fileName);
      showAdminToast({
        type: 'info',
        title: 'Modèle chargé',
        message: `Le modèle "${fileName}" a été injecté dans le studio.`,
      });
      setStatusMessage({
        type: 'success',
        text: `✓ Modèle '${fileName}' chargé avec succès depuis le bucket 'Html_forms'.`,
      });
      setStorageDrawerOpen(false);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || "Erreur lors du chargement du fichier.",
      });
    }
  };

  const handleConfirmDeleteFromStorage = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    const res = await deleteHtmlTemplateAction(fileToDelete);
    setIsDeletingFile(false);
    const deletedName = fileToDelete;
    setFileToDelete(null);
    if (res.success) {
      refreshStorageList();
      showAdminToast({
        type: 'success',
        title: 'Modèle supprimé',
        message: `Le modèle "${deletedName}" a été supprimé définitivement du bucket Supabase.`,
      });
      setStatusMessage({
        type: 'success',
        text: `✓ Modèle '${deletedName}' supprimé définitivement du bucket 'Html_forms'.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || `Erreur lors de la suppression de '${deletedName}'.`,
      });
    }
  };

  const PRESETS = [
    {
      label: 'Accusé de réception',
      subject: currentForm
        ? `Accusé de réception : ${currentForm.title} — New Era Medical Club`
        : 'Accusé de réception — New Era Medical Club',
      context: 'Accusé de réception',
      prompt:
        'Remercier pour la soumission du formulaire. Confirmer la bonne réception des informations et préciser que l’équipe reste disponible pour toute question ou précision.',
    },
    {
      label: 'Validation & Confirmation',
      subject: currentForm
        ? `Confirmation : ${currentForm.title} — New Era Medical Club`
        : 'Confirmation de votre participation — New Era Medical Club',
      context: 'Confirmation',
      prompt:
        'Confirmer au destinataire que sa participation ou demande est validée avec succès. Lui donner les détails importants et lui souhaiter une excellente expérience.',
    },
    {
      label: 'Atelier / Workshop',
      subject: 'Confirmation de participation — Workshop Médical',
      context: 'Atelier pratique',
      prompt:
        'Confirmer la place du participant à l’atelier pratique. Lui rappeler de venir avec sa tenue médicale et d’arriver 10 minutes avant le début.',
    },
    {
      label: 'Candidature & Recrutement',
      subject: 'Candidature bien reçue — Recrutement New Era Medical Club',
      context: 'Recrutement au club',
      prompt:
        'Remercier pour la candidature. Préciser que le comité examine le dossier et que les convocations pour les entretiens seront communiquées sous 5 jours ouvrés.',
    },
    {
      label: 'Annonce & Informations',
      subject: 'Information importante — New Era Medical Club',
      context: 'Information générale',
      prompt:
        'Communiquer une information claire et importante aux membres inscrits concernant les prochaines étapes ou consignes.',
    },
  ];

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setSubject(preset.subject);
    setContextType(preset.context);
    setContentPrompt(preset.prompt);
  };

  // Generate Email with selected form and custom chosen fields
  const handleGenerate = () => {
    setStatusMessage(null);
    startGenerating(async () => {
      const selectedFieldsData = currentFields
        .filter((f) => selectedFieldKeys.includes(f.key))
        .map((f) => ({
          key: f.key,
          label: f.label,
          placeholder: f.placeholder || undefined,
        }));

      const res = await generateAiEmailAction({
        subject,
        contextType,
        contentPrompt,
        keyInfo: contentPrompt,
        importantNote: importantNote.trim() || undefined,
        buttonText: buttonText.trim() || undefined,
        buttonUrl: buttonUrl.trim() || undefined,
        tone,
        designMode,
        infoPresentation,
        selectedFormTitle: activeFormWithFields?.form.title || 'Formulaire New Era Club',
        selectedFormSlug,
        selectedFields: selectedFieldsData,
      });

      if (res.success && res.result) {
        setEmailResult(res.result);
        showAdminToast({
          type: 'success',
          title: 'Courriel IA généré',
          message: `Le modèle a été généré avec les variables sélectionnées pour "${activeFormWithFields?.form.title || selectedFormSlug}".`,
        });
        setStatusMessage({ type: 'success', text: `Email généré avec succès en mode ${designMode} !` });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Erreur lors de la génération avec l’IA.' });
      }
    });
  };

  // Refine Email with User Suggestion
  const handleRefine = (suggestionToUse?: string) => {
    const textToSubmit = suggestionToUse || userSuggestion;
    if (!emailResult || !textToSubmit.trim()) return;

    setStatusMessage(null);
    startRefining(async () => {
      const res = await refineAiEmailAction(emailResult, textToSubmit);
      if (res.success && res.result) {
        setEmailResult(res.result);
        setUserSuggestion('');
        setStatusMessage({ type: 'success', text: 'Modifications appliquées par l’IA avec succès !' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Erreur lors de l’ajustement par l’IA.' });
      }
    });
  };

  // Copy HTML code
  const handleCopyHtml = () => {
    if (!emailResult) return;
    navigator.clipboard.writeText(emailResult.html);
    setCopiedCode(true);
    showAdminToast({
      type: 'info',
      title: 'Code copié',
      message: 'Le code HTML complet a été copié dans votre presse-papier.',
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Send Direct Test Email
  const handleSendTest = () => {
    if (!emailResult || !testEmailAddress) return;
    setStatusMessage(null);
    setTestDebugLogs(null);
    setTestDeliveryStatus(null);
    startSendingTest(async () => {
      const res = await sendAiTestEmailAction(testEmailAddress, emailResult.subject, emailResult.html);
      if (res.debugLogs) {
        setTestDebugLogs(res.debugLogs);
      }
      if (res.success) {
        setTestDeliveryStatus({
          success: true,
          messageId: res.messageId,
          response: res.response,
        });
        showAdminToast({
          type: 'success',
          title: 'Email de test envoyé',
          message: `Test transmis avec succès à ${testEmailAddress}.`,
        });
        setStatusMessage({ type: 'success', text: `Email de test délivré avec succès à ${testEmailAddress} !` });
      } else {
        setShowDebugConsole(true);
        setTestDeliveryStatus({
          success: false,
          error: res.error,
        });
        setStatusMessage({ type: 'error', text: res.error || 'Échec de l’envoi de l’email de test.' });
      }
    });
  };

  // Attach to Form
  const handleAttachToForm = () => {
    if (!emailResult || !selectedFormSlug) return;
    if (!hasEmailField) {
      showAdminToast({
        type: 'error',
        title: 'Champ Email Manquant',
        message: "Inutile d'associer un modèle : ce formulaire ne contient aucun champ de type « Adresse email ». Ajoutez d'abord ce champ.",
      });
      setStatusMessage({
        type: 'error',
        text: "Association impossible : ce formulaire ne comporte aucun champ « Adresse email ». Les candidats ne pourraient pas recevoir ce courriel. Ajoutez d'abord le champ email dans le formulaire.",
      });
      return;
    }
    setStatusMessage(null);
    startAttaching(async () => {
      let cleanSubject = emailResult.subject || subject;
      if (cleanSubject.toLowerCase().endsWith('.html') || cleanSubject.toLowerCase().startsWith('modèle ')) {
        cleanSubject =
          subject ||
          (activeFormWithFields?.form.title
            ? `Accusé de réception : ${activeFormWithFields.form.title} — New Era Medical Club`
            : 'Accusé de réception — New Era Medical Club');
      }
      const res = await attachAiEmailToFormAction(selectedFormSlug, cleanSubject, emailResult.html);
      if (res.success) {
        showAdminToast({
          type: 'success',
          title: 'Modèle associé au formulaire',
          message: `Le modèle est désormais configuré pour le formulaire "${selectedFormSlug}".`,
        });
        setStatusMessage({
          type: 'success',
          text: `Ce template officiel a été associé au formulaire "${selectedFormSlug}". Les personnes ayant répondu recevront automatiquement ce courriel !`,
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Échec de l’association au formulaire.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53888] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B33FF]">
              Gemini 3.8 Flash &bull; Studio d&apos;Emails Officiel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Studio de Modèles d’Emails IA
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl">
            Sélectionnez un formulaire, choisissez les variables exactes à injecter, et laissez Gemini rédiger un courriel HTML prêt pour la production.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStorageDrawerOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E6DFD5] text-[#18181B] hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>📁 Modèles du Bucket</span>
            <span className="px-1.5 py-0.2 bg-[#FAF6EE] text-[#3B33FF] rounded text-[10px] font-bold border border-[#E6DFD5]">
              {storageTemplates.length}
            </span>
          </button>

          {emailResult && (
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E6DFD5] text-[#18181B] hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs"
            >
              {copiedCode ? (
                <>
                  <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copier le HTML</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-between transition ${statusMessage.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Controls (42%) & Right Studio Preview (58%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Input Form & Prompt Parameters                          */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* STEP 1: TARGET FORM SELECTION (Always First) */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <label htmlFor="target-form-select" className="text-xs font-bold text-[#18181B] uppercase tracking-wide">
                  Formulaire cible associé <span className="text-[#DC2626]">*</span>
                </label>
              </div>

              {activeFormWithFields && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${activeFormWithFields.form.status === 'open'
                    ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                  }`}>
                  {activeFormWithFields.form.status.toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <select
                id="target-form-select"
                value={selectedFormSlug}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] shadow-2xs"
              >
                {formsList.map((f) => {
                  const hasCustom = Boolean(f.custom_email_html && f.custom_email_html.trim().length > 0);
                  return (
                    <option key={f.id} value={f.slug}>
                      {f.title} {hasCustom ? '✨ [Modèle IA lié]' : ''}
                    </option>
                  );
                })}
              </select>

              {activeFormWithFields && (
                <div className="text-[11px] text-[#71717A] flex items-center gap-2 flex-wrap pt-0.5">
                  <span>URL publique : <code className="font-mono text-[#18181B]">/f/{selectedFormSlug}</code></span>
                  <span>&bull;</span>
                  <span>{currentFields.length} question(s) configurée(s)</span>
                  <span>&bull;</span>
                  {hasEmailField ? (
                    <span className="text-[#15803D] font-semibold flex items-center gap-1">
                      <span>✓</span> Champ email détecté
                    </span>
                  ) : (
                    <span className="text-[#DC2626] font-bold flex items-center gap-1 bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                      <span>⚠️</span> Aucun champ email
                    </span>
                  )}
                </div>
              )}

              {!hasEmailField && (
                <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs space-y-2.5 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-bold text-[#78350F] text-xs">
                        Aucun champ &laquo; Adresse email &raquo; dans ce formulaire
                      </p>
                      <p className="text-[11px] text-[#92400E] leading-relaxed">
                        Pour que les candidats puissent recevoir un accusé de réception, ajoutez une question avec le type <strong>Adresse email</strong> dans ce formulaire.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/admin/forms/${selectedFormSlug}/edit`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer text-center"
                  >
                    <span>✏️ Ajouter l&apos;email au formulaire</span>
                  </a>
                </div>
              )}

              {activeFormWithFields?.form.custom_email_html && (
                <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg text-xs text-[#3730A3] flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0"></span>
                    <span className="line-clamp-1">
                      <strong className="text-[#312E81]">Modèle IA actif :</strong> &ldquo;{activeFormWithFields.form.custom_email_subject || 'Accusé officiel'}&rdquo;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailResult({
                        subject: activeFormWithFields.form.custom_email_subject || `Accusé de réception — ${activeFormWithFields.form.title}`,
                        badge: 'Modèle Actif Formulaire',
                        headline: activeFormWithFields.form.title,
                        preheader: 'Modèle officiel actuellement configuré',
                        html: activeFormWithFields.form.custom_email_html || '',
                        plainText: activeFormWithFields.form.custom_email_subject || '',
                      });
                      showAdminToast({
                        type: 'success',
                        title: 'Modèle actif chargé',
                        message: 'Le modèle IA actuel du formulaire a été injecté dans l’éditeur.',
                      });
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5F3FF] border border-[#C7D2FE] text-[#4338CA] font-semibold text-[11px] rounded-md shadow-2xs transition shrink-0"
                  >
                    👁️ Charger dans l&apos;éditeur
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: FIELD SELECTION (Strict Non-Random Variables) */}
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#3B33FF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wide">
                  Champs du formulaire à injecter
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#3B33FF] bg-[#3B33FF]/10 px-2 py-0.5 rounded-full shrink-0">
                {selectedFieldKeys.length} sélectionné(s)
              </span>
            </div>

            {/* Questions / Fields Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[11px] font-semibold text-[#52525B]">
                  Sélectionnez les réponses à intégrer dans le courriel :
                </label>
                {currentFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFieldKeys.length === currentFields.length) {
                        setSelectedFieldKeys([]);
                      } else {
                        setSelectedFieldKeys(currentFields.map((f) => f.key));
                      }
                    }}
                    className="text-[10px] font-semibold text-[#3B33FF] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {selectedFieldKeys.length === currentFields.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>

              {currentFields.length === 0 ? (
                <div className="p-3 bg-white rounded-lg border border-[#E6DFD5] text-xs text-[#71717A] space-y-1">
                  <p className="font-semibold text-[#18181B]">
                    Aucune question configurée pour ce formulaire.
                  </p>
                  <p className="text-[11px]">
                    Ajoutez des questions dynamiques dans l&apos;éditeur de formulaire pour pouvoir les sélectionner et les injecter dans ce template.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-white rounded-lg border border-[#E6DFD5] max-h-48 overflow-y-auto">
                  {currentFields.map((f) => {
                    const isChecked = selectedFieldKeys.includes(f.key);
                    return (
                      <button
                        key={f.id || f.key}
                        type="button"
                        onClick={() => toggleFieldKey(f.key)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                          isChecked
                            ? 'bg-[#3B33FF]/10 border-[#3B33FF] text-[#18181B] font-semibold shadow-2xs'
                            : 'bg-[#FAF8F5] border-[#E6DFD5] text-[#71717A] hover:border-[#D4D4D8]'
                        }`}
                        title={`Champ dynamique: ${f.label} (variable: {{${f.key}}})`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isChecked ? 'bg-[#3B33FF] text-white' : 'border border-[#D4D4D8] bg-white'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </span>
                        <span>{f.label}</span>
                        <code className="text-[10px] text-[#3B33FF] font-mono bg-[#3B33FF]/5 px-1 py-0.5 rounded border border-[#3B33FF]/20">
                          &#123;&#123;{f.key}&#125;&#125;
                        </code>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-[#71717A] pt-0.5">
                💡 Seules ces variables réelles sélectionnées seront transmises à Gemini. Aucune variable fictive par défaut n&apos;est injectée.
              </p>
            </div>
          </div>

          {/* STEP 3: MESSAGE PARAMETERS */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wide">
                Consignes &amp; Rédaction du courriel
              </h3>
            </div>

            {/* Quick Presets Pills */}
            <div>
              <label className="block text-xs font-semibold text-[#52525B] mb-1.5">
                Type de courriel (Suggestions en 1 clic) :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6DFD5] bg-[#FAF8F5] hover:bg-[#F4F0EA] text-[#18181B] transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#18181B]">
                Objet / Sujet de l’email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Accusé de réception : {{titre_formulaire}} — New Era Medical Club"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
              />
            </div>

            {/* Main Content & Instructions Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#18181B]">
                  Message à communiquer / Consignes pour l&apos;IA <span className="text-[#DC2626]">*</span>
                </label>
                <span className="text-[11px] text-[#71717A]">
                  Langage naturel libre
                </span>
              </div>
              <textarea
                rows={4}
                value={contentPrompt}
                onChange={(e) => setContentPrompt(e.target.value)}
                placeholder="Décrivez ce que vous souhaitez dire dans cet email : remercier pour la participation ou soumission, donner les détails importants (dates, lieu, consignes si applicable), prochaines étapes, etc. L'IA structure tout avec élégance."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] leading-relaxed"
              />
            </div>

            {/* Collapsible Advanced Options Toggle */}
            <div className="pt-1 border-t border-[#E6DFD5]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#52525B] hover:text-[#18181B] transition"
              >
                <span className="flex items-center gap-1.5">
                  <span>⚙️ Options avancées</span>
                  <span className="text-[10px] text-[#71717A] font-normal">
                    (Bouton CTA, Alerte importante, Thème graphique)
                  </span>
                </span>
                <span className="text-xs">{showAdvanced ? '▲ Réduire' : '▼ Déplier'}</span>
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-3 pb-1 animate-in fade-in duration-200">
                  {/* Context Type */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#18181B]">
                      Contexte / Catégorie d&apos;événement
                    </label>
                    <input
                      type="text"
                      value={contextType}
                      onChange={(e) => setContextType(e.target.value)}
                      placeholder="Ex: Confirmation, Atelier, Recrutement, Entretien..."
                      className="w-full px-3 py-1.5 text-xs border border-[#D4D4D8] rounded-lg"
                    />
                  </div>

                  {/* Highlighted Warning Note */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#18181B]">
                      Note importante / Avertissement en exergue (facultatif)
                    </label>
                    <input
                      type="text"
                      value={importantNote}
                      onChange={(e) => setImportantNote(e.target.value)}
                      placeholder="Ex: Présentez-vous 10 minutes en avance avec votre carte d'étudiant."
                      className="w-full px-3 py-1.5 text-xs border border-[#D4D4D8] rounded-lg"
                    />
                  </div>

                  {/* Optional CTA Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#18181B]">
                        Bouton d&apos;action CTA (Texte)
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Ex: Rejoindre le groupe WhatsApp"
                        className="w-full px-3 py-1.5 text-xs border border-[#D4D4D8] rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#18181B]">
                        Bouton d&apos;action (Lien URL)
                      </label>
                      <input
                        type="url"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-xs border border-[#D4D4D8] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#18181B]">
                      Tonalité rédactionnelle :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['chaleureux', 'officiel', 'urgent'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center capitalize transition ${
                            tone === t
                              ? 'bg-[#18181B] text-white border-[#18181B]'
                              : 'bg-white text-[#52525B] border-[#D4D4D8] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Design Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#18181B]">
                      Thème graphique &amp; Palette :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDesignMode('cream')}
                        className={`p-2 rounded-lg border text-left transition ${
                          designMode === 'cream'
                            ? 'border-[#3B33FF] bg-[#F0E8DB]/60 ring-1 ring-[#3B33FF]'
                            : 'border-[#D4D4D8] bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#1B1740]">Crème Luxe</div>
                        <div className="text-[10px] text-[#7A7390]">Palette chaleureuse</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDesignMode('dark')}
                        className={`p-2 rounded-lg border text-left transition ${
                          designMode === 'dark'
                            ? 'border-[#3B33FF] bg-[#161326] text-white ring-1 ring-[#3B33FF]'
                            : 'border-[#D4D4D8] bg-[#161326]/90 text-white hover:bg-[#161326]'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">Nuit High-Tech</div>
                        <div className="text-[10px] text-[#A1A1AA]">Sombre officiel</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDesignMode('light')}
                        className={`p-2 rounded-lg border text-left transition ${
                          designMode === 'light'
                            ? 'border-[#3B33FF] bg-white ring-1 ring-[#3B33FF]'
                            : 'border-[#D4D4D8] bg-white hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#18181B]">Blanc Épuré</div>
                        <div className="text-[10px] text-[#71717A]">Minimaliste</div>
                      </button>
                    </div>
                  </div>

                  {/* Info Presentation Style */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#18181B]">
                      Présentation des informations clés :
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'divider table', label: 'Tableau avec lignes' },
                        { id: '2x2 grid of small blocks', label: 'Grille 2x2 en cartes' },
                        { id: 'vertical timeline', label: 'Chronologie verticale' },
                        { id: 'ticket style', label: 'Style Billet / Ticket' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setInfoPresentation(st.id as typeof infoPresentation)}
                          className={`p-2 rounded-lg text-xs font-medium border text-left transition ${
                            infoPresentation === st.id
                              ? 'border-[#3B33FF] bg-[#3B33FF]/10 text-[#3B33FF] font-semibold'
                              : 'border-[#D4D4D8] bg-white text-[#52525B] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !subject.trim() || !contentPrompt.trim()}
                className="brand-gradient-btn w-full min-h-[48px] py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Génération en cours par Gemini...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Générer l&apos;email avec Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Studio Live Preview & Clean Actions                    */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-4">
          {!emailResult ? (
            <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Studio Canvas Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E6DFD5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B33FF]/15 to-[#8B3EE1]/15 text-[#3B33FF] flex items-center justify-center text-lg shadow-inner">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#18181B] tracking-tight flex items-center gap-2">
                      <span>Studio d&apos;Aperçu &amp; Rendu</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B33FF]/10 text-[#3B33FF]">
                        Prêt à générer
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#71717A]">
                      Le rendu graphique HTML s&apos;affichera ici dès la génération
                    </p>
                  </div>
                </div>

                {activeFormWithFields?.form.custom_email_html && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailResult({
                        subject:
                          activeFormWithFields.form.custom_email_subject ||
                          `Accusé de réception — ${activeFormWithFields.form.title}`,
                        badge: 'Modèle Actif Formulaire',
                        headline: activeFormWithFields.form.title,
                        preheader: 'Modèle officiel actuellement configuré',
                        html: activeFormWithFields.form.custom_email_html || '',
                        plainText: activeFormWithFields.form.custom_email_subject || '',
                      });
                      showAdminToast({
                        type: 'success',
                        title: 'Modèle actif chargé',
                        message: 'Le modèle IA actuel du formulaire a été injecté dans le studio.',
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] text-[#3B33FF] font-semibold text-xs rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                  >
                    <span>👁️ Charger le modèle actif</span>
                  </button>
                )}
              </div>

              {/* Summary Live Card of Current Settings */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-4 sm:p-5 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Configuration en cours pour la génération
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-[#E6DFD5] space-y-1">
                    <span className="text-[10px] font-semibold text-[#71717A] uppercase">Formulaire Cible</span>
                    <p className="font-bold text-[#18181B] truncate">
                      {activeFormWithFields?.form.title || selectedFormSlug}
                    </p>
                    <p className="text-[10px] font-mono text-[#3B33FF]">/f/{selectedFormSlug}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E6DFD5] space-y-1">
                    <span className="text-[10px] font-semibold text-[#71717A] uppercase">Variables Injectées</span>
                    <p className="font-bold text-[#18181B]">
                      {selectedFieldKeys.length} question(s) sélectionnée(s)
                    </p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {selectedFieldKeys.length > 0 ? (
                        selectedFieldKeys.slice(0, 4).map((k) => (
                          <code key={k} className="text-[9px] font-mono bg-[#3B33FF]/10 text-[#3B33FF] px-1 py-0.2 rounded">
                            &#123;&#123;{k}&#125;&#125;
                          </code>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#71717A] italic">Aucune variable</span>
                      )}
                      {selectedFieldKeys.length > 4 && (
                        <span className="text-[9px] text-[#71717A] font-semibold">+{selectedFieldKeys.length - 4}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#E6DFD5] space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-semibold text-[#71717A] uppercase">Objet de l&apos;email</span>
                    <p className="font-semibold text-[#18181B] truncate">
                      {subject || 'Accusé de réception officiel — New Era Medical Club'}
                    </p>
                  </div>
                </div>

                {/* Live Trigger CTA inside Canvas */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !subject.trim() || !contentPrompt.trim()}
                    className="brand-gradient-btn w-full min-h-[46px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Génération Gemini en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Générer le modèle HTML maintenant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quality & Production Guarantees Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6DFD5]">
                  <div className="text-base mb-1">🏷️</div>
                  <div className="text-xs font-bold text-[#18181B]">Variables Réelles</div>
                  <p className="text-[10px] text-[#71717A] mt-0.5">Publipostage strict sans variables inventées</p>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6DFD5]">
                  <div className="text-base mb-1">📱</div>
                  <div className="text-xs font-bold text-[#18181B]">HTML Tabulaire</div>
                  <p className="text-[10px] text-[#71717A] mt-0.5">Compatible Gmail, Outlook, Apple &amp; mobile</p>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6DFD5]">
                  <div className="text-base mb-1">☁️</div>
                  <div className="text-xs font-bold text-[#18181B]">Stockage Cloud</div>
                  <p className="text-[10px] text-[#71717A] mt-0.5">Persistance immédiate dans Supabase</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E6DFD5] rounded-2xl overflow-hidden shadow-xs space-y-0">
              {/* Studio Header Bar */}
              <div className="p-4 border-b border-[#E6DFD5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#3B33FF]/10 text-[#3B33FF]">
                      {emailResult.badge || 'OFFICIEL'}
                    </span>
                    <span className="text-xs font-bold text-[#18181B] truncate">
                      {emailResult.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] truncate">
                    Pré-en-tête : {emailResult.preheader}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Tab Preview vs Code */}
                  <div className="bg-white border border-[#E6DFD5] rounded-lg p-0.5 flex">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${activeTab === 'preview'
                          ? 'bg-[#18181B] text-white'
                          : 'text-[#71717A] hover:text-[#18181B]'
                        }`}
                    >
                      Aperçu
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${activeTab === 'code'
                          ? 'bg-[#18181B] text-white'
                          : 'text-[#71717A] hover:text-[#18181B]'
                        }`}
                    >
                      Code HTML
                    </button>
                  </div>

                  {/* Device Toggle */}
                  {activeTab === 'preview' && (
                    <div className="bg-white border border-[#E6DFD5] rounded-lg p-0.5 flex">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded text-xs transition ${previewDevice === 'desktop' ? 'bg-[#FAF8F5] text-[#3B33FF]' : 'text-[#71717A]'
                          }`}
                        title="Vue Ordinateur"
                      >
                        🖥️
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded text-xs transition ${previewDevice === 'mobile' ? 'bg-[#FAF8F5] text-[#3B33FF]' : 'text-[#71717A]'
                          }`}
                        title="Vue Mobile"
                      >
                        📱
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Body */}
              <div
                className={`p-4 sm:p-6 transition-all ${designMode === 'dark' ? 'bg-[#0B0A11]' : designMode === 'cream' ? 'bg-[#F0E8DB]' : 'bg-[#F4F4F5]'
                  }`}
              >
                {activeTab === 'preview' ? (
                  <div
                    className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile'
                        ? 'max-w-[375px] shadow-2xl rounded-2xl overflow-hidden border-4 border-[#27272A]'
                        : 'max-w-[620px]'
                      }`}
                  >
                    <iframe
                      title="Aperçu email"
                      srcDoc={emailResult.html}
                      className="w-full min-h-[580px] bg-white rounded-xl shadow-md border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto bg-[#18181B] rounded-xl p-4 overflow-x-auto text-white">
                    <pre className="text-xs font-mono text-[#A1A1AA] whitespace-pre-wrap break-all leading-relaxed">
                      {emailResult.html}
                    </pre>
                  </div>
                )}
              </div>

              {/* Suggestion Bar for Gemini AI Refinements */}
              <div className="p-4 border-t border-[#E6DFD5] bg-white space-y-2">
                <label className="block text-xs font-bold text-[#18181B]">
                  Demander une modification ou un ajustement à l&apos;IA :
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={userSuggestion}
                    onChange={(e) => setUserSuggestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRefine();
                      }
                    }}
                    placeholder="Ex: Rends le ton plus chaleureux, ajoute un rappel sur la blouse blanche, change le bouton..."
                    className="min-w-0 flex-1 px-3.5 py-2 text-xs border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRefine()}
                    disabled={isRefining || !userSuggestion.trim()}
                    className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                  >
                    {isRefining ? 'Ajustement...' : 'Appliquer l’ajustement ✨'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Ajoute un bouton de confirmation',
                    'Mets en valeur la consigne de retard',
                    'Passe en style sombre high-tech',
                    'Ajoute une mention pour la carte d’étudiant',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleRefine(s)}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E6DFD5] text-[#52525B] hover:text-[#18181B] hover:border-[#D4D4D8]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ================================================================ */}
              {/* ACTION BAR: Storage Html_forms Insert & Form Selector (FIXED)   */}
              {/* ================================================================ */}
              <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#FAF8F5] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                    <span>💾 Sauvegarde Cloud &amp; Liaison Formulaire</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3B33FF]/10 text-[#3B33FF]">
                      Bucket Html_forms
                    </span>
                  </span>
                  <span className="text-[11px] text-[#71717A]">
                    Enregistrez dans le bucket Supabase pour une réutilisation 100% cloud sans copier de code brut.
                  </span>
                </div>

                {/* Grid with 2 distinct cards, min-w-0 to avoid ANY overlap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: Insert to Supabase Storage Bucket Html_forms */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6DFD5] space-y-2 shadow-2xs">
                    <label className="block text-xs font-bold text-[#18181B]">
                      1. Sauvegarder dans le Bucket <code>Html_forms</code> :
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={saveFileName}
                        onChange={(e) => setSaveFileName(e.target.value)}
                        placeholder="nom-du-fichier.html"
                        className="min-w-0 flex-1 px-3 py-2 text-xs font-mono border border-[#D4D4D8] rounded-lg bg-[#FAF8F5]"
                      />
                      <button
                        type="button"
                        onClick={handleInsertToStorage}
                        disabled={isSavingToStorage || !emailResult?.html}
                        className="min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {isSavingToStorage ? 'Insertion...' : '💾 Insérer'}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Link Directly to Selected Form */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6DFD5] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#18181B]">
                        2. Lier au formulaire sélectionné :
                      </label>
                      <span className="text-[11px] font-mono text-[#3B33FF] font-semibold">
                        /f/{selectedFormSlug}
                      </span>
                    </div>

                    {!hasEmailField ? (
                      <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-base shrink-0">🚫</span>
                          <div>
                            <p className="font-bold text-[#7F1D1D]">
                              Inutile d&apos;associer ce formulaire : aucun champ &laquo; Adresse email &raquo;
                            </p>
                            <p className="text-[11px] text-[#991B1B] mt-0.5 leading-relaxed">
                              Ce formulaire ne collecte pas l&apos;adresse email des candidats (Type de réponse : Adresse email). L&apos;accusé de réception ne pourra donc jamais leur être délivré. Ajoutez d&apos;abord le champ email dans le formulaire.
                            </p>
                          </div>
                        </div>
                        <div className="pt-1">
                          <a
                            href={`/admin/forms/${selectedFormSlug}/edit`}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-xs rounded-lg shadow-xs transition text-center cursor-pointer"
                          >
                            ✏️ Modifier le formulaire et ajouter l&apos;email
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="min-w-0 flex-1 px-3 py-2 text-xs border border-[#E6DFD5] rounded-lg bg-[#FAF8F5] truncate text-[#18181B] font-semibold flex items-center">
                          {activeFormWithFields?.form.title || selectedFormSlug}
                        </div>
                        <button
                          type="button"
                          onClick={handleAttachToForm}
                          disabled={isAttaching || !selectedFormSlug}
                          className="brand-gradient-btn min-h-[38px] px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isAttaching ? 'Liaison en cours...' : '🔗 Appliquer'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* ACTION BAR: Send Test Email (Clean Responsive)                   */}
              {/* ================================================================ */}
              <div className="p-4 border-t border-[#E6DFD5] bg-white space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#52525B] font-medium shrink-0">
                      Tester la délivrabilité en direct :
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDebugConsole(!showDebugConsole)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition flex items-center gap-1 ${showDebugConsole
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#FAF8F5] text-[#52525B] border-[#E6DFD5] hover:bg-[#F4F4F5]'
                        }`}
                    >
                      <span>🛠️ Mode Debug SMTP</span>
                      <span>{showDebugConsole ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:max-w-md">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="email.destinataire@exemple.com"
                      className="min-w-0 flex-1 px-3 py-2 text-xs border border-[#D4D4D8] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleSendTest}
                      disabled={isSendingTest || !testEmailAddress}
                      className="min-h-[38px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {isSendingTest ? 'Envoi...' : 'Envoyer un test'}
                    </button>
                  </div>
                </div>

                {/* Delivery Quick Feedback */}
                {testDeliveryStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${testDeliveryStatus.success
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold">
                      <span>
                        {testDeliveryStatus.success
                          ? '✅ Courriel de test transmis avec succès au serveur SMTP !'
                          : '❌ Échec de transmission du courriel :'}
                      </span>
                      {testDeliveryStatus.messageId && (
                        <span className="font-mono text-[10px] text-[#15803D] opacity-80">
                          ID: {testDeliveryStatus.messageId}
                        </span>
                      )}
                    </div>
                    {testDeliveryStatus.response && (
                      <p className="mt-1 font-mono text-[11px] text-[#15803D]">
                        Réponse serveur : {testDeliveryStatus.response}
                      </p>
                    )}
                    {testDeliveryStatus.error && (
                      <p className="mt-1 font-mono text-[11px] text-[#991B1B]">
                        {testDeliveryStatus.error}
                      </p>
                    )}
                  </div>
                )}

                {/* EXPANDABLE SMTP DEBUG & DIAGNOSTIC CONSOLE */}
                {showDebugConsole && (
                  <div className="bg-[#18181B] text-[#F4F4F5] rounded-xl p-4 space-y-3 font-mono text-xs border border-black shadow-inner animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                        <span className="font-bold text-white font-sans text-xs">
                          Console Diagnostic &amp; Logs SMTP (Mode Debug Actif)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={runSmtpDiagnostic}
                        disabled={isDiagnosing}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-semibold transition disabled:opacity-50"
                      >
                        {isDiagnosing ? 'Test en cours...' : '🧪 Tester la connexion SMTP'}
                      </button>
                    </div>

                    {smtpDiagnostic && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white/5 p-3 rounded-lg border border-white/10">
                        <div>
                          <span className="text-[#A1A1AA]">Statut : </span>
                          <span className={smtpDiagnostic.success ? 'text-[#34D399] font-bold' : 'text-[#F87171] font-bold'}>
                            {smtpDiagnostic.success ? 'Connecté & Vérifié (250 OK)' : 'Erreur de connexion'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">Hôte : </span>
                          <span>{smtpDiagnostic.host}:{smtpDiagnostic.port}</span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">Utilisateur : </span>
                          <span>{smtpDiagnostic.authUser}</span>
                        </div>
                        <div>
                          <span className="text-[#A1A1AA]">Expéditeur (From) : </span>
                          <span className="text-[#60A5FA]">{smtpDiagnostic.fromAddress}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-[11px] text-[#D4D4D8] max-h-40 overflow-y-auto bg-black/40 p-2.5 rounded border border-white/5">
                      <p className="text-[#71717A] text-[10px]">--- LOGS DU SERVEUR SMTP ---</p>
                      {testDebugLogs && testDebugLogs.map((log, idx) => (
                        <p key={`test-log-${idx}`} className={log.includes('❌') ? 'text-[#F87171]' : log.includes('Succès') ? 'text-[#34D399]' : 'text-[#D4D4D8]'}>
                          {log}
                        </p>
                      ))}
                      {smtpDiagnostic && smtpDiagnostic.logs.map((log, idx) => (
                        <p key={`diag-log-${idx}`} className={log.includes('❌') ? 'text-[#F87171]' : log.includes('✅') ? 'text-[#34D399]' : 'text-[#A1A1AA]'}>
                          {log}
                        </p>
                      ))}
                      {!testDebugLogs && !smtpDiagnostic && (
                        <p className="text-[#71717A] italic">
                          Cliquez sur &quot;Tester la connexion SMTP&quot; ou &quot;Envoyer un test&quot; pour afficher les logs de communication en direct.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Drawer Modal: View all files in Html_forms bucket */}
      {storageDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setStorageDrawerOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
              <div>
                <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                  <span>📁 Modèles enregistrés dans Supabase Storage</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#3B33FF]/10 text-[#3B33FF]">
                    bucket: Html_forms
                  </span>
                </h3>
                <p className="text-xs text-[#71717A]">
                  Chargez directement n’importe quel modèle HTML sauvegardé ou associez-le à un formulaire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStorageDrawerOpen(false)}
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E6DFD5]">
              {isLoadingStorage ? (
                <div className="p-8 text-center text-xs text-[#71717A]">Chargement des fichiers...</div>
              ) : storageTemplates.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs font-medium text-[#71717A]">
                    Aucun fichier HTML dans le bucket Supabase <code>Html_forms</code>.
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Générez un email puis cliquez sur &quot;Insérer dans le Bucket&quot; pour le stocker dans le cloud.
                  </p>
                </div>
              ) : (
                storageTemplates.map((t) => (
                  <div key={t.name} className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] rounded-lg transition">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold font-mono text-[#18181B] truncate">{t.name}</p>
                      <p className="text-[11px] text-[#71717A]">
                        Taille : {((t.size || 0) / 1024).toFixed(1)} Ko &bull; Mis à jour : {t.updated_at ? new Date(t.updated_at).toLocaleDateString('fr-FR') : 'Récemment'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadFromStorage(t.name)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] rounded-lg transition"
                      >
                        Charger
                      </button>
                      <button
                        type="button"
                        onClick={() => setFileToDelete(t.name)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition"
                        title="Supprimer du bucket"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between">
              <button
                type="button"
                onClick={refreshStorageList}
                className="text-xs font-semibold text-[#3B33FF] hover:underline flex items-center gap-1"
              >
                <span>↻</span>
                <span>Actualiser la liste</span>
              </button>
              <button
                type="button"
                onClick={() => setStorageDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#18181B] bg-[#FAF8F5] hover:bg-[#E6DFD5] rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Template Confirmation Modal */}
      {fileToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeletingFile) {
              setFileToDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#18181B] leading-tight">
                  Supprimer ce modèle d’email ?
                </h3>
                <p className="text-xs text-[#71717A]">
                  Cette action supprimera le fichier du bucket Supabase <code>Html_forms</code>.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl text-xs text-[#3F3F46]">
              Êtes-vous sûr de vouloir supprimer définitivement{' '}
              <strong className="text-[#18181B] font-mono">{fileToDelete}</strong> ?
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6DFD5]">
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-white border border-[#D4D4D8] hover:bg-[#FAF8F5] rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={handleConfirmDeleteFromStorage}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingFile ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
