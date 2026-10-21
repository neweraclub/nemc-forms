'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClubSocialLinks } from '@/app/components/ClubSocialLinks';

export function DocsClient() {
  const [activeId, setActiveId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'intro',
        'sidebar-nav',
        'sidebar-forms',
        'sidebar-new-form',
        'sidebar-emails',
        'sidebar-stats',
        'fields-nav',
        'field-short-text',
        'field-long-text',
        'field-email',
        'field-phone',
        'field-number',
        'field-radio',
        'field-checkboxes',
        'field-select',
        'field-date',
        'field-file',
        'field-consent',
        'ai-nav',
        'ai-senior-designer',
        'ai-refinements',
        'layout-nav',
        'layout-mobile',
        'layout-pc',
        'layout-autosave',
        'security-nav',
        'security-honeypot',
        'security-smtp',
      ];

      const scrollPosition = window.scrollY + 120;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const targets = [
      { q: 'texte court', id: 'field-short-text' },
      { q: 'texte long', id: 'field-long-text' },
      { q: 'paragraphe', id: 'field-long-text' },
      { q: 'email', id: 'field-email' },
      { q: 'telephone', id: 'field-phone' },
      { q: 'téléphone', id: 'field-phone' },
      { q: 'nombre', id: 'field-number' },
      { q: 'radio', id: 'field-radio' },
      { q: 'case', id: 'field-checkboxes' },
      { q: 'select', id: 'field-select' },
      { q: 'deroulant', id: 'field-select' },
      { q: 'déroulant', id: 'field-select' },
      { q: 'date', id: 'field-date' },
      { q: 'fichier', id: 'field-file' },
      { q: 'justificatif', id: 'field-file' },
      { q: 'consentement', id: 'field-consent' },
      { q: 'gemini', id: 'ai-senior-designer' },
      { q: 'ia', id: 'ai-senior-designer' },
      { q: 'mobile', id: 'layout-mobile' },
      { q: 'pc', id: 'layout-pc' },
      { q: 'sauvegarde', id: 'layout-autosave' },
      { q: 'statistiques', id: 'sidebar-stats' },
      { q: 'formulaires', id: 'sidebar-forms' },
      { q: 'creer', id: 'sidebar-new-form' },
      { q: 'sécurité', id: 'security-honeypot' },
      { q: 'spam', id: 'security-honeypot' },
    ];

    const match = targets.find((t) => query.includes(t.q));
    if (match) {
      scrollToSection(match.id);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-white text-[#18181B] font-sans antialiased selection:bg-[#3B33FF]/20 selection:text-[#18181B]">
      {/* 1. Official Institutional Banner */}
      <div className="bg-[#FAF8F5] border-b border-[#E6DFD5] text-[11px] text-[#52525B] px-4 sm:px-8 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Plateforme Officielle · Club Médical New Era &bull; Faculté de Médecine d&apos;Ouargla</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/admin" className="text-[#3B33FF] hover:underline font-medium">
            Accès Administration
          </Link>
          <span className="text-[#D4D4D8]">&bull;</span>
          <Link href="/" className="hover:text-[#18181B] transition">
            Portail Public
          </Link>
        </div>
      </div>

      {/* 2. Top Header Navigation (Matching the reference image) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D4D4D8] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Project Title with Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="Logo Club Médical New Era"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <Link href="/docs" className="text-lg sm:text-xl font-bold tracking-tight text-[#18181B] hover:text-[#3B33FF] transition">
                New Era Club Docs
              </Link>
              <span className="text-[11px] text-[#71717A] block font-medium">
                Manuel de Référence Technique & Guide Utilisateur
              </span>
            </div>
          </div>

          {/* Top Horizontal Links & Search Bar */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-[#52525B]">
              <button
                type="button"
                onClick={() => scrollToSection('sidebar-nav')}
                className="hover:text-[#3B33FF] transition"
              >
                Navigation Admin
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('fields-nav')}
                className="hover:text-[#3B33FF] transition"
              >
                11 Types de questions
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('ai-nav')}
                className="hover:text-[#3B33FF] transition"
              >
                Studio Emails IA
              </button>
              <Link
                href="/admin"
                className="text-[#18181B] hover:text-[#3B33FF] transition"
              >
                Dashboard
              </Link>
            </nav>

            {/* Search Input with Button (as in image) */}
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans la doc..."
                className="w-48 sm:w-64 px-3 py-1.5 text-xs bg-white border border-[#D4D4D8] border-r-0 rounded-l focus:outline-none focus:border-[#3B33FF] focus:ring-1 focus:ring-[#3B33FF]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#0A3670] hover:bg-[#082956] text-white text-xs font-semibold rounded-r border border-[#0A3670] transition flex items-center justify-center min-h-[32px]"
                title="Lancer la recherche"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 3. Main Two-Column Layout (Matching the reference image) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Hierarchical Side Navigation Menu                        */}
        {/* ==================================================================== */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="border border-[#D4D4D8] rounded-lg overflow-hidden bg-white shadow-2xs divide-y divide-[#E6DFD5]">
              {/* Category 1: Overview */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('intro')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId === 'intro'
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>Vue d&apos;ensemble</span>
                </button>
              </div>

              {/* Category 2: Navigation Admin (Parent Link) */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('sidebar-nav')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId.startsWith('sidebar')
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>Barre latérale Admin</span>
                </button>
                <div className="bg-[#FAF8F5]/60 py-1 divide-y divide-[#E6DFD5]/40 text-xs">
                  {[
                    { id: 'sidebar-forms', label: '1. Formulaires (/admin)' },
                    { id: 'sidebar-new-form', label: '2. Créer un formulaire' },
                    { id: 'sidebar-emails', label: '3. Emails IA (Gemini)' },
                    { id: 'sidebar-stats', label: '4. Statistiques (/admin/stats)' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => scrollToSection(sub.id)}
                      className={`w-full text-left pl-6 pr-3 py-1.5 text-[11px] font-medium transition block ${
                        activeId === sub.id ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 3: 11 Question Types (Parent Link) */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('fields-nav')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId.startsWith('field-') || activeId === 'fields-nav'
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>11 Types de questions</span>
                </button>
                <div className="bg-[#FAF8F5]/60 py-1 text-xs space-y-0.5">
                  {[
                    { id: 'field-short-text', label: 'Texte court' },
                    { id: 'field-long-text', label: 'Texte long / Paragraphe' },
                    { id: 'field-email', label: 'Adresse email' },
                    { id: 'field-phone', label: 'Téléphone' },
                    { id: 'field-number', label: 'Nombre' },
                    { id: 'field-radio', label: 'Choix unique (Radio)' },
                    { id: 'field-checkboxes', label: 'Choix multiples' },
                    { id: 'field-select', label: 'Menu déroulant' },
                    { id: 'field-date', label: 'Date calendaire' },
                    { id: 'field-file', label: 'Fichier / Justificatif' },
                    { id: 'field-consent', label: 'Case de consentement' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => scrollToSection(f.id)}
                      className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block truncate ${
                        activeId === f.id ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      &bull; {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category 4: AI Email Studio */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('ai-nav')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId.startsWith('ai-')
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>Emails IA & Senior Designer</span>
                </button>
                <div className="bg-[#FAF8F5]/60 py-1 text-xs space-y-0.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('ai-senior-designer')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'ai-senior-designer' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Moteur Gemini 3.8 Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('ai-refinements')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'ai-refinements' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Ajustements interactifs
                  </button>
                </div>
              </div>

              {/* Category 5: Layout & UX */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('layout-nav')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId.startsWith('layout-')
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>Ergonomie & Affichage</span>
                </button>
                <div className="bg-[#FAF8F5]/60 py-1 text-xs space-y-0.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('layout-mobile')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'layout-mobile' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Mobile : Questions 3 par 3
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('layout-pc')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'layout-pc' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; PC : Double volet fixe
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('layout-autosave')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'layout-autosave' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Sauvegarde locale (LocalStorage)
                  </button>
                </div>
              </div>

              {/* Category 6: Security & Notifications */}
              <div>
                <button
                  type="button"
                  onClick={() => scrollToSection('security-nav')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                    activeId.startsWith('security-')
                      ? 'border-l-4 border-[#0A3670] bg-[#FAF8F5] text-[#0A3670]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>Sécurité & Notifications</span>
                </button>
                <div className="bg-[#FAF8F5]/60 py-1 text-xs space-y-0.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('security-honeypot')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'security-honeypot' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Protection Honeypot & IP
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('security-smtp')}
                    className={`w-full text-left pl-6 pr-3 py-1 text-[11px] font-medium transition block ${
                      activeId === 'security-smtp' ? 'text-[#0A3670] font-bold bg-white' : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    &bull; Email officiel verrouillé
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Admin Box */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] block">
                Espace Superadmin
              </span>
              <p className="text-xs text-[#52525B]">
                Accédez directement aux outils d&apos;administration du Club Médical New Era.
              </p>
              <Link
                href="/admin"
                className="w-full inline-block text-center py-2 px-3 text-xs font-semibold text-white bg-[#0A3670] hover:bg-[#082956] rounded transition shadow-xs"
              >
                Ouvrir le Dashboard
              </Link>
            </div>
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Editorial Content (Matching the reference layout)      */}
        {/* ==================================================================== */}
        <main className="flex-1 max-w-4xl space-y-12">
          {/* SECTION: Page Heading (H1) */}
          <section id="intro" className="space-y-4 pb-6 border-b border-[#D4D4D8]">
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#18181B] tracking-tight leading-tight">
              Manuel de Référence de la Plateforme
            </h1>
            <p className="text-base sm:text-xl text-[#3F3F46] font-medium leading-relaxed max-w-3xl">
              Ce document fournit la spécification complète de l&apos;application du Club Médical New Era : rôles de chaque page dans la barre latérale, fonctionnement détaillé des 11 types de questions du constructeur, directives ergonomiques et intégration du studio d&apos;emails IA.
            </p>
          </section>

          {/* ================================================================== */}
          {/* CHAPTER 1: Navigation & Barre Latérale Admin                        */}
          {/* ================================================================== */}
          <section id="sidebar-nav" className="space-y-8 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#18181B] tracking-tight">
                1. Barre Latérale & Navigation Admin
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Le panneau d&apos;administration est structuré autour de quatre fonctions principales accessibles depuis le menu latéral fixe :
              </p>
            </div>

            {/* Subsection 1.1: Formulaires */}
            <div id="sidebar-forms" className="space-y-3 pt-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                1.1. Formulaires (<code className="text-sm font-mono text-[#0A3670]">/admin</code>)
              </h3>
              <p className="text-sm text-[#3F3F46] leading-relaxed">
                La page d&apos;accueil du tableau de bord centralise tous les formulaires déployés. Elle offre une visibilité immédiate sur les statuts d&apos;activité :
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#3F3F46]">
                <li><strong>Ouvert (OPEN)</strong> : Les candidatures et réponses sont activement acceptées.</li>
                <li><strong>Brouillon (DRAFT)</strong> : En cours de composition ; invisible pour les externes.</li>
                <li><strong>Clôturé (CLOSED)</strong> : Le formulaire affiche un message courtois indiquant la fin de la campagne.</li>
              </ul>
              <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg text-xs text-[#3F3F46] space-y-1">
                <span className="font-bold text-[#18181B] block">Actions disponibles par formulaire :</span>
                <div>&bull; <strong>Consulter les réponses</strong> : Visualisation filtrable de chaque candidature soumise.</div>
                <div>&bull; <strong>Export CSV UTF-8</strong> : Téléchargement instantané pour tableurs (Excel, Google Sheets).</div>
                <div>&bull; <strong>Édition en direct</strong> : Modification des questions, options ou quotas de places.</div>
                <div>&bull; <strong>Suppression sécurisée</strong> : Nettoyage définitif du formulaire et de ses données.</div>
              </div>
            </div>

            {/* Subsection 1.2: Créer un formulaire */}
            <div id="sidebar-new-form" className="space-y-3 pt-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                1.2. Créer un formulaire (<code className="text-sm font-mono text-[#0A3670]">/admin/forms/new</code>)
              </h3>
              <p className="text-sm text-[#3F3F46] leading-relaxed">
                Le constructeur visuel permet d&apos;agencer des formulaires personnalisés sans nécessiter la moindre compétence en programmation :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#3F3F46]">
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">Génération automatique du Slug</span>
                  L&apos;adresse publique (ex: <code>/f/recrutement-2026</code>) est automatiquement dérivée du titre du formulaire.
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">Plafond de candidatures</span>
                  Fixez une limite stricte de participants. Dès le quota atteint, le formulaire se verrouille automatiquement.
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">Notification équipe verrouillée</span>
                  Les alertes sont immuablement adressées à <code>event@new-era-medical-club-univ-ouargla.dz</code>.
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">Accusé de réception immédiat</span>
                  Expédition automatique d&apos;un courriel de confirmation dès que le candidat valide son dossier.
                </div>
              </div>
            </div>

            {/* Subsection 1.3: Emails IA */}
            <div id="sidebar-emails" className="space-y-3 pt-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                1.3. Emails IA Gemini (<code className="text-sm font-mono text-[#0A3670]">/admin/emails</code>)
              </h3>
              <p className="text-sm text-[#3F3F46] leading-relaxed">
                Studio de création de courriels propulsé par <strong>Gemini 3.8 Flash</strong>. Il combine génération assistée par intelligence artificielle et rendu de qualité artisanale senior front-end, avec bascule écran large et smartphone (390px), boîte d&apos;ajustements interactifs et envoi de test SMTP en 1 clic.
              </p>
            </div>

            {/* Subsection 1.4: Statistiques */}
            <div id="sidebar-stats" className="space-y-3 pt-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                1.4. Statistiques & Métriques (<code className="text-sm font-mono text-[#0A3670]">/admin/stats</code>)
              </h3>
              <p className="text-sm text-[#3F3F46] leading-relaxed">
                Tableau de bord d&apos;analyse pour le bureau du club : participation globale, taux de délivrabilité SMTP des emails, répartition par promotion médicale (1ère à 6ème année, résidents) et attractivité des pôles (Scientifique, Humanitaire, Événements, Design/Média, Sponsoring).
              </p>
            </div>
          </section>

          {/* ================================================================== */}
          {/* CHAPTER 2: Les 11 Types de Questions                                */}
          {/* ================================================================== */}
          <section id="fields-nav" className="space-y-8 scroll-mt-24 pt-6 border-t border-[#D4D4D8]">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#18181B] tracking-tight">
                2. Les 11 Types de Questions du Constructeur
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Le formulaire supporte 11 catégories de données adaptées aux exigences académiques et médicales :
              </p>
            </div>

            <div className="space-y-6">
              {/* Field 1 */}
              <div id="field-short-text" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">1. Texte court (short_text)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">short_text</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Noms, prénoms, matricules d&apos;étudiants, titres d&apos;articles, promotions ou villes.
                </p>
                <div className="p-2.5 bg-white border border-[#E6DFD5] rounded text-xs font-mono text-[#18181B]">
                  Exemple : &quot;Nom complet : Sarah Benali&quot;
                </div>
              </div>

              {/* Field 2 */}
              <div id="field-long-text" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">2. Texte long / Paragraphe (long_text)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">long_text</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Lettres de motivation, résumé d&apos;expérience clinique, description de projet associatif.
                </p>
                <div className="p-2.5 bg-white border border-[#E6DFD5] rounded text-xs font-mono text-[#18181B]">
                  Exemple : &quot;Quelles sont vos motivations pour rejoindre le pôle Scientifique ? (Min. 30 caractères)&quot;
                </div>
              </div>

              {/* Field 3 */}
              <div id="field-email" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">3. Adresse email (email)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">email</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Adresse email de l&apos;étudiant. Validation syntaxique RFC 5322 stricte. Sert de destinataire automatique pour l&apos;accusé de réception officiel.
                </p>
              </div>

              {/* Field 4 */}
              <div id="field-phone" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">4. Numéro de téléphone / WhatsApp (phone)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">phone</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Coordination rapide de l&apos;équipe, convocations WhatsApp pour ateliers d&apos;urgence. Déclenche automatiquement le pavé numérique mobile.
                </p>
              </div>

              {/* Field 5 */}
              <div id="field-number" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">5. Nombre (number)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">number</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Année du Bac, moyenne au concours, nombre d&apos;heures de disponibilité hebdomadaire.
                </p>
              </div>

              {/* Field 6 */}
              <div id="field-radio" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">6. Choix unique / Boutons radio (radio)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">radio</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Sélection exclusive sous forme de grandes cartes tactiles (ex: Année de médecine : 1ère à 6ème année).
                </p>
              </div>

              {/* Field 7 */}
              <div id="field-checkboxes" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">7. Choix multiples / Cases à cocher (checkboxes)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">checkboxes</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Sélection de plusieurs pôles associatifs ou créneaux de disponibilité dans la semaine.
                </p>
              </div>

              {/* Field 8 */}
              <div id="field-select" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">8. Menu déroulant / Select (select)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">select</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Liste longue compacte (ex: Faculté de médecine d&apos;origine, wilayas d&apos;Algérie).
                </p>
              </div>

              {/* Field 9 */}
              <div id="field-date" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">9. Date (date)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">date</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Sélecteur calendaire natif formaté <code>YYYY-MM-DD</code> pour dates de naissance ou début de stage hospitalier.
                </p>
              </div>

              {/* Field 10 */}
              <div id="field-file" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">10. Fichier / Justificatif (file)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">file</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Téléversement sécurisé de justificatifs (carte d&apos;étudiant, certificat de scolarité, CV PDF/PNG).
                </p>
              </div>

              {/* Field 11 */}
              <div id="field-consent" className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#18181B]">11. Case de consentement (consent)</h3>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E6DFD5] text-[#52525B]">consent</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3F46]">
                  <strong>Usage :</strong> Déontologie médicale, respect du règlement intérieur et consentement aux données personnelles. La soumission est bloquée tant que cette case n&apos;est pas cochée.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================== */}
          {/* CHAPTER 3: Studio Emails IA & Senior Designer                      */}
          {/* ================================================================== */}
          <section id="ai-nav" className="space-y-8 scroll-mt-24 pt-6 border-t border-[#D4D4D8]">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#18181B] tracking-tight">
                3. Studio d&apos;Emails IA & Senior Designer
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Le modèle <strong>Gemini 3.8 Flash</strong> opère avec une directive système stricte de <em>Senior Email Designer & Front-End Developer</em> pour concevoir des courriels conformes à l&apos;identité visuelle du Club Médical New Era :
              </p>
            </div>

            <div id="ai-senior-designer" className="space-y-4 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                3.1. Spécification des Entrées de Contenu & Design
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2">
                  <h4 className="font-bold text-[#18181B] text-xs uppercase tracking-wider">Entrées de Contenu (Content Input)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[#3F3F46]">
                    <li><strong>Langue</strong> : Français médical académique.</li>
                    <li><strong>Type</strong> : Confirmation, convocation, rappel, résultats.</li>
                    <li><strong>Titre (H1) & Eyebrow</strong> : Grand titre hiérarchisé avec sur-titre violet (#8B3EE1).</li>
                    <li><strong>Salutation littérale</strong> : Variable <code>{'{{prenom}}'}</code> conservée pour publipostage.</li>
                    <li><strong>Informations clés</strong> : Paires libellé / valeur dans un tableau aéré.</li>
                    <li><strong>Avertissement important</strong> : Encadré orange (#F97316).</li>
                    <li><strong>Bouton d&apos;action</strong> : Bouton d&apos;émargement ou de confirmation.</li>
                    <li><strong>Signature officielle</strong> : « L&apos;équipe New Era Club ».</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl space-y-2">
                  <h4 className="font-bold text-[#18181B] text-xs uppercase tracking-wider">Entrées de Design (Design Input)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[#3F3F46]">
                    <li><strong>Mode Crème (Signature)</strong> : Fond page #F0E8DB, carte #FFFDF9, bordure #E3D8C6, encre #1B1740, accent #3B33FF.</li>
                    <li><strong>Mode Sombre (Nocturne)</strong> : Fond #0B0A11, carte #161326, bordure violette subtile.</li>
                    <li><strong>Mode Clair (Minimal)</strong> : Fond #FAF6EE, carte #FFFFFF.</li>
                    <li><strong>Présentation des infos</strong> : Tableau avec séparateurs (divider table), Grille 2x2, ou Style ticket.</li>
                    <li><strong>Qualité artisanale</strong> : HTML tabulaire garanti sans aspect de template générique SaaS.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="ai-refinements" className="space-y-3 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                3.2. Ajustements Interactifs en Langage Naturel
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Sans réécrire de code HTML, suggérez des modifications via la boîte de dialogue :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 bg-white border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">« Déplace en Salle TD 5 »</span>
                  Met à jour les clés/valeurs sans altérer la mise en page.
                </div>
                <div className="p-2.5 bg-white border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">« Mentionne les stéthoscopes »</span>
                  Enrichit la section des fournitures requises.
                </div>
                <div className="p-2.5 bg-white border border-[#E6DFD5] rounded-lg">
                  <span className="font-bold text-[#18181B] block mb-1">« Passe en mode sombre »</span>
                  Bascule instantanément les styles vers la palette nocturne.
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================== */}
          {/* CHAPTER 4: Ergonomie & Affichage                                    */}
          {/* ================================================================== */}
          <section id="layout-nav" className="space-y-8 scroll-mt-24 pt-6 border-t border-[#D4D4D8]">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#18181B] tracking-tight">
                4. Ergonomie & Affichage Dynamique
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                L&apos;expérience de saisie s&apos;adapte automatiquement à la taille de l&apos;écran du répondant :
              </p>
            </div>

            <div id="layout-mobile" className="space-y-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                4.1. Affichage Mobile : Questions 3 par 3
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Sur smartphone (&lt; 768px), le formulaire segmente les questions par blocs digestes de 3 avec indication claire (ex. <em>« Étape 1 sur 4 &bull; Questions 1 à 3 »</em>) et boutons fluides <em>Précédent</em> / <em>Continuer</em>, évitant le découragement face aux longues pages.
              </p>
            </div>

            <div id="layout-pc" className="space-y-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                4.2. Affichage PC : Double Volet Fixe
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Sur ordinateur, la page exploite la largeur d&apos;écran avec un volet gauche fixe (38%) affichant le logo, la progression en temps réel et l&apos;assistance, tandis que le volet droit (62%) organise les questions courtes en grille à 2 colonnes pour minimiser le défilement.
              </p>
            </div>

            <div id="layout-autosave" className="space-y-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                4.3. Sauvegarde Locale Automatique (LocalStorage)
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Toutes les réponses saisies sont immédiatement persistées dans le navigateur du candidat. En cas de coupure de réseau ou de fermeture inopinée, les données sont instantanément restaurées au retour avec l&apos;horodatage de la sauvegarde.
              </p>
            </div>
          </section>

          {/* ================================================================== */}
          {/* CHAPTER 5: Sécurité & Confidentialité                               */}
          {/* ================================================================== */}
          <section id="security-nav" className="space-y-8 scroll-mt-24 pt-6 border-t border-[#D4D4D8]">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#18181B] tracking-tight">
                5. Sécurité, Anti-Spam & Délivrabilité
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Garanties de sécurité et d&apos;intégrité appliquées à chaque transmission :
              </p>
            </div>

            <div id="security-honeypot" className="space-y-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                5.1. Protection Anti-Spam Honeypot & Hachage IP
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Un champ piège invisible intercepte les robots automatisés sans infliger de captchas fastidieux aux étudiants. De plus, les adresses IP sont hachées avec l&apos;algorithme non réversible <strong>HMAC SHA-256</strong> pour préserver la vie privée des candidats.
              </p>
            </div>

            <div id="security-smtp" className="space-y-2 scroll-mt-24">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#18181B]">
                5.2. Verrouillage de l&apos;Email Officiel du Club
              </h3>
              <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                Pour empêcher toute fuite de données ou mauvaise configuration, l&apos;adresse destinataire de notification de l&apos;équipe est verrouillée de manière immuable au niveau du serveur :
              </p>
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DFD5] rounded font-mono text-xs text-[#18181B]">
                event@new-era-medical-club-univ-ouargla.dz
              </div>
            </div>
          </section>

          {/* Return to Top link (matching reference layout) */}
          <div className="pt-8 border-t border-[#D4D4D8]">
            <button
              type="button"
              onClick={() => scrollToSection('top')}
              className="text-xs sm:text-sm font-semibold text-[#0A3670] hover:underline flex items-center gap-1.5"
            >
              <span>↑ Revenir en haut de page (Return to top)</span>
            </button>
          </div>
        </main>
      </div>

      {/* 4. Bottom Primary Links Row (Matching the reference layout) */}
      <div className="bg-[#FAF8F5] border-t border-[#D4D4D8] mt-16 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[#18181B]">
          <Link href="/admin" className="hover:text-[#0A3670] transition">
            Tableau de bord Admin
          </Link>
          <Link href="/admin/forms/new" className="hover:text-[#0A3670] transition">
            Créer un formulaire
          </Link>
          <Link href="/admin/emails" className="hover:text-[#0A3670] transition">
            Studio Emails IA
          </Link>
          <Link href="/admin/stats" className="hover:text-[#0A3670] transition">
            Statistiques & Métriques
          </Link>
          <Link href="/" className="hover:text-[#0A3670] transition">
            Portail Public
          </Link>
        </div>
      </div>

      {/* 5. Institutional Agency Footer (Matching the reference layout) */}
      <footer className="bg-[#EAE5DE] border-t border-[#D4D4D8] text-[#18181B] py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Left: Agency Logo & Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white border border-[#D4D4D8] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="Logo Club Médical New Era"
                width={52}
                height={52}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-lg font-serif font-bold text-[#18181B] block">
                Club Médical New Era
              </span>
              <span className="text-xs text-[#52525B] block font-medium">
                Faculté de Médecine · Université Kasdi Merbah Ouargla
              </span>
              <span className="text-[11px] text-[#71717A] block mt-0.5">
                Excellence clinique &bull; Innovation pédagogique &bull; Éthique médicale
              </span>
            </div>
          </div>

          {/* Right: Social Media & Contact Center (as in reference image) */}
          <div className="flex flex-col items-start md:items-end gap-3 text-xs">
            {/* Social Icons Bar */}
            <div className="flex items-center gap-2">
              <ClubSocialLinks />
            </div>

            {/* Contact Center */}
            <div className="text-left md:text-right space-y-0.5">
              <span className="font-bold text-[#18181B] block">
                Secrétariat & Permanence Plateforme
              </span>
              <div className="font-mono text-[#3F3F46] text-xs">
                event@new-era-medical-club-univ-ouargla.dz
              </div>
              <div className="text-[11px] text-[#71717A]">
                Ouargla 30000, Algérie &bull; Tous droits réservés &copy; 2026
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
