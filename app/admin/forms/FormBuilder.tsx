'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { FormFieldRecord, FormRecord, FieldType, FormLayout, FormStatus } from '@/types/form';
import { saveFormAction, deleteFormAction } from '@/app/actions/formManagerActions';
import {
  listHtmlTemplatesAction,
  getHtmlTemplateContentAction,
} from '@/app/actions/htmlStorageActions';
import { HtmlStorageItem } from '@/lib/supabase/html-storage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showAdminToast } from '../AdminToast';

interface FormBuilderProps {
  initialForm?: FormRecord;
  initialFields?: FormFieldRecord[];
  isEditing?: boolean;
}

const FIXED_OFFICIAL_EMAIL = 'event@new-era-medical-club-univ-ouargla.dz';

export function FormBuilder({ initialForm, initialFields = [], isEditing = false }: FormBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form Metadata State
  const [title, setTitle] = useState(initialForm?.title || '');
  const [slug, setSlug] = useState(initialForm?.slug || '');
  const [description, setDescription] = useState(initialForm?.description || '');
  const [layout, setLayout] = useState<FormLayout>(initialForm?.layout || 'stepped');
  const [status, setStatus] = useState<FormStatus>(initialForm?.status || 'open');
  const confirmationMessage =
    initialForm?.confirmation_message ||
    'Votre candidature a bien été enregistrée par le New Era Medical Club.';
  const [sendReceipt, setSendReceipt] = useState(initialForm?.send_receipt ?? true);
  const receiptEmailField = initialForm?.receipt_email_field || 'email';
  const [customEmailSubject, setCustomEmailSubject] = useState(initialForm?.custom_email_subject || '');
  const [customEmailHtml, setCustomEmailHtml] = useState(initialForm?.custom_email_html || '');
  const [maxResponses, setMaxResponses] = useState<string>(
    initialForm?.max_responses ? String(initialForm.max_responses) : ''
  );

  // Storage Templates from Supabase 'Html_forms' bucket
  const [storageTemplates, setStorageTemplates] = useState<HtmlStorageItem[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [showRawHtmlEditor, setShowRawHtmlEditor] = useState(false);

  useEffect(() => {
    let mounted = true;
    listHtmlTemplatesAction().then((res) => {
      if (mounted && res.success && res.templates) {
        setStorageTemplates(res.templates);
      }
      if (mounted) setIsLoadingTemplates(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectTemplate = async (templateName: string) => {
    setSelectedTemplateName(templateName);
    if (!templateName) {
      setCustomEmailHtml('');
      return;
    }
    const res = await getHtmlTemplateContentAction(templateName);
    if (res.success && res.html) {
      setCustomEmailHtml(res.html);
      if (!customEmailSubject) {
        setCustomEmailSubject(`Confirmation — ${title || 'New Era Medical Club'}`);
      }
    }
  };

  // Fields State
  const [fields, setFields] = useState<Array<Partial<FormFieldRecord>>>(() => {
    if (initialFields && initialFields.length > 0) {
      return initialFields;
    }
    return [
      {
        id: 'f_1',
        type: 'short_text',
        key: 'full_name',
        label: 'Nom complet',
        help_text: 'Prénom et nom de famille',
        placeholder: 'Ex. Sarah Benali',
        required: true,
      },
      {
        id: 'f_2',
        type: 'email',
        key: 'email',
        label: 'Adresse email',
        help_text: 'Pour les communications et confirmations',
        placeholder: 'sarah.benali@example.com',
        required: true,
      },
      {
        id: 'f_3',
        type: 'phone',
        key: 'phone',
        label: 'Numéro de téléphone (WhatsApp)',
        placeholder: '0550 00 00 00',
        required: true,
      },
      {
        id: 'f_4',
        type: 'long_text',
        key: 'motivation',
        label: 'Motivation',
        help_text: 'Pourquoi souhaitez-vous participer ?',
        required: true,
        validation: { minLength: 20 },
      },
      {
        id: 'f_5',
        type: 'consent',
        key: 'consent',
        label: 'J’accepte le traitement de mes données par le New Era Medical Club.',
        required: true,
      },
    ];
  });

  // Slug auto-generation helper from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  };

  // Add question with auto-key
  const addField = (type: FieldType = 'short_text') => {
    const nextIndex = fields.length + 1;
    const key = `question_${Date.now().toString(36)}`;

    let defaultLabel = 'Nouvelle question';
    let defaultOptions = undefined;

    if (type === 'select' || type === 'radio' || type === 'checkboxes') {
      defaultLabel = 'Question à choix';
      defaultOptions = [
        { label: 'Option 1', value: 'opt_1' },
        { label: 'Option 2', value: 'opt_2' },
      ];
    } else if (type === 'consent') {
      defaultLabel = 'J’accepte le règlement du club.';
    }

    setFields([
      ...fields,
      {
        id: `f_${Date.now()}`,
        position: nextIndex,
        type,
        key,
        label: defaultLabel,
        help_text: '',
        placeholder: '',
        required: true,
        options: defaultOptions,
        validation: {},
      },
    ]);
  };

  // Remove field
  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Move field up/down
  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFields(updated);
  };

  // Update field property with auto-key generation if key is default
  const updateField = (index: number, patch: Partial<FormFieldRecord>) => {
    setFields((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], ...patch };

      // If label changed and key was auto-generated, auto-update key silently
      if (patch.label && (!target.key || target.key.startsWith('question_') || target.key.startsWith('champ_'))) {
        const slugKey = patch.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 30);
        if (slugKey) {
          target.key = slugKey;
        }
      }

      updated[index] = target;
      return updated;
    });
  };

  // Options editor for select / radio / checkboxes
  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const currentOptions = field.options || [];
    const nextNum = currentOptions.length + 1;
    updateField(fieldIndex, {
      options: [...currentOptions, { label: `Option ${nextNum}`, value: `opt_${Date.now().toString(36)}` }],
    });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, label: string) => {
    const field = fields[fieldIndex];
    const currentOptions = [...(field.options || [])];
    const val = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    currentOptions[optionIndex] = { label, value: val || `opt_${optionIndex + 1}` };
    updateField(fieldIndex, { options: currentOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const currentOptions = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options: currentOptions });
  };

  // Submit & Save Form
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Veuillez saisir un titre pour le formulaire.');
      return;
    }

    if (!slug.trim()) {
      setError('Veuillez saisir un slug URL valide.');
      return;
    }

    if (fields.length === 0) {
      setError('Veuillez ajouter au moins une question.');
      return;
    }

    startTransition(async () => {
      const formPayload: Omit<FormRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string } = {
        id: initialForm?.id,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        status,
        layout,
        confirmation_message: confirmationMessage.trim(),
        send_receipt: sendReceipt,
        receipt_email_field: receiptEmailField.trim() || 'email',
        custom_email_subject: customEmailSubject.trim() || null,
        custom_email_html: customEmailHtml.trim() || null,
        // Strictly locked to the official club email
        notify_emails: [FIXED_OFFICIAL_EMAIL],
        max_responses: maxResponses ? parseInt(maxResponses, 10) : null,
      };

      const fieldsPayload = fields.map((f, i) => ({
        id: f.id,
        position: i + 1,
        type: f.type || 'short_text',
        key: f.key || `field_${i + 1}`,
        label: f.label || 'Sans titre',
        help_text: f.help_text || null,
        placeholder: f.placeholder || null,
        required: f.required ?? false,
        options: f.options || [],
        validation: f.validation || {},
        show_if: f.show_if || null,
      }));

      const res = await saveFormAction(formPayload, fieldsPayload);
      if (res.success) {
        showAdminToast({
          type: 'success',
          title: isEditing ? 'Formulaire mis à jour' : 'Formulaire créé',
          message: `Le formulaire "${title}" a été enregistré avec succès.`,
        });
        router.push('/admin');
        router.refresh();
      } else {
        setError(res.error || 'Erreur lors de l’enregistrement.');
      }
    });
  };

  // Close delete modal on Escape
  useEffect(() => {
    if (!showDeleteModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, isDeleting]);

  const handleDeleteForm = async () => {
    if (!initialForm?.slug) return;
    setDeleteError(null);
    setIsDeleting(true);
    const res = await deleteFormAction(initialForm.slug);
    setIsDeleting(false);
    if (res.success) {
      setShowDeleteModal(false);
      showAdminToast({
        type: 'success',
        title: 'Formulaire supprimé',
        message: `Le formulaire "${title}" a été supprimé définitivement. Toutes les candidatures associées ont été effacées.`,
      });
      router.push('/admin');
      router.refresh();
    } else {
      setDeleteError(res.error || 'Erreur lors de la suppression.');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-[#52525B] hover:text-[#18181B]">
            ← Retour aux formulaires
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] mt-1">
            {isEditing ? `Modifier : ${initialForm?.title}` : 'Créer un formulaire'}
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5">
            Interface simplifiée pour créer et mettre à jour vos formulaires sans programmation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isEditing && initialForm?.slug && (
            <button
              type="button"
              disabled={isPending || isDeleting}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="min-h-[44px] px-3.5 py-2 border border-[#FCA5A5] text-[#DC2626] rounded-lg text-xs sm:text-sm font-semibold bg-white hover:bg-[#FEF2F2] transition flex items-center gap-1.5 disabled:opacity-50"
              title="Supprimer définitivement ce formulaire"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Supprimer</span>
            </button>
          )}
          <Link
            href="/admin"
            className="min-h-[44px] px-4 py-2 border border-[#E6DFD5] rounded-lg text-xs sm:text-sm font-semibold text-[#18181B] bg-white hover:bg-[#FAF8F5] transition flex items-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="brand-gradient-btn min-h-[44px] px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
          >
            {isPending ? 'Enregistrement...' : isEditing ? 'Sauvegarder' : 'Publier le formulaire'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-sm font-medium text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* 1. Form Information Card */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-[#18181B]">1. Informations du formulaire</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Titre du formulaire
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex. Recrutement Pôle Scientifique 2026"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Description ou consignes (facultatif)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez brièvement l'objet de ce formulaire..."
              className="w-full px-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FormStatus)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
              >
                <option value="open">Ouvert (Accepte les réponses)</option>
                <option value="draft">Brouillon (Non accessible aux étudiants)</option>
                <option value="closed">Clôturé (Formulaire fermé)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
                Format d’affichage
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as FormLayout)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
              >
                <option value="stepped">Format optimisé (Mobile : 3 par 3 &bull; PC : 2 côtés compact)</option>
                <option value="single">Page unique classique</option>
              </select>
            </div>
          </div>

          {/* Locked Official Club Email Badge */}
          <div className="flex items-center gap-2 p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
            <div className="text-xs text-[#52525B]">
              Email de réception des alertes (fixe et sécurisé) :{' '}
              <strong className="text-[#18181B] font-mono">{FIXED_OFFICIAL_EMAIL}</strong>
            </div>
          </div>

          {/* Toggle for Advanced Settings */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-[#3B33FF] hover:underline inline-flex items-center gap-1"
            >
              {showAdvanced ? '− Masquer les paramètres avancés' : '+ Afficher les paramètres avancés (URL, accusé, limites)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">
                  Adresse URL du formulaire
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-[#71717A] bg-white px-3 min-h-[42px] flex items-center border border-r-0 border-[#D4D4D8] rounded-l-lg select-none">
                    /f/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full min-h-[42px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-r-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Capacité maximale de candidatures (facultatif)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxResponses}
                    onChange={(e) => setMaxResponses(e.target.value)}
                    placeholder="Illimité"
                    className="w-full min-h-[42px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Accusé de réception par email
                  </label>
                  <label className="flex items-center cursor-pointer min-h-[42px]">
                    <input
                      type="checkbox"
                      checked={sendReceipt}
                      onChange={(e) => setSendReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8]"
                    />
                    <span className="ml-2 text-xs text-[#18181B]">Envoyer un accusé au candidat</span>
                  </label>
                </div>
              </div>

              {/* Custom AI Email Template Option (via Supabase Storage Html_forms) */}
              <div className="pt-3 border-t border-[#E6DFD5] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                      <span>Modèle d’email officiel (Bucket Supabase <code>Html_forms</code>)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3B33FF]/10 text-[#3B33FF]">
                        Sans code HTML
                      </span>
                    </label>
                    <p className="text-[11px] text-[#71717A]">
                      On n’insère pas de code HTML manuellement : sélectionnez simplement un modèle prêt à l’emploi stocké dans le cloud.
                    </p>
                  </div>
                  <Link
                    href="/admin/emails"
                    target="_blank"
                    className="text-xs font-semibold text-[#3B33FF] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>✨ Studio IA Gemini</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>

                {/* Template Selector Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Choisir un modèle dans <code>Html_forms</code> :
                  </label>
                  <select
                    value={selectedTemplateName}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    disabled={isLoadingTemplates}
                    className="w-full min-h-[42px] px-3 py-2 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-1 focus:ring-[#3B33FF]"
                  >
                    <option value="">
                      -- Accusé de réception standard New Era Club (Par défaut) --
                    </option>
                    {storageTemplates.map((item) => (
                      <option key={item.name} value={item.name}>
                        ✉ {item.name} ({Math.round((item.size || 0) / 1024)} Ko)
                      </option>
                    ))}
                  </select>
                  {isLoadingTemplates && (
                    <p className="text-[11px] text-[#A1A1AA] mt-1">Chargement des modèles depuis Supabase Storage...</p>
                  )}
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Objet de l’email envoyé au candidat :
                  </label>
                  <input
                    type="text"
                    value={customEmailSubject}
                    onChange={(e) => setCustomEmailSubject(e.target.value)}
                    placeholder="Ex. Confirmation d'inscription — Simulation ECOS 2026"
                    className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
                  />
                </div>

                {/* Active Template Status Card */}
                {customEmailHtml ? (
                  <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                        <span className="text-xs font-bold text-[#18181B]">
                          Modèle HTML actif pour ce formulaire
                        </span>
                        {selectedTemplateName && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E6DFD5] text-[#52525B]">
                            {selectedTemplateName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#3B33FF] bg-white border border-[#E6DFD5] rounded-md hover:bg-[#FAF8F5] transition"
                        >
                          👁️ Aperçu visuel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomEmailHtml('');
                            setSelectedTemplateName('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#DC2626] hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>

                    {/* Toggle raw HTML */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowRawHtmlEditor(!showRawHtmlEditor)}
                        className="text-[11px] text-[#71717A] hover:text-[#18181B] underline"
                      >
                        {showRawHtmlEditor ? 'Masquer le code HTML brut' : 'Inspecter / modifier le code HTML brut (avancé)'}
                      </button>
                      {showRawHtmlEditor && (
                        <textarea
                          rows={4}
                          value={customEmailHtml}
                          onChange={(e) => setCustomEmailHtml(e.target.value)}
                          className="w-full mt-2 px-3 py-1.5 text-[11px] font-mono text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#71717A] italic">
                    Aucun template HTML sélectionné. Le candidat recevra l’email officiel standard émis par <code>event@new-era-medical-club-univ-ouargla.dz</code>.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Questions List Card */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">
              2. Questions du formulaire ({fields.length})
            </h2>
            <p className="text-xs text-[#52525B]">
              Ajoutez vos questions et organisez-les facilement.
            </p>
          </div>

          {/* Quick Add Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#71717A] mr-1">Ajouter :</span>
            <button
              type="button"
              onClick={() => addField('short_text')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Texte
            </button>
            <button
              type="button"
              onClick={() => addField('long_text')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Paragraphe
            </button>
            <button
              type="button"
              onClick={() => addField('radio')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Choix unique
            </button>
            <button
              type="button"
              onClick={() => addField('checkboxes')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Cases à cocher
            </button>
            <button
              type="button"
              onClick={() => addField('select')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Menu déroulant
            </button>
            <button
              type="button"
              onClick={() => addField('file')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Fichier
            </button>
            <button
              type="button"
              onClick={() => addField('consent')}
              className="px-2.5 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E6DFD5] hover:bg-white rounded transition"
            >
              + Consentement
            </button>
          </div>
        </div>

        {/* Questions Cards */}
        <div className="space-y-4">
          {fields.map((field, idx) => {
            const hasOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkboxes';

            return (
              <div
                key={field.id || idx}
                className="border border-[#E6DFD5] bg-[#FAF8F5]/50 rounded-xl p-4 sm:p-5 space-y-3 relative"
              >
                {/* Header: Position & Action Controls */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E6DFD5]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#52525B]">
                      {field.label || 'Question'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveField(idx, 'up')}
                      className="w-7 h-7 rounded border border-[#E6DFD5] bg-white text-xs flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF8F5]"
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => moveField(idx, 'down')}
                      className="w-7 h-7 rounded border border-[#E6DFD5] bg-white text-xs flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF8F5]"
                      title="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="w-7 h-7 rounded border border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] text-xs font-bold flex items-center justify-center hover:bg-[#FEE2E2] ml-1.5"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Question Properties */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Intitulé de la question
                    </label>
                    <input
                      type="text"
                      required
                      value={field.label || ''}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      placeholder="Ex. Quelle est votre année d'études ?"
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Type de réponse
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                      className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    >
                      <option value="short_text">Texte court</option>
                      <option value="long_text">Texte long / Paragraphe</option>
                      <option value="email">Adresse email</option>
                      <option value="phone">Téléphone</option>
                      <option value="number">Nombre</option>
                      <option value="radio">Choix unique (Boutons radio)</option>
                      <option value="checkboxes">Choix multiples (Cases à cocher)</option>
                      <option value="select">Menu déroulant (Select)</option>
                      <option value="date">Date</option>
                      <option value="file">Fichier / Justificatif</option>
                      <option value="consent">Case de consentement</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Texte d’aide ou indication (facultatif)
                    </label>
                    <input
                      type="text"
                      value={field.help_text || ''}
                      onChange={(e) => updateField(idx, { help_text: e.target.value })}
                      placeholder="Ex. Indiquez votre promotion pour l'année universitaire en cours."
                      className="w-full min-h-[38px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
                    />
                  </div>
                </div>

                {/* Options List for Choice Fields */}
                {hasOptions && (
                  <div className="bg-white p-3.5 rounded-lg border border-[#E6DFD5] space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#18181B]">
                        Options proposées :
                      </span>
                      <button
                        type="button"
                        onClick={() => addOption(idx)}
                        className="text-xs font-semibold text-[#3B33FF] hover:underline"
                      >
                        + Ajouter une option
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(field.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.label}
                            placeholder="Libellé de l'option (ex. 1ère Année)"
                            onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                            className="flex-1 min-h-[36px] px-3 py-1 text-xs text-[#18181B] border border-[#D4D4D8] rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(idx, optIdx)}
                            className="w-7 h-7 text-xs text-[#DC2626] hover:bg-[#FEF2F2] rounded"
                            title="Supprimer option"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center cursor-pointer text-xs font-semibold text-[#18181B]">
                    <input
                      type="checkbox"
                      checked={field.required ?? false}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8]"
                    />
                    <span className="ml-2">Cette question est obligatoire</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Question Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => addField('short_text')}
            className="w-full py-3.5 border-2 border-dashed border-[#D4D4D8] hover:border-[#3B33FF] rounded-xl text-xs sm:text-sm font-semibold text-[#52525B] hover:text-[#3B33FF] bg-[#FAF8F5] hover:bg-[#3B33FF]/5 transition"
          >
            + Ajouter une nouvelle question
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/admin"
          className="min-h-[48px] px-6 py-2.5 border border-[#E6DFD5] rounded-lg text-sm font-semibold text-[#18181B] bg-white hover:bg-[#FAF8F5] transition flex items-center"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="brand-gradient-btn min-h-[48px] px-8 py-3 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : isEditing ? 'Sauvegarder les modifications' : 'Publier le formulaire'}
        </button>
      </div>

      {/* Danger Zone: Form Deletion (Edit Mode Only) */}
      {isEditing && initialForm?.slug && (
        <div className="bg-[#FEF2F2]/40 border border-[#FEE2E2] rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#DC2626] flex items-center gap-2">
                <span>⚠️</span>
                <span>Zone de danger : Supprimer ce formulaire</span>
              </h3>
              <p className="text-xs text-[#71717A] max-w-xl">
                Cette action supprimera définitivement le formulaire et toutes les candidatures collectées. Cette action est irréversible.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || isDeleting}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-[#FCA5A5] hover:bg-[#FEF2F2] rounded-lg transition shrink-0 disabled:opacity-50"
            >
              Supprimer le formulaire...
            </button>
          </div>
        </div>
      )}

      {/* Modern High-End Delete Confirmation Modal (Replaces browser default confirm) */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-form-dialog-title"
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
                <h3 id="delete-form-dialog-title" className="text-base font-bold text-[#18181B] leading-tight">
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
            </div>

            {/* Error Message if deletion fails */}
            {deleteError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg text-xs text-[#DC2626] font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{deleteError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6DFD5]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-white border border-[#D4D4D8] hover:bg-[#FAF8F5] rounded-lg transition"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteForm}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
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

      {/* Modal Preview for Email Template */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B33FF]" />
                <span className="text-xs font-bold text-[#18181B]">
                  Aperçu du modèle d’email : {selectedTemplateName || 'Modèle actif'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] px-2 py-1"
              >
                ✕ Fermer
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#F0E8DB]">
              <iframe
                title="Aperçu email"
                srcDoc={customEmailHtml}
                className="w-full h-[500px] rounded-lg border border-[#E3D8C6] bg-white shadow-xs"
                sandbox="allow-same-origin"
              />
            </div>
            <div className="px-5 py-3 border-t border-[#E6DFD5] flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-[#27272A] transition"
              >
                Fermer l’aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
