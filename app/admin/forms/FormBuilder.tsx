'use client';

import React, { useState, useTransition } from 'react';
import { FormFieldRecord, FormRecord, FieldType, FormLayout, FormStatus } from '@/types/form';
import { saveFormAction } from '@/app/actions/formManagerActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormBuilderProps {
  initialForm?: FormRecord;
  initialFields?: FormFieldRecord[];
  isEditing?: boolean;
}

export function FormBuilder({ initialForm, initialFields = [], isEditing = false }: FormBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form Metadata State
  const [title, setTitle] = useState(initialForm?.title || '');
  const [slug, setSlug] = useState(initialForm?.slug || '');
  const [description, setDescription] = useState(initialForm?.description || '');
  const [layout, setLayout] = useState<FormLayout>(initialForm?.layout || 'stepped');
  const [status, setStatus] = useState<FormStatus>(initialForm?.status || 'open');
  const [confirmationMessage, setConfirmationMessage] = useState(
    initialForm?.confirmation_message ||
      'Votre candidature a bien été enregistrée par le Club Médical New Era.'
  );
  const [sendReceipt, setSendReceipt] = useState(initialForm?.send_receipt ?? true);
  const [receiptEmailField, setReceiptEmailField] = useState(initialForm?.receipt_email_field || 'email');
  const [notifyEmails, setNotifyEmails] = useState(
    initialForm?.notify_emails ? initialForm.notify_emails.join(', ') : 'event@new-era-medical-club-univ-ouargla.dz'
  );
  const [maxResponses, setMaxResponses] = useState<string>(
    initialForm?.max_responses ? String(initialForm.max_responses) : ''
  );

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
        label: 'Numéro de téléphone',
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
        label: 'J’accepte le traitement de mes données par le Club Médical New Era.',
        required: true,
      },
    ];
  });

  // Slug auto-generation helper
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

  // Add a new question field
  const addField = (type: FieldType = 'short_text') => {
    const nextIndex = fields.length + 1;
    const key = `champ_${Date.now().toString(36)}`;

    let defaultLabel = 'Nouveau champ';
    let defaultOptions = undefined;

    if (type === 'select' || type === 'radio' || type === 'checkboxes') {
      defaultLabel = 'Question à choix';
      defaultOptions = [
        { label: 'Option 1', value: 'opt_1' },
        { label: 'Option 2', value: 'opt_2' },
      ];
    } else if (type === 'consent') {
      defaultLabel = 'J’accepte le règlement et les conditions.';
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

  // Update field property
  const updateField = (index: number, patch: Partial<FormFieldRecord>) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
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

  const updateOption = (fieldIndex: number, optionIndex: number, label: string, value: string) => {
    const field = fields[fieldIndex];
    const currentOptions = [...(field.options || [])];
    currentOptions[optionIndex] = { label, value };
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
      setError('Veuillez ajouter au moins un champ de question.');
      return;
    }

    const emailList = notifyEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

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
        notify_emails: emailList,
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
        router.push('/admin');
        router.refresh();
      } else {
        setError(res.error || 'Erreur lors de l’enregistrement.');
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-[#52525B] hover:text-[#18181B]">
            ← Retour aux formulaires
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] mt-1">
            {isEditing ? `Modifier : ${initialForm?.title}` : 'Créer un nouveau formulaire'}
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5">
            Configurez vos questions et vos options directement depuis le navigateur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="min-h-[44px] px-4 py-2 border border-[#E6DFD5] rounded-lg text-xs sm:text-sm font-semibold text-[#18181B] bg-white hover:bg-[#FAF8F5] transition flex items-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="brand-gradient-btn min-h-[44px] px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50"
          >
            {isPending ? 'Enregistrement...' : isEditing ? 'Sauvegarder les modifications' : 'Publier le formulaire'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-sm font-medium text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* 1. Form Settings Card */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#18181B] pb-3 border-b border-[#E6DFD5]">
          1. Paramètres généraux du formulaire
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Titre du formulaire (obligatoire)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex. Recrutement Pôle Humanitaire 2026"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Slug URL (identifiant web unique)
            </label>
            <div className="flex items-center">
              <span className="text-xs text-[#71717A] bg-[#FAF8F5] px-3 min-h-[46px] flex items-center border border-r-0 border-[#D4D4D8] rounded-l-lg select-none">
                /f/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="recrutement-humanitaire"
                className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-r-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Statut du formulaire
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FormStatus)}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            >
              <option value="open">Ouvert (Accepte les réponses)</option>
              <option value="draft">Brouillon (Non accessible au public)</option>
              <option value="closed">Clôturé (Message de fermeture affiché)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Format d’affichage
            </label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as FormLayout)}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            >
              <option value="stepped">Par étapes (Une question à la fois — Recommandé pour mobile)</option>
              <option value="single">Page unique (Tous les champs visibles ensemble)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Capacité maximale de réponses (facultatif)
            </label>
            <input
              type="number"
              min="1"
              value={maxResponses}
              onChange={(e) => setMaxResponses(e.target.value)}
              placeholder="Ex. 50 (laisser vide si illimité)"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Description ou instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Formulaire officiel d'inscription pour l'année universitaire 2026..."
              className="w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Message de confirmation après envoi
            </label>
            <input
              type="text"
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              placeholder="Votre candidature a bien été enregistrée."
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1">
              Emails de notification pour l’équipe (séparés par une virgule)
            </label>
            <input
              type="text"
              value={notifyEmails}
              onChange={(e) => setNotifyEmails(e.target.value)}
              placeholder="event@new-era-medical-club-univ-ouargla.dz, admin@neweraecos.dz"
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendReceipt}
                onChange={(e) => setSendReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF]"
              />
              <span className="ml-2 text-xs sm:text-sm font-semibold text-[#18181B]">
                Envoyer automatiquement un accusé de réception par email au candidat
              </span>
            </label>

            {sendReceipt && (
              <div className="pl-6">
                <label className="block text-xs font-semibold text-[#52525B] mb-1">
                  Clé du champ contenant l’email du candidat
                </label>
                <input
                  type="text"
                  value={receiptEmailField}
                  onChange={(e) => setReceiptEmailField(e.target.value)}
                  placeholder="email"
                  className="w-48 min-h-[38px] px-3 py-1.5 text-xs font-mono text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Form Fields Editor */}
      <div className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">
              2. Questions du formulaire ({fields.length})
            </h2>
            <p className="text-xs text-[#52525B]">
              Organisez vos questions dans l’ordre d’apparition.
            </p>
          </div>

          {/* Quick Add Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#71717A]">Ajouter :</span>
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
              + Texte long
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
              + Cases multiples
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

        {/* Fields List */}
        <div className="space-y-4">
          {fields.map((field, idx) => {
            const hasOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkboxes';

            return (
              <div
                key={field.id || idx}
                className="border border-[#E6DFD5] bg-[#FAF8F5]/50 rounded-xl p-4 sm:p-6 space-y-4 relative"
              >
                {/* Header Row: Position + Label + Actions */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6DFD5]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase text-[#52525B]">
                      Type: <code>{field.type}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                      className="w-7 h-7 rounded border border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] text-xs font-bold flex items-center justify-center hover:bg-[#FEE2E2] ml-2"
                      title="Supprimer ce champ"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Configuration Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Intitulé de la question (Label)
                    </label>
                    <input
                      type="text"
                      required
                      value={field.label || ''}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Type de champ
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    >
                      <option value="short_text">Texte court</option>
                      <option value="long_text">Texte long / Paragraphe</option>
                      <option value="email">Adresse email</option>
                      <option value="phone">Téléphone</option>
                      <option value="number">Nombre</option>
                      <option value="select">Menu déroulant (Select)</option>
                      <option value="radio">Choix unique (Radio)</option>
                      <option value="checkboxes">Choix multiples (Checkboxes)</option>
                      <option value="date">Date</option>
                      <option value="file">Fichier / Justificatif</option>
                      <option value="consent">Case de consentement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Clé technique (unique)
                    </label>
                    <input
                      type="text"
                      required
                      value={field.key || ''}
                      onChange={(e) => updateField(idx, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="w-full min-h-[42px] px-3 py-2 text-xs font-mono text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Texte d’aide / Instruction (facultatif)
                    </label>
                    <input
                      type="text"
                      value={field.help_text || ''}
                      onChange={(e) => updateField(idx, { help_text: e.target.value })}
                      placeholder="Ex. Format PDF max 5 Mo"
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF]"
                    />
                  </div>
                </div>

                {/* Options Editor for Choice Fields */}
                {hasOptions && (
                  <div className="bg-white p-3.5 rounded-lg border border-[#E6DFD5] space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#18181B]">
                        Options de réponse :
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
                            placeholder="Libellé de l'option"
                            onChange={(e) => updateOption(idx, optIdx, e.target.value, opt.value)}
                            className="flex-1 min-h-[36px] px-2.5 py-1 text-xs text-[#18181B] border border-[#D4D4D8] rounded"
                          />
                          <input
                            type="text"
                            value={opt.value}
                            placeholder="Valeur code"
                            onChange={(e) => updateOption(idx, optIdx, opt.label, e.target.value)}
                            className="w-32 min-h-[36px] px-2.5 py-1 text-xs font-mono text-[#52525B] border border-[#D4D4D8] rounded"
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

                {/* Footer of question: required toggle */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center cursor-pointer text-xs font-semibold text-[#18181B]">
                    <input
                      type="checkbox"
                      checked={field.required ?? false}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8] focus:ring-[#3B33FF]"
                    />
                    <span className="ml-2">Champ obligatoire</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Add Field Button */}
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

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4">
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
          {isPending ? 'Enregistrement en cours...' : isEditing ? 'Sauvegarder les modifications' : 'Publier le formulaire'}
        </button>
      </div>
    </form>
  );
}
