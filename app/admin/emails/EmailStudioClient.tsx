'use client';

import React, { useState, useTransition } from 'react';
import { FormRecord } from '@/types/form';
import {
  generateAiEmailAction,
  refineAiEmailAction,
  sendAiTestEmailAction,
  attachAiEmailToFormAction,
} from '@/app/actions/aiEmailActions';
import { GeneratedEmailResult } from '@/lib/gemini';

interface EmailStudioClientProps {
  forms: FormRecord[];
}

export function EmailStudioClient({ forms }: EmailStudioClientProps) {
  // Input parameters
  const [subject, setSubject] = useState("Confirmation d'inscription — ECOS Hépato-Gastro-Entérologie");
  const [contextType, setContextType] = useState('Simulation ECOS');
  const [keyInfo, setKeyInfo] = useState('Lundi 12 octobre 2026 à 08h00 pile. Effectif total de 25 candidats. Salle TD 4.');
  const [extraNotes, setExtraNotes] = useState("Veillez à arriver 15 minutes à l'avance munis de votre carte d'étudiant et de votre blouse blanche.");
  const [importantNote, setImportantNote] = useState("Tout retard entraîne l'exclusion de l'épreuve.");
  const [tone, setTone] = useState<'officiel' | 'chaleureux' | 'urgent'>('officiel');
  const [designMode, setDesignMode] = useState<'cream' | 'dark' | 'light'>('cream');
  const [infoPresentation, setInfoPresentation] = useState<'divider table' | '2x2 grid of small blocks' | 'vertical timeline' | 'ticket style'>('divider table');

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

  // Test Email & Form Attachment State
  const [testEmailAddress, setTestEmailAddress] = useState('event@new-era-medical-club-univ-ouargla.dz');
  const [selectedFormSlug, setSelectedFormSlug] = useState<string>(forms[0]?.slug || '');
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Preset Handlers
  const applyPreset = (preset: { subject: string; context: string; key: string; notes: string }) => {
    setSubject(preset.subject);
    setContextType(preset.context);
    setKeyInfo(preset.key);
    setExtraNotes(preset.notes);
  };

  const PRESETS = [
    {
      label: 'Simulation ECOS',
      subject: "Confirmation d'inscription — ECOS Hépato-Gastro-Entérologie",
      context: 'Simulation ECOS',
      key: 'Lundi 12 octobre 2026 à 08h00 pile. Effectif de 25 candidats. Hôpital / Salle TD.',
      notes: "Arriver 15 min en avance avec carte d'étudiant et tenue médicale complète.",
    },
    {
      label: 'Recrutement 2026',
      subject: 'Confirmation de candidature — Recrutement Club Médical New Era 2026',
      context: 'Recrutement annuel',
      key: 'Dossier bien reçu. Phase d’évaluation en cours par le comité pédagogique.',
      notes: 'Les convocations pour les entretiens individuels seront envoyées sous 5 jours ouvrés.',
    },
    {
      label: 'Atelier / Workshop',
      subject: 'Confirmation de participation — Workshop Urgences & Gestes Pratiques',
      context: 'Atelier médical',
      key: 'Samedi 18 novembre 2026 à 10h00. Amphithéâtre A, Faculté de Médecine.',
      notes: 'Matériel de simulation fourni. Présence obligatoire dès 09h45 pour l’émargement.',
    },
    {
      label: 'Convocation Entretien',
      subject: 'Convocation à votre entretien de sélection — Club Médical New Era',
      context: 'Entretien oral',
      key: 'Mercredi 14 octobre 2026 à 14h30. Bureau du club / Salle de réunion B.',
      notes: 'Durée 20 minutes. Venez avec votre motivation et vos projets associatifs.',
    },
  ];

  // Generate Email
  const handleGenerate = () => {
    setStatusMessage(null);
    startGenerating(async () => {
      const res = await generateAiEmailAction({
        subject,
        contextType,
        keyInfo,
        extraNotes,
        importantNote,
        tone,
        designMode,
        infoPresentation,
      });

      if (res.success && res.result) {
        setEmailResult(res.result);
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
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Send Direct Test Email
  const handleSendTest = () => {
    if (!emailResult || !testEmailAddress) return;
    setStatusMessage(null);
    startSendingTest(async () => {
      const res = await sendAiTestEmailAction(testEmailAddress, emailResult.subject, emailResult.html);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Email de test envoyé avec succès à ${testEmailAddress} !` });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Échec de l’envoi de l’email de test.' });
      }
    });
  };

  // Attach to Form
  const handleAttachToForm = () => {
    if (!emailResult || !selectedFormSlug) return;
    setStatusMessage(null);
    startAttaching(async () => {
      const res = await attachAiEmailToFormAction(selectedFormSlug, emailResult.subject, emailResult.html);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Ce template officiel a été associé au formulaire "${selectedFormSlug}". Les futurs candidats recevront ce mail !`,
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
              Gemini 3.8 Flash &bull; Intelligence Artificielle
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
            Studio de Modèles d’Emails IA
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-0.5 max-w-2xl">
            Générez automatiquement des emails d’accusé de réception et de convocation au design sombre officiel du Club Médical New Era, testez-les en direct et personnalisez-les par de simples suggestions.
          </p>
        </div>

        {emailResult && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-[#E6DFD5] text-[#18181B] hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-xs"
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
          </div>
        )}
      </div>

      {/* Status Alert Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-between transition ${
            statusMessage.type === 'success'
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

      {/* Main Grid: Left Controls (40%) & Right Studio Preview (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Input Form & Prompt Parameters                          */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#18181B] mb-1">
              Paramètres du message
            </h2>
            <p className="text-xs text-[#52525B]">
              Choisissez un modèle type ou décrivez vos consignes pour que l’IA rédige le contenu exact.
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-2">
              Modèles rapides (suggestions de départ) :
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
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Sujet de l’email <span className="text-[#E53888]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Confirmation d'inscription — ECOS Hépato-Gastro-Entérologie"
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          {/* Context / Event Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Contexte / Événement
            </label>
            <input
              type="text"
              value={contextType}
              onChange={(e) => setContextType(e.target.value)}
              placeholder="Ex: Simulation ECOS, Recrutement, Workshop Urgences..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          {/* Key Information Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Informations clés (Date, Heure, Lieu, Salle, Effectif) <span className="text-[#E53888]">*</span>
            </label>
            <textarea
              rows={3}
              value={keyInfo}
              onChange={(e) => setKeyInfo(e.target.value)}
              placeholder="Ex: Lundi 12 octobre 2026 à 08h00. 25 candidats. Salle TD 4."
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
            <p className="text-[11px] text-[#71717A]">
              Ces informations seront insérées dans l’encadré sombre officiel &quot;INFORMATIONS CLÉS&quot;.
            </p>
          </div>

          {/* Extra Notes / Optional Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Consignes & Détails optionnels
            </label>
            <textarea
              rows={2}
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Ex: Venir 15 min en avance avec carte d'étudiant et blouse blanche..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
            />
          </div>

          {/* Design Mode Palette */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Mode visuel & Thème
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cream', label: 'Crème (Chaud)', dot: 'bg-[#F0E8DB] border-[#E3D8C6]' },
                { id: 'dark', label: 'Sombre (Nocturne)', dot: 'bg-[#0B0A11] border-[#3B2E58]' },
                { id: 'light', label: 'Clair (Minimal)', dot: 'bg-white border-[#E6DFD5]' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDesignMode(m.id as 'cream' | 'dark' | 'light')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                    designMode === m.id
                      ? 'border-[#3B33FF] bg-[#3B33FF]/10 text-[#3B33FF]'
                      : 'border-[#E6DFD5] bg-[#FAF8F5] text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border ${m.dot}`} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Presentation Style */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Présentation des informations clés
            </label>
            <select
              value={infoPresentation}
              onChange={(e) => setInfoPresentation(e.target.value as 'divider table' | '2x2 grid of small blocks' | 'vertical timeline' | 'ticket style')}
              className="w-full px-3 py-2 text-xs border border-[#D4D4D8] rounded-lg bg-white"
            >
              <option value="divider table">Tableau épuré avec séparateurs (divider table)</option>
              <option value="2x2 grid of small blocks">Grille 2x2 de cartes compactes</option>
              <option value="vertical timeline">Frise chronologique verticale (timeline)</option>
              <option value="ticket style">Style Billet / Ticket d&apos;accès découpé</option>
            </select>
          </div>

          {/* Important Note Callout */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Avertissement important (encadré d&apos;alerte)
            </label>
            <input
              type="text"
              value={importantNote}
              onChange={(e) => setImportantNote(e.target.value)}
              placeholder="Ex: Tout retard entraîne l'exclusion de l'épreuve."
              className="w-full px-3.5 py-2 text-xs border border-[#D4D4D8] rounded-lg"
            />
          </div>

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#18181B]">
              Ton du courriel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'officiel', label: 'Académique' },
                { id: 'chaleureux', label: 'Bienveillant' },
                { id: 'urgent', label: 'Rappel urgent' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as 'officiel' | 'chaleureux' | 'urgent')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition ${
                    tone === t.id
                      ? 'border-[#3B33FF] bg-[#3B33FF]/10 text-[#3B33FF]'
                      : 'border-[#E6DFD5] bg-[#FAF8F5] text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personalization tokens helper */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
            <p className="text-[11px] font-semibold text-[#18181B] mb-1">
              Variables de personnalisation automatiques :
            </p>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-[#52525B]">
              <span className="bg-white px-1.5 py-0.5 rounded border border-[#E6DFD5]">&#123;&#123;nom&#125;&#125;</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-[#E6DFD5]">&#123;&#123;prenom&#125;&#125;</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-[#E6DFD5]">&#123;&#123;email&#125;&#125;</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-[#E6DFD5]">&#123;&#123;confirmation_id&#125;&#125;</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-[#E6DFD5]">&#123;&#123;reponses&#125;&#125;</span>
            </div>
            <p className="text-[10px] text-[#71717A] mt-1.5">
              Ces balises sont automatiquement remplacées lors de l&apos;envoi réel au candidat.
            </p>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !subject.trim()}
            className="brand-gradient-btn w-full min-h-[46px] px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Génération par Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <span>✨ Générer le template avec l’IA</span>
              </>
            )}
          </button>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Studio Workspace & Interactive Refinement              */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {!emailResult ? (
            /* Empty State */
            <div className="bg-white border border-[#E6DFD5] rounded-xl p-8 sm:p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#3B33FF]/10 text-[#3B33FF] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#18181B] mb-1">
                Aucun email généré pour l&apos;instant
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B] max-w-md mx-auto mb-6">
                Renseignez le sujet et les informations clés sur le panneau de gauche, puis cliquez sur &quot;Générer le template avec l’IA&quot; pour obtenir le rendu visuel Club Médical New Era.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#18181B] hover:bg-[#27272A] transition"
              >
                Générer l&apos;exemple ECOS maintenant
              </button>
            </div>
          ) : (
            /* Generated Email Studio */
            <div className="bg-white border border-[#E6DFD5] rounded-xl overflow-hidden shadow-xs">
              {/* Studio Toolbar */}
              <div className="p-4 border-b border-[#E6DFD5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#18181B]">Aperçu de l&apos;email</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#059669]">
                    {emailResult.badge || 'New Era Club'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tabs: Preview vs Code */}
                  <div className="flex items-center border border-[#E6DFD5] rounded-lg bg-white p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-md transition ${
                        activeTab === 'preview' ? 'bg-[#18181B] text-white' : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      Aperçu Visuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`px-3 py-1 rounded-md transition ${
                        activeTab === 'code' ? 'bg-[#18181B] text-white' : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      Code HTML
                    </button>
                  </div>

                  {/* Device Switcher (in preview mode) */}
                  {activeTab === 'preview' && (
                    <div className="flex items-center border border-[#E6DFD5] rounded-lg bg-white p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        title="Vue Ordinateur"
                        className={`p-1 rounded-md transition ${
                          previewDevice === 'desktop' ? 'bg-[#3B33FF]/15 text-[#3B33FF]' : 'text-[#71717A]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        title="Vue Mobile"
                        className={`p-1 rounded-md transition ${
                          previewDevice === 'mobile' ? 'bg-[#3B33FF]/15 text-[#3B33FF]' : 'text-[#71717A]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Envelope Header Bar */}
              <div className="px-5 py-3 border-b border-[#E6DFD5] text-xs bg-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#71717A] w-12 shrink-0">De :</span>
                  <span className="font-semibold text-[#18181B]">
                    Club Médical New Era &lt;event@new-era-medical-club-univ-ouargla.dz&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#71717A] w-12 shrink-0">Objet :</span>
                  <span className="font-bold text-[#18181B]">{emailResult.subject}</span>
                </div>
                {emailResult.preheader && (
                  <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
                    <span className="w-12 shrink-0">Aperçu :</span>
                    <span className="truncate italic">{emailResult.preheader}</span>
                  </div>
                )}
              </div>

              {/* Viewport Content */}
              <div className="p-4 bg-[#27272A]/10 flex items-center justify-center min-h-[500px]">
                {activeTab === 'preview' ? (
                  <div
                    className={`transition-all duration-300 w-full overflow-hidden rounded-xl border border-[#D4D4D8] shadow-md bg-[#0F0D1B] ${
                      previewDevice === 'mobile' ? 'max-w-[400px]' : 'max-w-full'
                    }`}
                  >
                    <iframe
                      title="Aperçu Email"
                      srcDoc={emailResult.html}
                      className="w-full h-[620px] border-none bg-transparent"
                    />
                  </div>
                ) : (
                  <div className="w-full">
                    <textarea
                      readOnly
                      rows={24}
                      value={emailResult.html}
                      className="w-full font-mono text-xs p-4 bg-[#18181B] text-[#A1A1AA] rounded-xl border border-[#3F3F46] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* ================================================================ */}
              {/* INTERACTIVE REFINEMENT / SUGGESTIONS ASSISTANT                   */}
              {/* ================================================================ */}
              <div className="p-5 border-t border-[#E6DFD5] bg-[#FAF8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3B33FF]" />
                    <span className="text-xs font-bold text-[#18181B]">
                      Suggérer des modifications à l’IA
                    </span>
                  </div>
                  <span className="text-[11px] text-[#71717A]">
                    Gemini ajustera le contenu en préservant le design
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userSuggestion}
                    onChange={(e) => setUserSuggestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRefine();
                    }}
                    placeholder="Ex: Rends le texte plus court, change la date au 15 octobre, ajoute un avertissement..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-[#D4D4D8] rounded-lg bg-white focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleRefine()}
                    disabled={isRefining || !userSuggestion.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#3B33FF] hover:bg-[#322BE0] transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isRefining ? 'Ajustement...' : 'Appliquer'}
                  </button>
                </div>

                {/* Quick Refine Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#71717A]">Suggestions rapides :</span>
                  {[
                    'Rendre plus court et direct',
                    'Ajouter consigne de ponctualité 15 min',
                    'Insérer tableau de récapitulatif {{reponses}}',
                    'Ton plus chaleureux et motivant',
                    'Changer pour une variante alternative',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleRefine(s)}
                      disabled={isRefining}
                      className="px-2 py-0.5 rounded text-[11px] bg-white border border-[#E6DFD5] text-[#52525B] hover:text-[#18181B] hover:border-[#3B33FF] transition"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ================================================================ */}
              {/* ACTION BAR: Test Email & Form Attachment                         */}
              {/* ================================================================ */}
              <div className="p-5 border-t border-[#E6DFD5] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Send Test Email Form */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="email.destinataire@exemple.com"
                    className="flex-1 px-3 py-2 text-xs border border-[#D4D4D8] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isSendingTest || !testEmailAddress}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition disabled:opacity-50 shrink-0"
                  >
                    {isSendingTest ? 'Envoi...' : 'Envoyer un test'}
                  </button>
                </div>

                {/* Attach to Form Dropdown */}
                {forms.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFormSlug}
                      onChange={(e) => setSelectedFormSlug(e.target.value)}
                      className="px-3 py-2 text-xs border border-[#D4D4D8] rounded-lg bg-white"
                    >
                      {forms.map((f) => (
                        <option key={f.id} value={f.slug}>
                          {f.title} ({f.slug})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAttachToForm}
                      disabled={isAttaching || !selectedFormSlug}
                      className="brand-gradient-btn px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs disabled:opacity-50 shrink-0"
                    >
                      {isAttaching ? 'Association...' : 'Appliquer au formulaire'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
