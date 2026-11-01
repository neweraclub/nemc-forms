'use client';

import React, { useState, useTransition } from 'react';
import { TargetRoleDefinition, FormRecord } from '@/types/form';
import { saveTargetRoleAction, deleteTargetRoleAction } from '@/app/actions/roleActions';
import { showAdminToast } from '../AdminToast';

interface RolesManagerClientProps {
  initialRoles: TargetRoleDefinition[];
  forms?: FormRecord[];
}

const PRESET_COLORS = [
  { name: 'Bleu Royal (Médecin)', value: '#3B33FF' },
  { name: 'Violet Élite (Étudiant)', value: '#8B3EE1' },
  { name: 'Rose Corail (Professeur)', value: '#E53888' },
  { name: 'Émeraude Santé (Participant)', value: '#10B981' },
  { name: 'Ambre / Or (Cadre / Direction)', value: '#F59E0B' },
  { name: 'Cyan Hospitalier (Soignant)', value: '#06B6D4' },
  { name: 'Indigo Académique (Chercheur)', value: '#6366F1' },
  { name: 'Rouge Urgence (Bénévole)', value: '#EF4444' },
];

const PRESET_ICONS = ['🩺', '🎓', '👨‍🏫', '🔬', '🤝', '🏥', '⚕️', '📋', '💉', '🌟', '👤', '💡'];

export function RolesManagerClient({ initialRoles, forms = [] }: RolesManagerClientProps) {
  const [roles, setRoles] = useState<TargetRoleDefinition[]>(initialRoles);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<TargetRoleDefinition | null>(null);

  // Form State inside Modal
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B33FF');
  const [icon, setIcon] = useState('🩺');

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setColor('#3B33FF');
    setIcon('🩺');
    setIsModalOpen(true);
  };

  const openEditModal = (r: TargetRoleDefinition) => {
    setEditingRole(r);
    setName(r.name);
    setDescription(r.description || '');
    setColor(r.color || '#3B33FF');
    setIcon(r.icon || '🩺');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const payload = {
        id: editingRole ? editingRole.id : undefined,
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
      };

      const res = await saveTargetRoleAction(payload);
      if (res.success && res.role) {
        const saved = res.role;
        setRoles((prev) => {
          const idx = prev.findIndex((r) => r.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        showAdminToast({
          type: 'success',
          title: editingRole ? 'Rôle mis à jour' : 'Nouveau rôle créé',
          message: `Le public cible "${saved.name}" a été enregistré avec succès.`,
        });
        setIsModalOpen(false);
      } else {
        showAdminToast({
          type: 'error',
          title: 'Erreur',
          message: res.error || 'Impossible d’enregistrer le rôle.',
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTargetRoleAction(id);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        showAdminToast({
          type: 'success',
          title: 'Rôle supprimé',
          message: 'Le public cible a été supprimé.',
        });
        setDeleteTargetId(null);
      } else {
        showAdminToast({
          type: 'error',
          title: 'Erreur',
          message: res.error || 'Impossible de supprimer ce rôle.',
        });
      }
    });
  };

  const countFormsUsingRole = (roleId: string) => {
    return forms.filter((f) => f.target_roles?.some((tr) => tr.id === roleId)).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B3EE1]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B3EE1]">
              Ciblage &amp; Catégorisation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Publics Cibles &amp; Rôles
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl leading-relaxed">
            Définissez précisément à qui s’adressent vos formulaires (médecins, étudiants, professeurs, etc.). Ces profils permettent d&apos;orienter automatiquement les candidats vers le bon parcours de questions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="brand-gradient-btn min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>+</span>
          <span>Nouveau Public Cible</span>
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => {
          const formsCount = countFormsUsingRole(role.id);
          return (
            <div
              key={role.id}
              className="bg-white border border-[#E6DFD5] rounded-2xl p-5 shadow-2xs hover:shadow-md transition relative flex flex-col justify-between group overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: role.color || '#3B33FF' }}
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-2xs border border-black/5"
                      style={{ backgroundColor: `${role.color || '#3B33FF'}15` }}
                    >
                      {role.icon || '🎯'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#18181B] leading-tight">
                        {role.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: role.color || '#3B33FF' }}
                        />
                        <span className="text-[11px] font-mono font-medium text-[#71717A]">
                          id: {role.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description ("guided like to whom") */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block mb-1">
                    Public visé (À qui s&apos;adresse ce rôle) :
                  </span>
                  <p className="text-xs text-[#3F3F46] leading-relaxed">
                    {role.description || 'Aucune description définie pour ce public cible.'}
                  </p>
                </div>
              </div>

              {/* Bottom Actions & Form Usage */}
              <div className="pt-4 mt-4 border-t border-[#E6DFD5] flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#52525B]">
                  {formsCount > 0 ? (
                    <span className="text-[#3B33FF]">
                      📋 Utilisé dans {formsCount} formulaire(s)
                    </span>
                  ) : (
                    <span className="text-[#71717A]">Non encore assigné</span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(role)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAF8F5] hover:bg-[#F4F0EA] border border-[#E6DFD5] text-[#18181B] transition cursor-pointer"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(role.id)}
                    className="px-2 py-1 text-xs font-semibold rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] transition cursor-pointer"
                    title="Supprimer ce rôle"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Role */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#18181B]">
                  {editingRole ? 'Modifier le Public Cible' : 'Nouveau Public Cible / Rôle'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Role Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#18181B]">
                  Intitulé du Rôle / Catégorie <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Médecin Spécialiste, Étudiant Externe, Professeur..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF]"
                />
              </div>

              {/* Description ("guided like to whom") */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#18181B]">
                    Public visé (À qui s&apos;adresse ce profil ?)
                  </label>
                  <span className="text-[10px] text-[#71717A]">
                    Guidage explicatif
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex. Praticiens hospitaliers, résidents de 1ère à 4ème année, spécialistes en cardiologie..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-xl focus:border-[#3B33FF] leading-relaxed"
                />
              </div>

              {/* Color Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#18181B]">
                  Couleur représentative du profil :
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center cursor-pointer ${
                        color === c.value ? 'scale-110 border-[#18181B] shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {color === c.value && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#18181B]">
                  Icône / Symbole :
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition cursor-pointer ${
                        icon === ic
                          ? 'border-[#3B33FF] bg-[#3B33FF]/10 ring-1 ring-[#3B33FF]'
                          : 'border-[#E6DFD5] bg-[#FAF8F5] hover:bg-[#F4F0EA]'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
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
                  disabled={isPending || !name.trim()}
                  className="brand-gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {isPending ? 'Enregistrement...' : editingRole ? 'Mettre à jour' : 'Créer le Public Cible'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center text-xl">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#18181B]">
                Supprimer ce public cible ?
              </h3>
              <p className="text-xs text-[#71717A]">
                Les formulaires existants ne seront pas supprimés, mais ce profil ne sera plus suggéré pour les nouveaux formulaires.
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

