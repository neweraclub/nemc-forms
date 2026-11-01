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
import { saveTargetRoleAction } from '@/app/actions/roleActions';
import { saveQuestionBankAction } from '@/app/actions/questionBankActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showAdminToast } from '../AdminToast';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { DEFAULT_TARGET_ROLES, DEFAULT_QUESTION_BANK } from '@/lib/supabase/cloud-registry';

interface FormBuilderProps {
  initialForm?: FormRecord;
  initialFields?: FormFieldRecord[];
  isEditing?: boolean;
  availableRoles?: TargetRoleDefinition[];
  questionBank?: BankQuestionRecord[];
}

const FIXED_OFFICIAL_EMAIL = 'event@new-era-medical-club-univ-ouargla.dz';

const FIELD_TYPE_LABELS: Record<FieldType, { label: string; icon: string; color: string }> = {
  short_text: { label: 'Texte court', icon: '📝', color: '#3B33FF' },
  long_text: { label: 'Paragraphe', icon: '📄', color: '#8B3EE1' },
  email: { label: 'Adresse email', icon: '✉️', color: '#2563EB' },
  phone: { label: 'Téléphone WhatsApp', icon: '📞', color: '#059669' },
  number: { label: 'Nombre', icon: '🔢', color: '#D97706' },
  radio: { label: 'Choix unique', icon: '🔘', color: '#7C3AED' },
  checkboxes: { label: 'Cases à cocher', icon: '☑️', color: '#4F46E5' },
  select: { label: 'Menu déroulant', icon: '▾', color: '#0D9488' },
  date: { label: 'Date', icon: '📅', color: '#EA580C' },
  file: { label: 'Fichier / Justificatif', icon: '📎', color: '#BE185D' },
  consent: { label: 'Consentement', icon: '⚖️', color: '#15803D' },
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

  // Roles State (which roles this form is guided to)
  const [allRoles, setAllRoles] = useState<TargetRoleDefinition[]>(() => {
    return availableRoles && availableRoles.length > 0 ? availableRoles : DEFAULT_TARGET_ROLES;
  });

  const [targetRoles, setTargetRoles] = useState<FormRole[]>(() => {
    if (initialForm?.target_roles && initialForm.target_roles.length > 0) {
      return initialForm.target_roles;
    }
    return [];
  });

  // Question Bank State
  const [bank, setBank] = useState<BankQuestionRecord[]>(() => {
    return questionBank && questionBank.length > 0 ? questionBank : DEFAULT_QUESTION_BANK;
  });
  const [bankSearch, setBankSearch] = useState('');
  const [bankCategory, setBankCategory] = useState('all');
  const [bankDrawerOpen, setBankDrawerOpen] = useState(true);

  // Fields State
  const [fields, setFields] = useState<Array<Partial<FormFieldRecord>>>(() => {
    if (initialFields && initialFields.length > 0) {
      return initialFields;
    }
    if (isEditing) {
      return initialFields || [];
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
        target_roles: ['all'],
      },
      {
        id: 'f_2',
        type: 'email',
        key: 'email',
        label: 'Adresse email',
        help_text: 'Pour les communications et confirmations',
        placeholder: 'sarah.benali@example.com',
        required: true,
        target_roles: ['all'],
      },
      {
        id: 'f_3',
        type: 'phone',
        key: 'phone',
        label: 'Numéro de téléphone (WhatsApp)',
        placeholder: '0550 00 00 00',
        required: true,
        target_roles: ['all'],
      },
    ];
  });

  // Tab & View State
  // activeTab can be 'settings' | 'common' | roleId
  const [activeTab, setActiveTab] = useState<string>('settings');
  const [viewMode, setViewMode] = useState<'board' | 'tabs'>('board');
  const [showAddRoleDropdown, setShowAddRoleDropdown] = useState(false);
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
          setClosesAt(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
          );
        } catch {
          setClosesAt('');
        }
      } else {
        setClosesAt('');
      }
    }
  }, [initialForm, isEditing]);

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

  // Add a role to the form
  const addRoleToForm = (roleDef: TargetRoleDefinition) => {
    if (targetRoles.some((r) => r.id === roleDef.id)) {
      setActiveTab(roleDef.id);
      setShowAddRoleDropdown(false);
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
    setActiveTab(newRole.id);
    setShowAddRoleDropdown(false);
    showAdminToast({
      type: 'success',
      title: 'Public Cible Ajouté',
      message: `Le parcours de questions pour "${newRole.name}" est créé.`,
    });
  };

  // Remove a role from the form
  const removeRoleFromForm = (roleId: string) => {
    const roleToRemove = targetRoles.find((r) => r.id === roleId);
    setTargetRoles((prev) => prev.filter((r) => r.id !== roleId));
    // Also remove fields assigned strictly to this role
    setFields((prev) => prev.filter((f) => !f.target_roles?.includes(roleId) || f.target_roles?.includes('all')));
    if (activeTab === roleId) {
      setActiveTab('common');
    }
    showAdminToast({
      type: 'info',
      title: 'Public Cible Retiré',
      message: `Le rôle "${roleToRemove?.name || roleId}" a été retiré de ce formulaire.`,
    });
  };

  // Add question to a specific pipeline target ('all' or roleId)
  const addFieldToTarget = (target: string = 'all', type: FieldType = 'short_text') => {
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
      target_roles: target === 'all' ? ['all'] : [target],
    };

    setFields((prev) => [...prev, newField]);
    setExpandedFieldId(newField.id || null);
    if (target !== 'all') {
      setActiveTab(target);
    }
  };

  // Insert a question from the Question Bank into a target pipeline
  const insertFromBank = (bankQuestion: BankQuestionRecord, target: string = 'all') => {
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
      target_roles: target === 'all' ? ['all'] : [target],
    };

    setFields((prev) => [...prev, newField]);
    const targetName =
      target === 'all'
        ? 'Questions Communes'
        : targetRoles.find((r) => r.id === target)?.name || 'ce rôle';
    showAdminToast({
      type: 'success',
      title: 'Question Insérée',
      message: `"${bankQuestion.label}" a été ajoutée à ${targetName}.`,
    });
  };

  // Drag and Drop handlers
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

    const next = [...fields];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setFields(next);
  };

  // Save Form Action
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
        notify_emails: [FIXED_OFFICIAL_EMAIL],
        max_responses: maxResponses ? parseInt(maxResponses, 10) : null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        target_roles: targetRoles.length > 0 ? targetRoles : null,
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
        target_roles: f.target_roles && f.target_roles.length > 0 ? f.target_roles : ['all'],
      }));

      const res = await saveFormAction(formPayload, fieldsPayload);
      if (res.success) {
        showAdminToast({
          type: 'success',
          title: isEditing ? 'Formulaire mis à jour' : 'Formulaire créé',
          message: `Le formulaire "${title}" a été enregistré avec succès dans Supabase.`,
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
        message: `Le formulaire "${title}" a été supprimé définitivement.`,
      });
      router.push('/admin');
      router.refresh();
    } else {
      setDeleteError(res.error || 'Erreur lors de la suppression.');
    }
  };

  // Filtered Question Bank
  const filteredBank = bank.filter((item) => {
    const matchesCat = bankCategory === 'all' || item.category === bankCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(bankSearch.toLowerCase()) ||
      item.key.toLowerCase().includes(bankSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const bankCategories = Array.from(new Set(['all', ...bank.map((q) => q.category).filter(Boolean)]));

  // Field partitions
  const commonFields = fields.filter(
    (f) => !f.target_roles || f.target_roles.length === 0 || f.target_roles.includes('all')
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] inline-flex items-center gap-1">
            <span>←</span> <span>Retour aux formulaires</span>
          </Link>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
              {isEditing ? `Modifier : ${initialForm?.title}` : 'Créer un formulaire'}
            </h1>
            {targetRoles.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3B33FF]/10 text-[#3B33FF] border border-[#3B33FF]/20">
                {targetRoles.length} public(s) ciblé(s)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5">
            Constructeur interactif par parcours de rôles &amp; glisser-déposer de questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="brand-gradient-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs font-bold p-1">✕</button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CHROME-STYLE TABS BAR                                                 */}
      {/* ===================================================================== */}
      <div className="bg-[#EFECE6] border border-[#E6DFD5] rounded-2xl overflow-hidden shadow-xs">
        <div className="flex items-center gap-1 px-3 pt-3 bg-[#EFECE6] border-b border-[#E6DFD5] overflow-x-auto scrollbar-none">
          {/* Tab 1: Form Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition relative cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-[#18181B] shadow-2xs -mb-px border-t-2 border-t-[#3B33FF]'
                : 'text-[#71717A] hover:bg-white/60 hover:text-[#18181B]'
            }`}
          >
            <span>⚙️</span>
            <span>1. Paramètres du formulaire</span>
          </button>

          {/* Tab 2: Common Questions (Everyone) */}
          <button
            type="button"
            onClick={() => setActiveTab('common')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition relative cursor-pointer ${
              activeTab === 'common'
                ? 'bg-white text-[#18181B] shadow-2xs -mb-px border-t-2 border-t-[#3B33FF]'
                : 'text-[#71717A] hover:bg-white/60 hover:text-[#18181B]'
            }`}
          >
            <span>🌐</span>
            <span>2. Questions Communes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#18181B]/10 text-[#18181B] font-mono">
              {commonFields.length}
            </span>
          </button>

          {/* Dynamic Role Tabs */}
          {targetRoles.map((role) => {
            const roleFieldsCount = fields.filter((f) => f.target_roles?.includes(role.id)).length;
            const isActive = activeTab === role.id;
            return (
              <div
                key={role.id}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition group relative ${
                  isActive
                    ? 'bg-white text-[#18181B] shadow-2xs -mb-px border-t-2'
                    : 'text-[#71717A] hover:bg-white/60 hover:text-[#18181B]'
                }`}
                style={isActive ? { borderTopColor: role.color || '#3B33FF' } : {}}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab(role.id)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{role.icon || '🎯'}</span>
                  <span>{role.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                    style={{
                      backgroundColor: `${role.color || '#3B33FF'}20`,
                      color: role.color || '#3B33FF',
                    }}
                  >
                    {roleFieldsCount}
                  </span>
                </button>

                {/* Remove Role Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRoleFromForm(role.id);
                  }}
                  className="w-4 h-4 rounded hover:bg-black/10 text-[10px] text-[#71717A] hover:text-[#DC2626] flex items-center justify-center cursor-pointer ml-1"
                  title={`Retirer le rôle "${role.name}"`}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Chrome "+" Button to Add a Role */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddRoleDropdown(!showAddRoleDropdown)}
              className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white text-[#18181B] text-base font-bold flex items-center justify-center transition shadow-2xs border border-[#E6DFD5] cursor-pointer ml-1"
              title="Ajouter un public cible / rôle à ce formulaire"
            >
              +
            </button>

            {showAddRoleDropdown && (
              <div className="absolute top-9 left-0 z-30 w-72 bg-white rounded-2xl border border-[#E6DFD5] shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E6DFD5]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                    Sélectionner un Public Cible
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddRoleDropdown(false)}
                    className="text-xs text-[#71717A] hover:text-[#18181B] p-0.5"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {allRoles.map((r) => {
                    const isAlreadyAssigned = targetRoles.some((tr) => tr.id === r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isAlreadyAssigned}
                        onClick={() => addRoleToForm(r)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                          isAlreadyAssigned
                            ? 'opacity-40 bg-[#FAF8F5] cursor-not-allowed'
                            : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0"
                            style={{ backgroundColor: `${r.color || '#3B33FF'}20` }}
                          >
                            {r.icon || '🎯'}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-[#18181B] block truncate">{r.name}</span>
                            <span className="text-[10px] text-[#71717A] block truncate">{r.description}</span>
                          </div>
                        </div>
                        {isAlreadyAssigned ? (
                          <span className="text-[10px] text-[#15803D] font-bold">✓ Ajouté</span>
                        ) : (
                          <span className="text-xs text-[#3B33FF] font-bold">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#E6DFD5]">
                  <Link
                    href="/admin/roles"
                    target="_blank"
                    className="text-[11px] font-semibold text-[#3B33FF] hover:underline flex items-center gap-1"
                  >
                    <span>⚙️ Gérer tous les rôles &amp; catégories</span>
                    <span>↗</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="ml-auto flex items-center gap-2 pr-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'board' ? 'tabs' : 'board')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E6DFD5] text-[#18181B] shadow-2xs hover:bg-[#FAF8F5] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{viewMode === 'board' ? '📑' : '📌'}</span>
              <span>{viewMode === 'board' ? 'Vue Onglet Unique' : 'Vue Pipelines (Miro)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 sm:p-7 bg-white">
          {/* TAB 1: FORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
              <div className="pb-3 border-b border-[#E6DFD5]">
                <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                  <span>⚙️ Informations générales du formulaire</span>
                </h2>
                <p className="text-xs text-[#52525B] mt-0.5">
                  Titre, URL publique, format d&apos;affichage et dates de clôture automatique.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Titre du formulaire <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex. Inscription : Conférence Médicale Annuelle 2026"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">
                    Description ou consignes (facultatif)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex. Ce formulaire s'adresse aux étudiants et praticiens désireux de participer..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Statut
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FormStatus)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                    >
                      <option value="open">Ouvert (Accepte les réponses)</option>
                      <option value="draft">Brouillon (Non accessible aux étudiants)</option>
                      <option value="closed">Clôturé (Formulaire fermé)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">
                      Format d’affichage
                    </label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value as FormLayout)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                    >
                      <option value="stepped">Format optimisé (Mobile : 3 par 3 • PC : 2 côtés compact)</option>
                      <option value="single">Page unique classique</option>
                    </select>
                  </div>
                </div>

                {/* Email de réception verrouillé */}
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl text-xs text-[#52525B] flex items-center justify-between gap-2">
                  <span>
                    Email de réception des alertes (fixe et sécurisé) : <strong className="text-[#18181B] font-mono">{FIXED_OFFICIAL_EMAIL}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                    ✓ Officiel Club
                  </span>
                </div>

                {/* Collapsible Advanced Settings */}
                <div className="pt-2 border-t border-[#E6DFD5]">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs font-semibold text-[#3B33FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAdvanced ? '− Masquer les paramètres avancés' : '+ Afficher les paramètres avancés'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#18181B] mb-1">
                          Adresse URL du formulaire
                        </label>
                        <div className="flex items-center">
                          <span className="text-xs text-[#71717A] bg-white px-3 min-h-[42px] flex items-center border border-r-0 border-[#D4D4D8] rounded-l-xl select-none">
                            /f/
                          </span>
                          <input
                            type="text"
                            required
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            className="w-full min-h-[42px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-r-xl"
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
                            className="w-full min-h-[42px] px-3 py-1.5 text-xs text-[#18181B] bg-white border border-[#D4D4D8] rounded-xl"
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
                          {sendReceipt && !fields.some((f) => f.type === 'email') && (
                            <p className="text-[11px] text-[#DC2626] font-semibold mt-1 flex items-center gap-1">
                              <span>⚠️</span> Aucun champ &laquo; Adresse email &raquo; dans vos questions. Le candidat ne pourra pas recevoir d&apos;accusé.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Custom Date Time Picker */}
                      <div className="pt-3 border-t border-[#E6DFD5]">
                        <CustomDateTimePicker
                          value={closesAt}
                          onChange={setClosesAt}
                          label="Date et heure de fin (Clôture automatique hh:mm:ss)"
                          helperText="Dès que cette date et cette heure précise (hh:mm:ss) sont atteintes, le formulaire se clôture automatiquement."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* QUESTIONS WORKSPACE: WITH LEFT BANK & ROLE PIPELINES              */}
          {/* ================================================================= */}
          {activeTab !== 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
              {/* LEFT COLUMN: QUESTION BANK & QUICK INSERT TOOL */}
              <div
                className={`${
                  bankDrawerOpen ? 'lg:col-span-4' : 'lg:col-span-1'
                } bg-[#FAF8F5] border border-[#E6DFD5] rounded-2xl p-4 transition-all duration-200 space-y-3.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    {bankDrawerOpen && (
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                        Banque de Questions ({bank.length})
                      </h3>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBankDrawerOpen(!bankDrawerOpen)}
                    className="text-xs text-[#71717A] hover:text-[#18181B] p-1 cursor-pointer"
                    title={bankDrawerOpen ? 'Réduire' : 'Agrandir la banque'}
                  >
                    {bankDrawerOpen ? '◀' : '▶'}
                  </button>
                </div>

                {bankDrawerOpen && (
                  <>
                    <p className="text-[11px] text-[#52525B]">
                      Glissez-déposez n&apos;importe quelle question dans la colonne souhaitée.
                    </p>

                    {/* Search in bank */}
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Rechercher une question..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                    />

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {bankCategories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBankCategory(c)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                            bankCategory === c
                              ? 'bg-[#18181B] text-white'
                              : 'bg-white text-[#71717A] border border-[#E6DFD5] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {c === 'all' ? 'Toutes' : c}
                        </button>
                      ))}
                    </div>

                    {/* Draggable Question Cards List */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredBank.map((bq) => {
                        const typeInfo = FIELD_TYPE_LABELS[bq.type] || {
                          label: bq.type,
                          icon: '📝',
                          color: '#3B33FF',
                        };
                        return (
                          <div
                            key={bq.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, bq)}
                            className="p-2.5 bg-white border border-[#E6DFD5] hover:border-[#3B33FF] rounded-xl shadow-2xs hover:shadow-xs transition cursor-grab active:cursor-grabbing group space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{
                                  backgroundColor: `${typeInfo.color}15`,
                                  color: typeInfo.color,
                                  border: `1px solid ${typeInfo.color}30`,
                                }}
                              >
                                <span>{typeInfo.icon}</span>
                                <span>{typeInfo.label}</span>
                              </span>
                              <span className="text-[9px] text-[#71717A] font-mono">
                                &#123;&#123;{bq.key}&#125;&#125;
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-[#18181B] leading-tight line-clamp-2">
                              {bq.label}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-[#E6DFD5]/40 text-[10px]">
                              <span className="text-[#71717A] flex items-center gap-1">
                                <span>⠿</span> Glisser
                              </span>

                              {/* One-click Add Dropdown */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => insertFromBank(bq, 'all')}
                                  className="text-[10px] font-bold text-[#3B33FF] hover:underline"
                                  title="Ajouter aux questions communes"
                                >
                                  + Communes
                                </button>
                                {activeTab !== 'settings' && activeTab !== 'common' && (
                                  <button
                                    type="button"
                                    onClick={() => insertFromBank(bq, activeTab)}
                                    className="text-[10px] font-bold text-[#8B3EE1] hover:underline"
                                    title="Ajouter au rôle actif"
                                  >
                                    + Rôle actif
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Add Custom Question into Active Pipeline */}
                    <div className="pt-2 border-t border-[#E6DFD5]">
                      <button
                        type="button"
                        onClick={() =>
                          addFieldToTarget(activeTab === 'settings' ? 'all' : activeTab, 'short_text')
                        }
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E6DFD5] text-[#18181B] transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>+</span>
                        <span>Créer une question personnalisée</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT WORKSPACE: ROLE PIPELINES & BOARD */}
              <div
                className={`${
                  bankDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-11'
                } transition-all duration-200`}
              >
                {/* Board Multi-Column Pipeline View (Figma/Miro style as in screenshot!) */}
                {viewMode === 'board' ? (
                  <div className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin">
                    {/* Column 1: Questions Communes (Tout le monde) */}
                    <PipelineColumn
                      id="all"
                      title="Questions Communes"
                      subtitle="Posées à tous les répondants"
                      icon="🌐"
                      color="#3B33FF"
                      fields={commonFields}
                      isDropActive={activeDropPipeline === 'all'}
                      onDragOver={(e) => handleDragOver(e, 'all')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'all')}
                      onAddField={(type) => addFieldToTarget('all', type)}
                      onUpdateField={updateField}
                      onRemoveField={removeField}
                      onMoveField={moveField}
                      expandedFieldId={expandedFieldId}
                      setExpandedFieldId={setExpandedFieldId}
                    />

                    {/* Columns for each Role Pipeline */}
                    {targetRoles.map((role) => {
                      const roleFields = fields.filter((f) => f.target_roles?.includes(role.id));
                      return (
                        <PipelineColumn
                          key={role.id}
                          id={role.id}
                          title={role.name}
                          subtitle={role.description || 'Questions ciblées pour ce profil'}
                          icon={role.icon || '🎯'}
                          color={role.color || '#8B3EE1'}
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

                    {/* Column N: Quick Add Role Button Card */}
                    <div className="w-64 shrink-0 bg-[#FAF8F5] border-2 border-dashed border-[#D4D4D8] rounded-2xl p-6 text-center space-y-3 self-stretch flex flex-col items-center justify-center min-h-[300px]">
                      <span className="text-2xl">👥</span>
                      <h4 className="text-xs font-bold text-[#18181B]">
                        Ajouter un autre profil / rôle
                      </h4>
                      <p className="text-[11px] text-[#71717A]">
                        Créez un nouveau pipeline pour une catégorie de candidats.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddRoleDropdown(true)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white border border-[#E6DFD5] text-[#3B33FF] shadow-2xs hover:bg-[#F4F0EA] transition cursor-pointer"
                      >
                        + Ajouter un Public Cible
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Focused Single Tab View */
                  <div className="space-y-4">
                    {activeTab === 'common' && (
                      <PipelineColumn
                        id="all"
                        title="Questions Communes (Posées à tous)"
                        subtitle="Ces questions s'afficheront quel que soit le rôle choisi par le candidat"
                        icon="🌐"
                        color="#3B33FF"
                        fields={commonFields}
                        isDropActive={activeDropPipeline === 'all'}
                        onDragOver={(e) => handleDragOver(e, 'all')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'all')}
                        onAddField={(type) => addFieldToTarget('all', type)}
                        onUpdateField={updateField}
                        onRemoveField={removeField}
                        onMoveField={moveField}
                        expandedFieldId={expandedFieldId}
                        setExpandedFieldId={setExpandedFieldId}
                        fullWidth
                      />
                    )}

                    {targetRoles.map((role) => {
                      if (activeTab !== role.id) return null;
                      const roleFields = fields.filter((f) => f.target_roles?.includes(role.id));
                      return (
                        <PipelineColumn
                          key={role.id}
                          id={role.id}
                          title={`Parcours Spécifique : ${role.name}`}
                          subtitle={role.description || 'Questions posées exclusivement à ce profil'}
                          icon={role.icon || '🎯'}
                          color={role.color || '#8B3EE1'}
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
                          fullWidth
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Form Area (Zone de danger) */}
      {isEditing && initialForm?.slug && (
        <div className="p-5 border border-[#FECACA] bg-[#FEF2F2] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#991B1B]">⚠️ Zone de danger : Supprimer ce formulaire</h4>
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
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center text-xl font-bold">
              ⚠️
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
    </form>
  );
}

// =============================================================================
// SUB-COMPONENT: Pipeline Column (For each role or common questions)
// =============================================================================
interface PipelineColumnProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
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
  fullWidth?: boolean;
}

function PipelineColumn({
  id,
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
  fullWidth = false,
}: PipelineColumnProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${
        fullWidth ? 'w-full' : 'w-80 sm:w-96 shrink-0'
      } rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs ${
        isDropActive
          ? 'ring-2 ring-[#3B33FF] bg-[#EEF2FF] border-[#3B33FF]'
          : 'bg-[#FAF8F5]/80 border-[#E6DFD5]'
      }`}
    >
      {/* Top Header Card with Color Stripe */}
      <div className="p-4 border-b border-[#E6DFD5] bg-white relative space-y-1">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: color || '#3B33FF' }}
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 font-bold"
              style={{ backgroundColor: `${color}15`, color: color }}
            >
              {icon}
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#18181B] truncate">
              {title}
            </h3>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            {fields.length} question(s)
          </span>
        </div>

        <p className="text-[11px] text-[#71717A] line-clamp-1">{subtitle}</p>
      </div>

      {/* Column Body: Questions List / Drop Zone */}
      <div className="p-3.5 space-y-2.5 flex-1 min-h-[220px]">
        {fields.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#D4D4D8] rounded-xl space-y-2 bg-white/60">
            <span className="text-2xl opacity-60">📥</span>
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
              icon: '📝',
              color: '#3B33FF',
            };

            return (
              <div
                key={fieldId}
                className="bg-white border border-[#E6DFD5] hover:border-[#3B33FF] rounded-xl p-3 shadow-2xs space-y-2 transition"
              >
                {/* Compact Card Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#18181B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1 shrink-0"
                      style={{
                        backgroundColor: `${typeInfo.color}15`,
                        color: typeInfo.color,
                      }}
                    >
                      <span>{typeInfo.icon}</span>
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
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => onMoveField(fieldId, 'down')}
                      className="w-5 h-5 rounded border border-[#E6DFD5] text-[10px] flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedFieldId(isExpanded ? null : fieldId)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] cursor-pointer"
                    >
                      {isExpanded ? 'Fermer' : 'Éditer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveField(fieldId)}
                      className="w-5 h-5 rounded text-[#DC2626] hover:bg-[#FEF2F2] text-[10px] font-bold flex items-center justify-center cursor-pointer"
                      title="Supprimer cette question"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded Question Properties Editor */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[#E6DFD5] space-y-3 animate-in fade-in duration-100">
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
                              {info.icon} {info.label}
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
                        <div className="space-y-1">
                          {(field.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#71717A] w-3">{oIdx + 1}.</span>
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => {
                                  const next = [...(field.options || [])];
                                  next[oIdx] = {
                                    label: e.target.value,
                                    value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                                  };
                                  onUpdateField(fieldId, { options: next });
                                }}
                                className="flex-1 px-2 py-0.5 text-xs border border-[#D4D4D8] rounded bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (field.options || []).filter((_, i) => i !== oIdx);
                                  onUpdateField(fieldId, { options: next });
                                }}
                                className="text-[10px] text-[#DC2626] p-0.5 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Column Footer: Quick Add Button */}
      <div className="p-3 border-t border-[#E6DFD5] bg-white relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] text-[#18181B] transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>+ Ajouter une question</span>
          <span>▾</span>
        </button>

        {showAddMenu && (
          <div className="absolute bottom-12 left-3 right-3 z-20 bg-white rounded-xl border border-[#E6DFD5] shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {Object.entries(FIELD_TYPE_LABELS).map(([t, info]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onAddField(t as FieldType);
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
