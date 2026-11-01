'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  FormFieldRecord,
  FormRecord,
  FieldType,
  FormLayout,
  FormStatus,
  FormRole,
  TargetRoleDefinition,
  BankQuestionRecord,
  FieldOption,
} from '@/types/form';
import { saveFormAction, deleteFormAction } from '@/app/actions/formManagerActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showAdminToast } from '../AdminToast';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { RoleIcon, FieldTypeIcon } from '@/components/DynamicIcon';
import {
  Package,
  Settings,
  AlertTriangle,
  X,
  Check,
  Target,
  Inbox,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Plus,
} from 'lucide-react';

interface FormBuilderProps {
  initialForm?: FormRecord;
  initialFields?: FormFieldRecord[];
  isEditing?: boolean;
  availableRoles?: TargetRoleDefinition[];
  questionBank?: BankQuestionRecord[];
}

const FIXED_OFFICIAL_EMAIL = 'event@new-era-medical-club-univ-ouargla.dz';

const FIELD_TYPE_LABELS: Record<FieldType, { label: string; color: string }> = {
  short_text: { label: 'Texte court', color: '#3B33FF' },
  long_text: { label: 'Paragraphe', color: '#8B3EE1' },
  email: { label: 'Adresse email', color: '#2563EB' },
  phone: { label: 'Téléphone WhatsApp', color: '#059669' },
  number: { label: 'Nombre', color: '#D97706' },
  radio: { label: 'Choix unique', color: '#7C3AED' },
  checkboxes: { label: 'Cases à cocher', color: '#4F46E5' },
  select: { label: 'Menu déroulant', color: '#0D9488' },
  date: { label: 'Date', color: '#EA580C' },
  file: { label: 'Fichier / Justificatif', color: '#BE185D' },
  consent: { label: 'Consentement', color: '#15803D' },
};

export function FormBuilder({
  initialForm,
  initialFields = [],
  isEditing = false,
  availableRoles = [],
  questionBank = [],
}: FormBuilderProps) {
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
  const [closesAt, setClosesAt] = useState<string>(() => {
    if (!initialForm?.closes_at) return '';
    try {
      const d = new Date(initialForm.closes_at);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return '';
    }
  });

  // Target Roles State
  const allRoles = availableRoles || [];

  const [targetRoles, setTargetRoles] = useState<FormRole[]>(() => {
    if (initialForm?.target_roles && initialForm.target_roles.length > 0) {
      return initialForm.target_roles;
    }
    return [];
  });

  // Question Bank State
  const bank = questionBank || [];
  const [bankSearch, setBankSearch] = useState('');
  const [bankCategory, setBankCategory] = useState('all');
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);

  // Fields State
  const [fields, setFields] = useState<Array<Partial<FormFieldRecord>>>(() => {
    if (initialFields && initialFields.length > 0) {
      return initialFields;
    }
    return [];
  });

  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedBankItem, setDraggedBankItem] = useState<BankQuestionRecord | null>(null);
  const [activeDropPipeline, setActiveDropPipeline] = useState<string | null>(null);

  // Sync state if form/fields are loaded asynchronously
  useEffect(() => {
    if (isEditing && initialFields) {
      setFields(initialFields);
    }
  }, [initialFields, isEditing]);

  useEffect(() => {
    if (isEditing && initialForm) {
      setTitle(initialForm.title || '');
      setSlug(initialForm.slug || '');
      setDescription(initialForm.description || '');
      setLayout(initialForm.layout || 'stepped');
      setStatus(initialForm.status || 'open');
      setMaxResponses(initialForm.max_responses ? String(initialForm.max_responses) : '');
      if (initialForm.target_roles) {
        setTargetRoles(initialForm.target_roles);
      }
      if (initialForm.closes_at) {
        try {
          const d = new Date(initialForm.closes_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          setClosesAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
        } catch {}
      }
      if (initialForm.send_receipt !== undefined) {
        setSendReceipt(initialForm.send_receipt);
      }
      if (initialForm.custom_email_subject) {
        setCustomEmailSubject(initialForm.custom_email_subject);
      }
      if (initialForm.custom_email_html) {
        setCustomEmailHtml(initialForm.custom_email_html);
      }
    }
  }, [initialForm, isEditing]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  };

  // Add a role to the form
  const addRoleToForm = (roleDef: TargetRoleDefinition) => {
    if (targetRoles.some((r) => r.id === roleDef.id)) {
      return;
    }
    const newRole: FormRole = {
      id: roleDef.id,
      name: roleDef.name,
      description: roleDef.description,
      color: roleDef.color,
      icon: roleDef.icon,
    };
    setTargetRoles((prev) => [...prev, newRole]);
    showAdminToast({
      type: 'success',
      title: 'Public Cible Ajouté',
      message: `Le parcours de questions pour "${newRole.name}" est activé.`,
    });
  };

  // Remove a role from the form
  const removeRoleFromForm = (roleId: string) => {
    const roleToRemove = targetRoles.find((r) => r.id === roleId);
    setTargetRoles((prev) => prev.filter((r) => r.id !== roleId));
    // Also remove questions strictly assigned to this role
    setFields((prev) =>
      prev.filter((f) => !f.target_roles?.includes(roleId))
    );
    showAdminToast({
      type: 'info',
      title: 'Public Cible Retiré',
      message: `Le parcours pour "${roleToRemove?.name || roleId}" a été désactivé.`,
    });
  };

  // Add question to a specific role pipeline
  const addFieldToTarget = (roleId: string, type: FieldType = 'short_text') => {
    const key = `question_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    let defaultLabel = 'Nouvelle question';
    let defaultOptions: FieldOption[] | undefined = undefined;

    if (type === 'select' || type === 'radio' || type === 'checkboxes') {
      defaultLabel = 'Question à choix';
      defaultOptions = [
        { label: 'Option 1', value: 'opt_1' },
        { label: 'Option 2', value: 'opt_2' },
      ];
    } else if (type === 'consent') {
      defaultLabel = 'J’accepte le traitement de mes données.';
    }

    const newField: Partial<FormFieldRecord> = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      key,
      label: defaultLabel,
      required: true,
      options: defaultOptions,
      target_roles: [roleId],
    };

    setFields((prev) => [...prev, newField]);
    setExpandedFieldId(newField.id || null);
  };

  // Insert question from Bank into a target role pipeline
  const insertFromBank = (bankQuestion: BankQuestionRecord, roleId: string) => {
    const uniqueKey = `${bankQuestion.key}_${Date.now().toString(36).slice(-3)}`;
    const newField: Partial<FormFieldRecord> = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: bankQuestion.type,
      key: uniqueKey,
      label: bankQuestion.label,
      help_text: bankQuestion.help_text,
      placeholder: bankQuestion.placeholder,
      required: bankQuestion.required,
      options: bankQuestion.options ? [...bankQuestion.options] : [],
      validation: bankQuestion.validation ? { ...bankQuestion.validation } : {},
      target_roles: [roleId],
    };

    setFields((prev) => [...prev, newField]);
    const targetName =
      targetRoles.find((r) => r.id === roleId)?.name || 'ce profil';
    showAdminToast({
      type: 'success',
      title: 'Question Ajoutée',
      message: `"${bankQuestion.label}" a été ajoutée à ${targetName}.`,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: BankQuestionRecord) => {
    setDraggedBankItem(item);
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent, pipelineId: string) => {
    e.preventDefault();
    if (activeDropPipeline !== pipelineId) {
      setActiveDropPipeline(pipelineId);
    }
  };

  const handleDragLeave = () => {
    setActiveDropPipeline(null);
  };

  const handleDrop = (e: React.DragEvent, pipelineId: string) => {
    e.preventDefault();
    setActiveDropPipeline(null);
    if (draggedBankItem) {
      insertFromBank(draggedBankItem, pipelineId);
      setDraggedBankItem(null);
    }
  };

  // Update Field
  const updateField = (id: string, updates: Partial<FormFieldRecord>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Remove Field
  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Move Field within pipeline
  const moveField = (id: string, direction: 'up' | 'down') => {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    setFields((prev) => {
      const copy = [...prev];
      const item = copy.splice(idx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  // Save Form
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Le titre du formulaire est obligatoire.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!slug.trim()) {
      setError('L’adresse URL (slug) du formulaire est obligatoire.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (fields.length === 0) {
      setError('Le formulaire doit comporter au moins une question.');
      return;
    }

    startTransition(async () => {
      const payloadForm: Omit<FormRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string } = {
        ...(initialForm?.id ? { id: initialForm.id } : {}),
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        status,
        layout,
        confirmation_message: confirmationMessage,
        send_receipt: sendReceipt,
        receipt_email_field: receiptEmailField,
        notify_emails: [FIXED_OFFICIAL_EMAIL],
        max_responses: maxResponses ? parseInt(maxResponses, 10) : null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        custom_email_subject: customEmailSubject.trim() || null,
        custom_email_html: customEmailHtml.trim() || null,
        target_roles: targetRoles.length > 0 ? targetRoles : null,
      };

      const payloadFields: Array<Omit<FormFieldRecord, 'id' | 'form_id' | 'created_at'> & { id?: string }> =
        fields.map((f, idx) => ({
          ...(f.id && !f.id.startsWith('f_') ? { id: f.id } : {}),
          position: idx + 1,
          type: (f.type as FieldType) || 'short_text',
          key: (f.key || `field_${idx}`).trim(),
          label: (f.label || `Question ${idx + 1}`).trim(),
          help_text: f.help_text?.trim() || null,
          placeholder: f.placeholder?.trim() || null,
          required: f.required ?? true,
          options: f.options || [],
          validation: f.validation || {},
          show_if: f.show_if || null,
          target_roles: f.target_roles && f.target_roles.length > 0 ? f.target_roles : null,
        }));

      const res = await saveFormAction(payloadForm, payloadFields);

      if (res.success && res.slug) {
        showAdminToast({
          type: 'success',
          title: isEditing ? 'Formulaire mis à jour' : 'Formulaire créé avec succès',
          message: `Le formulaire "${title}" est enregistré.`,
        });
        router.push(`/admin`);
        router.refresh();
      } else {
        setError(res.error || 'Erreur lors de l’enregistrement.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Delete Form
  const handleDeleteForm = async () => {
    if (!initialForm?.slug) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteFormAction(initialForm.slug);
    if (res.success) {
      showAdminToast({
        type: 'success',
        title: 'Formulaire supprimé',
        message: 'Le formulaire a été supprimé définitivement.',
      });
      router.push('/admin');
      router.refresh();
    } else {
      setDeleteError(res.error || 'Erreur lors de la suppression.');
      setIsDeleting(false);
    }
  };

  // Categories in question bank
  const bankCategories = ['all', ...Array.from(new Set(bank.map((b) => b.category || 'Général')))];
  const filteredBank = bank.filter((b) => {
    const matchCat = bankCategory === 'all' || b.category === bankCategory;
    const matchSearch =
      !bankSearch.trim() ||
      b.label.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.key.toLowerCase().includes(bankSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* ===================================================================== */}
      {/* TOP HEADER & STICKY ACTION BAR                                        */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5] sticky top-0 bg-[#FAF6EE]/95 backdrop-blur-xs z-30 py-2">
        <div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] inline-flex items-center gap-1 mb-1 transition"
          >
            <span>←</span> <span>Retour aux formulaires</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
              {isEditing ? `Modifier : ${title || 'Formulaire'}` : 'Créer un formulaire'}
            </h1>
            {targetRoles.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#8B3EE1]/10 text-[#8B3EE1] border border-[#8B3EE1]/20">
                {targetRoles.length} profil(s) actif(s)
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Configurez les détails du formulaire, sélectionnez les publics cibles, et organisez vos questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Question Bank Drawer Trigger */}
          <button
            type="button"
            onClick={() => setBankDrawerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] bg-white text-xs font-bold text-[#18181B] hover:bg-[#FAF8F5] transition shadow-2xs flex items-center gap-2 cursor-pointer"
            title="Ouvrir la banque de questions prêtes à l'emploi"
          >
            <Package className="w-4 h-4 text-[#3B33FF]" />
            <span>Banque de questions ({bank.length})</span>
          </button>

          <Link
            href="/admin"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition"
          >
            Annuler
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="brand-gradient-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>Sauvegarder les modifications</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] font-semibold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </span>
          <button type="button" onClick={() => setError(null)} className="text-xs font-bold p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 1: INFORMATIONS DU FORMULAIRE (Always upfront and clear!)     */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#3B33FF]/10 text-[#3B33FF] flex items-center justify-center text-xs font-extrabold">
                1
              </span>
              <span>Informations principales du formulaire</span>
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Définissez le titre, la description et l&apos;accessibilité de votre formulaire.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E6DFD5] text-[#52525B]">
            Étape 1 sur 3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Title */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#18181B]">
              Titre du formulaire <span className="text-[#E53888]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="ex: Inscription : Conférence Médicale Annuelle 2026"
              required
              className="w-full min-h-[46px] px-4 py-2.5 text-base font-semibold text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          {/* Status */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#18181B]">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FormStatus)}
              className="w-full min-h-[46px] px-3.5 py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
            >
              <option value="open">Ouvert (Accepte les réponses)</option>
              <option value="draft">Brouillon (Non accessible)</option>
              <option value="closed">Clôturé (Formulaire fermé)</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-12 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#18181B]">
              Description ou consignes <span className="text-[#71717A] font-normal text-xs">(facultatif)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Indiquez les détails, consignes ou prérequis pour les participants..."
              className="w-full px-4 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
            />
          </div>
        </div>

        {/* Collapsible Advanced Settings */}
        <div className="pt-2 border-t border-[#E6DFD5]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-[#3B33FF] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
          >
            <span>
              {showAdvanced
                ? '− Masquer les paramètres avancés'
                : '+ Paramètres avancés (URL personnalisée, clôture automatique hh:mm:ss, accusé email...)'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD5] space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Custom URL Slug */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#18181B]">
                    Adresse URL publique (Slug) :
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 text-xs bg-[#E6DFD5]/50 border border-r-0 border-[#D4D4D8] rounded-l-xl text-[#71717A] font-mono select-none">
                      /f/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="mon-formulaire"
                      className="w-full px-3 py-2 text-xs font-mono border border-[#D4D4D8] rounded-r-xl bg-white focus:border-[#3B33FF]"
                    />
                  </div>
                </div>

                {/* Max Responses */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#18181B]">
                    Capacité maximale de candidatures :
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxResponses}
                    onChange={(e) => setMaxResponses(e.target.value)}
                    placeholder="Illimité (laisser vide)"
                    className="w-full px-3 py-2 text-xs border border-[#D4D4D8] rounded-xl bg-white focus:border-[#3B33FF]"
                  />
                </div>
              </div>

              {/* Automatic Deadline */}
              <div className="pt-3 border-t border-[#E6DFD5]">
                <CustomDateTimePicker
                  value={closesAt}
                  onChange={setClosesAt}
                  label="Date et heure de fin (Clôture automatique hh:mm:ss)"
                  helperText="Dès que cette date et cette heure précise (hh:mm:ss) sont atteintes, le formulaire se clôture automatiquement et refuse toute nouvelle candidature."
                />
              </div>

              {/* Receipts & Email Alerts */}
              <div className="pt-3 border-t border-[#E6DFD5] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendReceipt}
                    onChange={(e) => setSendReceipt(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3B33FF]"
                  />
                  <span className="text-xs font-bold text-[#18181B]">
                    Envoyer un accusé de réception par email au candidat
                  </span>
                </label>
                <p className="text-[11px] text-[#71717A]">
                  Email de notification interne du club : <strong>{FIXED_OFFICIAL_EMAIL}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: PUBLICS CIBLES & RÔLES (Click to enable/disable pipelines)  */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6DFD5]">
          <div>
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#8B3EE1]/10 text-[#8B3EE1] flex items-center justify-center text-xs font-extrabold">
                2
              </span>
              <span>À qui s&apos;adresse ce formulaire ? (Publics Cibles &amp; Rôles)</span>
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Cochez les catégories de personnes ciblées. Chaque profil sélectionné créera sa colonne de questions dédiée ci-dessous.
            </p>
          </div>

          <Link
            href="/admin/roles"
            target="_blank"
            className="text-xs font-semibold text-[#8B3EE1] hover:underline inline-flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gérer le catalogue des rôles</span>
            <span>↗</span>
          </Link>
        </div>

        {/* Roles Grid Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allRoles.map((role) => {
            const isEnabled = targetRoles.some((r) => r.id === role.id);
            const roleColor = role.color || '#3B33FF';
            return (
              <button
                type="button"
                key={role.id}
                onClick={() => {
                  if (isEnabled) {
                    removeRoleFromForm(role.id);
                  } else {
                    addRoleToForm(role);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                  isEnabled
                    ? 'bg-white shadow-sm ring-2'
                    : 'bg-[#FAF8F5]/60 hover:bg-white border-[#E6DFD5]'
                }`}
                style={{
                  borderColor: isEnabled ? roleColor : undefined,
                  boxShadow: isEnabled ? `0 0 0 1px ${roleColor}` : undefined,
                }}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold"
                    style={{ backgroundColor: `${roleColor}15`, color: roleColor }}
                  >
                    <RoleIcon name={role.icon} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#18181B] block truncate">
                      {role.name}
                    </span>
                    <span className="text-[11px] text-[#71717A] block line-clamp-1">
                      {role.description || 'Public cible'}
                    </span>
                  </div>
                </div>

                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    isEnabled ? 'text-white' : 'border border-[#D4D4D8] text-transparent'
                  }`}
                  style={{ backgroundColor: isEnabled ? roleColor : 'transparent' }}
                >
                  <Check className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>

        {targetRoles.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E6DFD5] text-xs text-[#52525B] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#8B3EE1] shrink-0" />
            <span>
              <strong>Sélectionnez au moins un rôle :</strong> Cochez les profils ciblés ci-dessus pour ouvrir leurs tableaux de questions dédiés.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#52525B] bg-[#8B3EE1]/5 p-3 rounded-xl border border-[#8B3EE1]/15">
            <Target className="w-4 h-4 text-[#8B3EE1] shrink-0" />
            <span>
              <strong>{targetRoles.length} parcours actif(s) :</strong> Les candidats verront un sélecteur sur le formulaire public pour choisir leur profil, et accéderont aux questions assignées à ce rôle.
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: PARCOURS & QUESTIONS (The visual Miro/Figma Board!)       */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center text-xs font-extrabold">
                3
              </span>
              <span>Parcours de questions ({fields.length} question{fields.length > 1 ? 's' : ''} au total)</span>
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Organisez vos questions par colonne. Glissez-déposez pour réordonner ou insérez directement depuis la Banque de Questions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setBankDrawerOpen(true)}
            className="px-4 py-2 rounded-xl border border-[#3B33FF]/30 bg-[#3B33FF]/5 text-xs font-bold text-[#3B33FF] hover:bg-[#3B33FF]/10 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Package className="w-4 h-4 text-[#3B33FF]" />
            <span>Ouvrir la Banque de questions ({bank.length})</span>
          </button>
        </div>

        {/* Horizontal Columns Canvas (Board) */}
        {targetRoles.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-dashed border-[#E6DFD5] rounded-2xl max-w-xl mx-auto my-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#8B3EE1]/10 text-[#8B3EE1] flex items-center justify-center">
              <Target className="w-6 h-6 text-[#8B3EE1]" />
            </div>
            <h3 className="text-base font-bold text-[#18181B]">Aucun profil cible sélectionné</h3>
            <p className="text-xs text-[#71717A] max-w-md mx-auto">
              Cochez ci-dessus les catégories concernées (ex. Étudiant, Médecin Résident, Professeur...) pour faire apparaître leur tableau de questions et y insérer vos questions par glisser-déposer.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-5 overflow-x-auto pb-6 pt-1 scrollbar-thin">
            {/* Dynamic Columns for Selected Roles */}
            {targetRoles.map((role) => {
              const roleFields = fields.filter((f) => f.target_roles?.includes(role.id));
              return (
                <PipelineColumn
                  key={role.id}
                  id={role.id}
                  title={role.name}
                  subtitle={role.description || 'Questions spécifiques à ce profil'}
                  icon={<RoleIcon name={role.icon} className="w-4 h-4" />}
                  color={role.color || '#3B33FF'}
                  fields={roleFields}
                  isDropActive={activeDropPipeline === role.id}
                  onDragOver={(e) => handleDragOver(e, role.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, role.id)}
                  onAddField={(type) => addFieldToTarget(role.id, type)}
                  onUpdateField={updateField}
                  onRemoveField={removeField}
                  onMoveField={moveField}
                  expandedFieldId={expandedFieldId}
                  setExpandedFieldId={setExpandedFieldId}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SLIDING DRAWER: QUESTION BANK                                         */}
      {/* ===================================================================== */}
      {bankDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setBankDrawerOpen(false)}
          />

          {/* Sliding Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E6DFD5] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E6DFD5] bg-[#FAF8F5]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Package className="w-5 h-5 text-[#3B33FF]" />
                    <div>
                      <h3 className="text-base font-bold text-[#18181B]">Banque de Questions</h3>
                      <p className="text-xs text-[#71717A]">{bank.length} questions réutilisables</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBankDrawerOpen(false)}
                    className="w-8 h-8 rounded-lg border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-xs flex items-center justify-center font-bold text-[#71717A] hover:text-[#18181B] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Rechercher une question..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                />

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 scrollbar-none">
                  {bankCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBankCategory(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                        bankCategory === c
                          ? 'bg-[#18181B] text-white shadow-2xs'
                          : 'bg-white text-[#71717A] border border-[#E6DFD5] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {c === 'all' ? 'Toutes' : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Body: Questions List */}
              <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
                {filteredBank.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#71717A]">
                    Aucune question trouvée.
                  </div>
                ) : (
                  filteredBank.map((bq) => {
                    const typeInfo = FIELD_TYPE_LABELS[bq.type] || {
                      label: bq.type,
                      color: '#3B33FF',
                    };
                    return (
                      <div
                        key={bq.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, bq)}
                        className="bg-white border border-[#E6DFD5] hover:border-[#3B33FF] rounded-xl p-3 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1.5 mb-1"
                              style={{
                                backgroundColor: `${typeInfo.color}15`,
                                color: typeInfo.color,
                              }}
                            >
                              <FieldTypeIcon type={bq.type} className="w-3 h-3" />
                              <span>{typeInfo.label}</span>
                            </span>
                            <h4 className="text-xs font-bold text-[#18181B] leading-snug">
                              {bq.label}
                            </h4>
                          </div>
                          <span className="text-[10px] text-[#71717A] font-mono">
                            {bq.key}
                          </span>
                        </div>

                        {/* Quick insertion toolbar */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-[#E6DFD5]/60 text-[11px]">
                          <span className="text-[#71717A] text-[10px]">Glisser vers colonne</span>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {targetRoles.length === 0 ? (
                              <span className="text-[10px] text-[#A1A1AA] italic">
                                Cochez un rôle ci-dessus
                              </span>
                            ) : (
                              targetRoles.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => insertFromBank(bq, r.id)}
                                  className="px-2 py-0.5 rounded font-bold text-[10px] transition cursor-pointer"
                                  style={{
                                    backgroundColor: `${r.color || '#8B3EE1'}15`,
                                    color: r.color || '#8B3EE1',
                                  }}
                                  title={`Ajouter au profil ${r.name}`}
                                >
                                  + {r.name.split(' ')[0]}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#E6DFD5] bg-[#FAF8F5] flex items-center justify-between">
                <Link
                  href="/admin/questions"
                  target="_blank"
                  className="text-xs font-bold text-[#3B33FF] hover:underline flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configurer la banque</span>
                  <span>↗</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setBankDrawerOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#E6DFD5] text-[#18181B] hover:bg-[#FAF8F5]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE FORM (Danger Zone)                                             */}
      {/* ===================================================================== */}
      {isEditing && initialForm?.slug && (
        <div className="p-5 border border-[#FECACA] bg-[#FEF2F2] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#991B1B] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span>Zone de danger : Supprimer ce formulaire</span>
            </h4>
            <p className="text-xs text-[#B91C1C] mt-0.5">
              Cette action supprimera définitivement le formulaire et toutes les candidatures associées.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            Supprimer le formulaire...
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#18181B]">
                Supprimer définitivement ce formulaire ?
              </h3>
              <p className="text-xs text-[#71717A]">
                Toutes les données associées seront effacées. Cette opération est irréversible.
              </p>
            </div>
            {deleteError && (
              <p className="text-xs text-[#DC2626] font-semibold text-center">{deleteError}</p>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteForm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs transition cursor-pointer"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: Pipeline Column (For each role or common questions)
// =============================================================================
interface PipelineColumnProps {
  id: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  color: string;
  fields: Array<Partial<FormFieldRecord>>;
  isDropActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAddField: (type: FieldType) => void;
  onUpdateField: (id: string, updates: Partial<FormFieldRecord>) => void;
  onRemoveField: (id: string) => void;
  onMoveField: (id: string, direction: 'up' | 'down') => void;
  expandedFieldId: string | null;
  setExpandedFieldId: (id: string | null) => void;
}

function PipelineColumn({
  title,
  subtitle,
  icon,
  color,
  fields,
  isDropActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddField,
  onUpdateField,
  onRemoveField,
  onMoveField,
  expandedFieldId,
  setExpandedFieldId,
}: PipelineColumnProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-80 sm:w-96 shrink-0 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs ${
        isDropActive
          ? 'ring-2 ring-[#3B33FF] bg-[#EEF2FF] border-[#3B33FF]'
          : 'bg-[#FAF8F5]/90 border-[#E6DFD5]'
      }`}
    >
      {/* Top Header with Color Stripe */}
      <div className="p-4 border-b border-[#E6DFD5] bg-white relative space-y-1">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color || '#3B33FF' }} />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold"
              style={{ backgroundColor: `${color}15`, color: color }}
            >
              {icon}
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#18181B] truncate">{title}</h3>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            {fields.length} question(s)
          </span>
        </div>

        <p className="text-[11px] text-[#71717A] line-clamp-1">{subtitle}</p>
      </div>

      {/* Column Questions List / Drop Zone */}
      <div className="p-3.5 space-y-2.5 flex-1 min-h-[220px]">
        {fields.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#D4D4D8] rounded-xl space-y-2 bg-white/60">
            <Inbox className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-[#18181B]">Glissez une question ici</p>
            <p className="text-[10px] text-[#71717A]">
              Ou cliquez ci-dessous pour ajouter une question à ce parcours.
            </p>
          </div>
        ) : (
          fields.map((field, idx) => {
            const fieldId = field.id || `f_${idx}`;
            const isExpanded = expandedFieldId === fieldId;
            const typeInfo = FIELD_TYPE_LABELS[field.type || 'short_text'] || {
              label: field.type || 'Texte',
              color: '#3B33FF',
            };

            return (
              <div
                key={fieldId}
                className="bg-white border border-[#E6DFD5] hover:border-[#3B33FF] rounded-xl p-3 shadow-2xs space-y-2 transition"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#18181B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0"
                      style={{
                        backgroundColor: `${typeInfo.color}15`,
                        color: typeInfo.color,
                      }}
                    >
                      <FieldTypeIcon type={field.type || 'short_text'} className="w-3 h-3" />
                      <span>{typeInfo.label}</span>
                    </span>
                    <span className="text-xs font-bold text-[#18181B] truncate">
                      {field.label || 'Question sans titre'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveField(fieldId, 'up')}
                      className="w-5 h-5 rounded border border-[#E6DFD5] text-[10px] flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF8F5] cursor-pointer"
                      title="Monter"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => onMoveField(fieldId, 'down')}
                      className="w-5 h-5 rounded border border-[#E6DFD5] text-[10px] flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF8F5] cursor-pointer"
                      title="Descendre"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedFieldId(isExpanded ? null : fieldId)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>{isExpanded ? 'Réduire' : 'Éditer'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveField(fieldId)}
                      className="w-5 h-5 rounded text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Inline Expanded Question Editor */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[#E6DFD5] space-y-2.5 text-xs animate-in fade-in duration-100">
                    <div>
                      <label className="block text-[11px] font-bold text-[#18181B] mb-0.5">
                        Intitulé de la question :
                      </label>
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => onUpdateField(fieldId, { label: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#D4D4D8] rounded-lg bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#18181B] mb-0.5">
                          Type :
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => onUpdateField(fieldId, { type: e.target.value as FieldType })}
                          className="w-full px-2 py-1 text-xs border border-[#D4D4D8] rounded-lg bg-white"
                        >
                          {Object.entries(FIELD_TYPE_LABELS).map(([t, info]) => (
                            <option key={t} value={t}>
                              {info.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18181B] mb-0.5">
                          Variable clé :
                        </label>
                        <input
                          type="text"
                          value={field.key || ''}
                          onChange={(e) => onUpdateField(fieldId, { key: e.target.value })}
                          className="w-full px-2 py-1 text-xs font-mono border border-[#D4D4D8] rounded-lg bg-[#FAF8F5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#18181B] mb-0.5">
                        Texte d&apos;aide (facultatif) :
                      </label>
                      <input
                        type="text"
                        value={field.help_text || ''}
                        onChange={(e) => onUpdateField(fieldId, { help_text: e.target.value })}
                        placeholder="Indication pour le candidat..."
                        className="w-full px-2.5 py-1 text-xs border border-[#D4D4D8] rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required ?? false}
                          onChange={(e) => onUpdateField(fieldId, { required: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-[#3B33FF]"
                        />
                        <span className="text-xs text-[#18181B] font-semibold">
                          Réponse obligatoire
                        </span>
                      </label>
                    </div>

                    {/* Options list for choices */}
                    {['radio', 'checkboxes', 'select'].includes(field.type || '') && (
                      <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E6DFD5] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#18181B]">Options :</span>
                          <button
                            type="button"
                            onClick={() => {
                              const opts = field.options || [];
                              const newOpt = {
                                label: `Option ${opts.length + 1}`,
                                value: `opt_${opts.length + 1}`,
                              };
                              onUpdateField(fieldId, { options: [...opts, newOpt] });
                            }}
                            className="text-[10px] font-bold text-[#3B33FF] hover:underline"
                          >
                            + Option
                          </button>
                        </div>
                        {(field.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const newOpts = [...(field.options || [])];
                                newOpts[optIdx] = { ...opt, label: e.target.value };
                                onUpdateField(fieldId, { options: newOpts });
                              }}
                              className="w-full px-2 py-0.5 text-xs bg-white border border-[#D4D4D8] rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                                onUpdateField(fieldId, { options: newOpts });
                              }}
                              className="text-[#DC2626] text-xs font-bold px-1 hover:opacity-80"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Column Footer: Quick Add Question */}
      <div className="p-3 border-t border-[#E6DFD5] bg-white relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-dashed border-[#3B33FF]/40 text-[#3B33FF] hover:bg-[#3B33FF]/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une question</span>
          </button>

          {showAddMenu && (
            <div className="absolute bottom-10 left-0 right-0 z-30 bg-white border border-[#E6DFD5] rounded-xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
                Choisir le type de champ :
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {Object.entries(FIELD_TYPE_LABELS).map(([t, info]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onAddField(t as FieldType);
                      setShowAddMenu(false);
                    }}
                    className="p-1.5 rounded-lg text-left hover:bg-[#FAF8F5] flex items-center gap-1.5 text-xs font-medium cursor-pointer transition"
                  >
                    <FieldTypeIcon type={t} className="w-3.5 h-3.5 text-[#3B33FF]" />
                    <span className="truncate">{info.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
