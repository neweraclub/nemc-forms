'use client';

import React, { useState, useTransition } from 'react';
import { BankQuestionRecord, FieldType, FieldOption } from '@/types/form';
import { saveQuestionBankAction, deleteQuestionBankAction } from '@/app/actions/questionBankActions';
import { showAdminToast } from '../AdminToast';
import { FieldTypeIcon } from '@/components/DynamicIcon';
import {
  Search,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Plus,
  HelpCircle,
  CheckSquare,
  Layers,
  Sparkles,
} from 'lucide-react';

interface QuestionBankClientProps {
  initialQuestions: BankQuestionRecord[];
}

const PREDEFINED_CATEGORIES = [
  'Identité & Contact',
  'Cursus & Médical',
  'Engagement & Projet',
  'Logistique & Présence',
  'Justificatifs & Documents',
  'Conditions & Consentement',
  'Général',
];

const FIELD_TYPE_DESCRIPTIONS: Record<
  FieldType,
  { label: string; desc: string; color: string }
> = {
  short_text: {
    label: 'Texte court',
    desc: 'Une seule ligne de texte (ex : Nom, prénom, ville, spécialité)',
    color: '#3B33FF',
  },
  long_text: {
    label: 'Paragraphe long',
    desc: 'Zone de texte sur plusieurs lignes (ex : Motivation, remarques)',
    color: '#8B3EE1',
  },
  email: {
    label: 'Adresse email',
    desc: "Champ avec vérification automatique du format de l'email",
    color: '#2563EB',
  },
  phone: {
    label: 'Téléphone WhatsApp',
    desc: 'Numéro de téléphone avec indicatif pays',
    color: '#059669',
  },
  number: {
    label: 'Nombre / Âge',
    desc: 'Accepte uniquement une valeur numérique (ex : Âge, promotion)',
    color: '#D97706',
  },
  radio: {
    label: 'Choix unique (Boutons radio)',
    desc: 'Le candidat sélectionne une seule option parmi une liste visible',
    color: '#7C3AED',
  },
  checkboxes: {
    label: 'Choix multiples (Cases à cocher)',
    desc: 'Le candidat peut cocher plusieurs options à la fois',
    color: '#4F46E5',
  },
  select: {
    label: 'Menu déroulant',
    desc: 'Liste compacte déroulante avec un seul choix possible',
    color: '#0D9488',
  },
  date: {
    label: 'Date',
    desc: 'Sélecteur de date avec calendrier (ex : Date de naissance)',
    color: '#EA580C',
  },
  file: {
    label: 'Fichier / Justificatif',
    desc: 'Téléversement de document (PDF, photo, certificat médical)',
    color: '#BE185D',
  },
  consent: {
    label: 'Case de consentement',
    desc: "Case à cocher d'approbation du règlement ou des conditions",
    color: '#15803D',
  },
};

const FIELD_TYPE_LABELS = FIELD_TYPE_DESCRIPTIONS;

export function QuestionBankClient({ initialQuestions }: QuestionBankClientProps) {
  const [questions, setQuestions] = useState<BankQuestionRecord[]>(initialQuestions);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestionRecord | null>(null);

  // Form Fields State inside Modal
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<FieldType>('short_text');
  const [category, setCategory] = useState('Identité & Contact');
  const [helpText, setHelpText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(true);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Categories list extracted from predefined + existing data
  const categories = Array.from(
    new Set([
      ...PREDEFINED_CATEGORIES,
      ...questions.map((q) => q.category).filter((c): c is string => Boolean(c)),
    ])
  );

  const openCreateModal = () => {
    setEditingQuestion(null);
    setLabel('');
    setKey('');
    setType('short_text');
    setCategory('Identité & Contact');
    setHelpText('');
    setPlaceholder('');
    setRequired(true);
    setOptions([]);
    setShowAdvancedKey(false);
    setIsModalOpen(true);
  };

  const openEditModal = (q: BankQuestionRecord) => {
    setEditingQuestion(q);
    setLabel(q.label);
    setKey(q.key);
    setType(q.type);
    setCategory(q.category || 'Identité & Contact');
    setHelpText(q.help_text || '');
    setPlaceholder(q.placeholder || '');
    setRequired(q.required);
    setOptions(q.options || []);
    setShowAdvancedKey(false);
    setIsModalOpen(true);
  };

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!editingQuestion || !key || key.startsWith('q_')) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 30);
      setKey(generated);
    }
  };

  const addOption = () => {
    const idx = options.length + 1;
    setOptions([...options, { label: `Option ${idx}`, value: `opt_${idx}` }]);
  };

  const updateOption = (index: number, newLabel: string) => {
    const next = [...options];
    next[index] = {
      label: newLabel,
      value: newLabel.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    };
    setOptions(next);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    startTransition(async () => {
      const finalKey =
        key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
        label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 30) ||
        `q_${Date.now().toString(36)}`;

      const payload = {
        id: editingQuestion ? editingQuestion.id : undefined,
        label: label.trim(),
        key: finalKey,
        type,
        category: category.trim() || 'Identité & Contact',
        help_text: helpText.trim() || null,
        placeholder: placeholder.trim() || null,
        required,
        options: ['radio', 'checkboxes', 'select'].includes(type) ? options : [],
      };

      const res = await saveQuestionBankAction(payload);
      if (res.success && res.question) {
        const saved = res.question;
        setQuestions((prev) => {
          const idx = prev.findIndex((q) => q.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        showAdminToast({
          type: 'success',
          title: editingQuestion ? 'Question mise à jour' : 'Question enregistrée',
          message: `La question "${saved.label}" est désormais disponible dans la banque.`,
        });
        setIsModalOpen(false);
      } else {
        showAdminToast({
          type: 'error',
          title: 'Erreur',
          message: res.error || 'Impossible d’enregistrer la question.',
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteQuestionBankAction(id);
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        showAdminToast({
          type: 'success',
          title: 'Question supprimée',
          message: 'La question type a été retirée de la banque.',
        });
        setDeleteTargetId(null);
      } else {
        showAdminToast({
          type: 'error',
          title: 'Erreur',
          message: res.error || 'Impossible de supprimer cette question.',
        });
      }
    });
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesSearch =
      q.label.toLowerCase().includes(search.toLowerCase()) ||
      q.key.toLowerCase().includes(search.toLowerCase()) ||
      (q.help_text || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              Réutilisabilité &amp; Efficacité
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Banque de Questions Réutilisables
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl leading-relaxed">
            Pré-créez vos questions types avec leurs options, validations et formats. Dans le constructeur de formulaires, vous pourrez simplement les glisser-déposer dans vos parcours de rôles sans jamais devoir les ressaisir.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="brand-gradient-btn min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>+</span>
          <span>Créer une Question Type</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#18181B] text-white shadow-2xs'
                : 'bg-[#FAF8F5] text-[#52525B] hover:bg-[#F4F0EA] border border-[#E6DFD5]'
            }`}
          >
            Toutes ({questions.length})
          </button>
          {categories.map((cat) => {
            const count = questions.filter((q) => q.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#18181B] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#52525B] hover:bg-[#F4F0EA] border border-[#E6DFD5]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="sm:w-64 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une question..."
            className="w-full px-3 py-1.5 text-xs border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] bg-[#FAF8F5]"
          />
        </div>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D4D4D8] space-y-3">
          <Search className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#18181B]">Aucune question trouvée</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            Aucune question type ne correspond à vos filtres. Cliquez sur &quot;Créer une Question Type&quot; pour en ajouter une nouvelle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuestions.map((q) => {
            const typeInfo = FIELD_TYPE_LABELS[q.type] || {
              label: q.type,
              color: '#71717A',
            };
            return (
              <div
                key={q.id}
                className="bg-white border border-[#E6DFD5] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border"
                      style={{
                        backgroundColor: `${typeInfo.color}10`,
                        color: typeInfo.color,
                        borderColor: `${typeInfo.color}30`,
                      }}
                    >
                      <FieldTypeIcon type={q.type} className="w-3.5 h-3.5" />
                      <span>{typeInfo.label}</span>
                    </span>

                    <span className="text-[10px] font-semibold text-[#71717A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E6DFD5]">
                      {q.category || 'Général'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#18181B] group-hover:text-[#3B33FF] transition leading-snug">
                      {q.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] font-mono text-[#71717A] bg-[#FAF8F5] px-1 py-0.5 rounded border border-[#E6DFD5]">
                        &#123;&#123;{q.key}&#125;&#125;
                      </code>
                      {q.required ? (
                        <span className="text-[10px] font-bold text-[#DC2626]">Obligatoire</span>
                      ) : (
                        <span className="text-[10px] text-[#71717A]">Facultatif</span>
                      )}
                    </div>
                  </div>

                  {q.help_text && (
                    <p className="text-xs text-[#52525B] italic leading-relaxed line-clamp-2 flex items-start gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
                      <span>{q.help_text}</span>
                    </p>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="text-[11px] text-[#71717A] flex items-center gap-1.5">
                      <CheckSquare className="w-3 h-3 text-[#3B33FF] shrink-0" />
                      <span>{q.options.length} option(s) :</span>
                      <span className="font-semibold text-[#18181B] truncate">
                        {q.options.slice(0, 2).map((o) => o.label).join(', ')}
                        {q.options.length > 2 && '...'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#71717A] font-mono">
                    id: {q.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] text-[#18181B] transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-[#71717A]" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(q.id)}
                      className="p-1.5 text-xs font-semibold rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] transition cursor-pointer"
                      title="Supprimer cette question type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Question */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#3B33FF]" />
                <h3 className="text-base sm:text-lg font-bold text-[#18181B]">
                  {editingQuestion ? 'Modifier la Question Type' : 'Nouvelle Question Type'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#18181B]">
                    Type de réponse attendue <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FieldType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-xl bg-white focus:border-[#3B33FF]"
                  >
                    {Object.entries(FIELD_TYPE_DESCRIPTIONS).map(([t, info]) => (
                      <option key={t} value={t}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#71717A] leading-tight">
                    {FIELD_TYPE_DESCRIPTIONS[type]?.desc}
                  </p>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#18181B]">
                    Catégorie thématique <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-xl bg-white focus:border-[#3B33FF]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#71717A] leading-tight">
                    Classement de la question dans la banque.
                  </p>
                </div>
              </div>

              {/* Label */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#18181B]">
                  Intitulé de la question <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Ex. Votre spécialité médicale, Numéro de téléphone WhatsApp..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                />
                <p className="text-[11px] text-[#71717A] leading-tight">
                  La question telle qu&apos;elle sera affichée pour les candidats.
                </p>
              </div>

              {/* Help text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#18181B]">
                  Texte d’aide ou indication <span className="text-[11px] font-normal text-[#71717A]">(facultatif)</span>
                </label>
                <input
                  type="text"
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Ex. Précisez votre service ou votre année universitaire..."
                  className="w-full px-3.5 py-2 text-xs border border-[#D4D4D8] rounded-xl"
                />
                <p className="text-[11px] text-[#71717A] leading-tight">
                  Conseil affiché sous la question pour guider le candidat.
                </p>
              </div>

              {/* Required Checkbox */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#18181B] block">
                    Réponse obligatoire
                  </span>
                  <span className="text-[11px] text-[#71717A] block">
                    Le candidat ne pourra pas soumettre le formulaire sans répondre.
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3B33FF] border-[#D4D4D8]"
                  />
                  <span className="text-xs font-bold text-[#3B33FF]">
                    {required ? 'Obligatoire' : 'Facultatif'}
                  </span>
                </label>
              </div>

              {/* Automated Excel & Email Key */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#18181B]">
                      Identifiant automatique (Excel &amp; Email) :
                    </span>
                    <code className="text-xs font-mono font-bold text-[#3B33FF] bg-white border border-[#D4D4D8] px-2 py-0.5 rounded">
                      {key || 'automatique'}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedKey(!showAdvancedKey)}
                    className="text-[11px] font-semibold text-[#71717A] hover:text-[#18181B] underline cursor-pointer"
                  >
                    {showAdvancedKey ? 'Fermer' : 'Modifier'}
                  </button>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Généré automatiquement à partir de votre intitulé. Il sert uniquement au système pour nommer la colonne dans vos exports Excel et insérer la réponse du candidat dans les accusés emails automatiques.
                </p>
                {showAdvancedKey && (
                  <div className="pt-2 border-t border-[#E6DFD5] space-y-1 animate-in fade-in duration-100">
                    <label className="block text-[11px] font-bold text-[#18181B]">
                      Personnaliser l&apos;identifiant interne :
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="nom_court_variable"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-[#D4D4D8] rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Options if select/radio/checkboxes */}
              {['radio', 'checkboxes', 'select'].includes(type) && (
                <div className="space-y-2 p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#18181B]">
                      Options de choix :
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-[11px] font-bold text-[#3B33FF] hover:underline cursor-pointer"
                    >
                      + Ajouter une option
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-[#71717A] w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-[#D4D4D8] rounded-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-xs text-[#DC2626] p-1 cursor-pointer hover:opacity-80"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending || !label.trim()}
                  className="brand-gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {isPending ? 'Enregistrement...' : editingQuestion ? 'Mettre à jour' : 'Ajouter à la Banque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#18181B]">
                Supprimer cette question type ?
              </h3>
              <p className="text-xs text-[#71717A]">
                Elle sera retirée de la banque. Les formulaires existants qui l&apos;utilisent déjà conserveront leur copie intacte.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E6DFD5] text-[#52525B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTargetId)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs transition cursor-pointer"
              >
                {isPending ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

