'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ClubSocialLinks } from '@/app/components/ClubSocialLinks';

interface DocSection {
  id: string;
  category: 'sidebar' | 'fields' | 'ai' | 'layout' | 'security';
  badge: string;
  title: string;
  summary: string;
  content: React.ReactNode;
}

export function DocsClient() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const SECTIONS: DocSection[] = [
    // ------------------------------------------------------------------------
    // CATEGORY: SIDEBAR & NAVIGATION ADMIN
    // ------------------------------------------------------------------------
    {
      id: 'sidebar-forms',
      category: 'sidebar',
      badge: 'Navigation Admin',
      title: '1. Formulaires (/admin)',
      summary: 'Tableau de bord centralisant l’ensemble des formulaires créés sur la plateforme.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            Accessible aux superadmins, cette page affiche l’inventaire complet des formulaires avec leur statut en direct :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Ouvert (OPEN)</strong> : Le formulaire accepte activement les réponses des étudiants et candidats.</li>
            <li><strong>Brouillon (DRAFT)</strong> : En cours de configuration. Invisible pour les visiteurs externes.</li>
            <li><strong>Clôturé (CLOSED)</strong> : Le formulaire affiche un message courtois indiquant que la campagne est terminée.</li>
          </ul>
          <p>
            Chaque ligne permet de :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Consulter les réponses</strong> : Voir les candidatures soumises avec filtres et détails complets.</li>
            <li><strong>Modifier</strong> : Ouvrir le constructeur pour changer les questions, options ou dates.</li>
            <li><strong>Exporter CSV</strong> : Télécharger en 1 clic le tableur complet encodé UTF-8 pour Excel ou Google Sheets.</li>
            <li><strong>Supprimer</strong> : Supprimer définitivement le formulaire et ses réponses associées.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sidebar-new-form',
      category: 'sidebar',
      badge: 'Navigation Admin',
      title: '2. Créer un formulaire (/admin/forms/new)',
      summary: 'Constructeur visuel sans code pour bâtir des formulaires sur-mesure.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            Le constructeur permet de composer un formulaire interactif sans écrire la moindre ligne de code :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-1">Titre & Slug URL</span>
              Le slug (ex: <code>/f/recrutement-2026</code>) est automatiquement généré à partir du titre tout en restant personnalisable.
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-1">Capacité maximale</span>
              Optionnel. Fixez un nombre limite de candidats. Dès ce quota atteint, le formulaire se verrouille automatiquement.
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-1">Email verrouillé</span>
              Les alertes équipe sont strictement envoyées à <code>event@new-era-medical-club-univ-ouargla.dz</code>.
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-1">Accusé de réception</span>
              Active l&apos;envoi automatique d&apos;un email de confirmation immédiat au candidat lors de sa validation.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sidebar-emails',
      category: 'sidebar',
      badge: 'Navigation Admin',
      title: '3. Emails IA Gemini (/admin/emails)',
      summary: 'Studio de génération de templates d’emails propulsé par Gemini 3.8 Flash.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            Ce studio utilise le modèle de pointe <strong>Gemini 3.8 Flash</strong> pour concevoir des courriels HTML personnalisés conformes à la charte graphique officielle du Club Médical New Era :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Modes visuels</strong> : Palette <em>Crème</em> (chaleureuse #F0E8DB), <em>Sombre</em> (#0B0A11 de la capture ECOS) ou <em>Clair</em>.</li>
            <li><strong>Aperçu en direct</strong> : Iframe isolée avec bascule Grand Écran / Vue Mobile (390px).</li>
            <li><strong>Ajustement interactif</strong> : Suggérez des modifications en langage naturel (&quot;Change la date&quot;, &quot;Ajoute un stéthoscope&quot;) et l&apos;IA applique l&apos;ajustement.</li>
            <li><strong>Envoi de test</strong> : Expédiez un véritable email de test vers votre boîte de réception en 1 clic.</li>
            <li><strong>Liaison en 1 clic</strong> : Assignez le template directement au formulaire de votre choix.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sidebar-stats',
      category: 'sidebar',
      badge: 'Navigation Admin',
      title: '4. Statistiques (/admin/stats)',
      summary: 'Analyse en temps réel de la participation, des promotions et des pôles demandés.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            Offre une vue globale de l’activité pour le bureau du club :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Volume total de réponses</strong> collectées sur l’ensemble des formulaires.</li>
            <li><strong>Taux de réussite SMTP</strong> : Suivi des emails bien distribués aux candidats.</li>
            <li><strong>Répartition par année d&apos;études</strong> (1ère à 6ème année médecine, résidents, dentaire/pharmacie).</li>
            <li><strong>Popularité des pôles associatifs</strong> (Scientifique, Humanitaire, Événements, Design/Média, Sponsoring).</li>
          </ul>
        </div>
      ),
    },

    // ------------------------------------------------------------------------
    // CATEGORY: 11 TYPES DE QUESTIONS (FORM FIELDS)
    // ------------------------------------------------------------------------
    {
      id: 'field-short-text',
      category: 'fields',
      badge: 'Champ 1/11',
      title: 'Texte court (short_text)',
      summary: 'Saisie d’une ligne pour les données concises et textuelles.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Noms, prénoms, matricules d&apos;étudiants, titres d&apos;articles, promotions ou villes.</p>
          <p><strong>Validation possible :</strong> Longueur minimale (ex: 2 caractères) et maximale.</p>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded font-mono text-xs text-[#18181B]">
            Exemple : &quot;Nom complet : Sarah Benali&quot;
          </div>
        </div>
      ),
    },
    {
      id: 'field-long-text',
      category: 'fields',
      badge: 'Champ 2/11',
      title: 'Texte long / Paragraphe (long_text)',
      summary: 'Zone de texte multiligne pour les réponses développées et argumentaires.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Lettres de motivation, résumé d&apos;expérience clinique, description de projet, remarques libres.</p>
          <p><strong>Validation possible :</strong> Nombre de caractères minimum (ex: 30 caractères) pour exiger une vraie motivation.</p>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded font-mono text-xs text-[#18181B]">
            Exemple : &quot;Quelles sont vos motivations pour rejoindre le pôle Scientifique ? (Min. 30 car.)&quot;
          </div>
        </div>
      ),
    },
    {
      id: 'field-email',
      category: 'fields',
      badge: 'Champ 3/11',
      title: 'Adresse email (email)',
      summary: 'Champ avec validation syntaxique stricte et cible d’envoi d’accusé de réception.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Adresse email universitaire ou personnelle de l&apos;étudiant.</p>
          <p><strong>Rôle clé :</strong> Ce champ est automatiquement détecté par la plateforme pour envoyer l&apos;accusé de réception officiel au candidat.</p>
          <p><strong>Validation :</strong> Format RFC 5322 strict, rejet des fautes de frappe courantes.</p>
        </div>
      ),
    },
    {
      id: 'field-phone',
      category: 'fields',
      badge: 'Champ 4/11',
      title: 'Numéro de téléphone / WhatsApp (phone)',
      summary: 'Champ optimisé pour les numéros de mobiles avec pavé numérique automatique.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Coordination rapide de l&apos;équipe, convocation par WhatsApp ou SMS d&apos;urgence pour les ateliers.</p>
          <p><strong>Format attendu :</strong> 10 chiffres (ex: <code>0550 00 00 00</code>, <code>0661 ...</code>, <code>0770 ...</code>).</p>
        </div>
      ),
    },
    {
      id: 'field-number',
      category: 'fields',
      badge: 'Champ 5/11',
      title: 'Nombre (number)',
      summary: 'Saisie numérique stricte avec bornes min et max.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Année du Bac, moyenne au concours, nombre d&apos;heures de disponibilité par semaine, âge.</p>
          <p><strong>Validation :</strong> Bornes numériques strictes (ex: <code>min: 1</code>, <code>max: 40</code> heures).</p>
        </div>
      ),
    },
    {
      id: 'field-radio',
      category: 'fields',
      badge: 'Champ 6/11',
      title: 'Choix unique / Boutons radio (radio)',
      summary: 'Sélection d’une seule option parmi plusieurs, affichée directement sous forme de cartes cliquables.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Choix exclusif à haute visibilité (ex : Année d&apos;études en médecine, Régime de scolarité, Disponibilité principale).</p>
          <p><strong>Affichage :</strong> Grandes cartes cliquables modernes avec mise en surbrillance violette à la sélection.</p>
        </div>
      ),
    },
    {
      id: 'field-checkboxes',
      category: 'fields',
      badge: 'Champ 7/11',
      title: 'Choix multiples / Cases à cocher (checkboxes)',
      summary: 'Permet au candidat de cocher plusieurs choix dans une liste prédéfinie.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Choix des pôles souhaités (Scientifique, Humanitaire, Événements, Média...), journées de disponibilité de la semaine.</p>
          <p><strong>Validation :</strong> Obligation de sélectionner au moins une option si le champ est requis.</p>
        </div>
      ),
    },
    {
      id: 'field-select',
      category: 'fields',
      badge: 'Champ 8/11',
      title: 'Menu déroulant / Select (select)',
      summary: 'Menu compact pour les listes longues évitant d’alourdir le formulaire.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Liste des facultés d&apos;Algérie (Ouargla, Alger, Constantine, Oran, etc.), wilaya de résidence, service hospitalier de stage.</p>
          <p><strong>Avantage :</strong> Prend très peu de place visuelle, idéal sur smartphone.</p>
        </div>
      ),
    },
    {
      id: 'field-date',
      category: 'fields',
      badge: 'Champ 9/11',
      title: 'Date (date)',
      summary: 'Sélecteur calendaire natif sécurisé.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Date de naissance, date de début de stage d&apos;externat, date de soutenance de thèse.</p>
          <p><strong>Format :</strong> Format standardisé <code>YYYY-MM-DD</code> avec affichage localisé en français.</p>
        </div>
      ),
    },
    {
      id: 'field-file',
      category: 'fields',
      badge: 'Champ 10/11',
      title: 'Fichier / Justificatif (file)',
      summary: 'Téléversement de documents (carte d’étudiant, certificat de scolarité, CV).',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Preuve d&apos;inscription à la faculté de médecine, CV d&apos;étudiant, attestation de stage.</p>
          <p><strong>Formats acceptés :</strong> PDF, JPG, PNG (taille maximale recommandée : 5 Mo).</p>
        </div>
      ),
    },
    {
      id: 'field-consent',
      category: 'fields',
      badge: 'Champ 11/11',
      title: 'Case de consentement (consent)',
      summary: 'Case à cocher obligatoire pour l’acceptation des règles et de la politique de données.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p><strong>Usage :</strong> Déontologie médicale, respect du règlement intérieur du Club Médical New Era, consentement au traitement des données personnelles.</p>
          <p><strong>Comportement :</strong> La soumission est strictement bloquée tant que cette case n&apos;est pas explicitement cochée.</p>
        </div>
      ),
    },

    // ------------------------------------------------------------------------
    // CATEGORY: ERGONOMIE & AFFICHAGE
    // ------------------------------------------------------------------------
    {
      id: 'layout-mobile',
      category: 'layout',
      badge: 'Expérience Utilisateur',
      title: 'Affichage Mobile : Questions 3 par 3',
      summary: 'Découpage intelligent en étapes courtes de 3 questions sur smartphone.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p>
            Sur les écrans de smartphones (largeur &lt; 768px), le formulaire ne submerge pas l&apos;étudiant avec une longue page infinie. Il découpe automatiquement les questions <strong>3 par 3</strong> :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Indicateur clair : <em>« Étape 1 sur 4 (Questions 1 à 3) &bull; 0% »</em>.</li>
            <li>Boutons fluides : <em>« Précédent »</em> et <em>« Continuer (3 questions) »</em>.</li>
            <li>La validation vérifie chaque groupe avant de passer au suivant.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'layout-pc',
      category: 'layout',
      badge: 'Expérience Utilisateur',
      title: 'Affichage PC : Double volet compact',
      summary: 'Mise en page ergonomique en 2 colonnes avec volet gauche fixe.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p>
            Sur ordinateur, le formulaire tire parti de la largeur de l&apos;écran pour offrir un confort maximal :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Volet gauche (38%)</strong> : Fixé à l&apos;écran (sticky), il affiche le bandeau club, le logo, le titre, la jauge de progression en temps réel, l&apos;état de sauvegarde locale et le contact d&apos;assistance.</li>
            <li><strong>Volet droit (62%)</strong> : Grille moderne à 2 colonnes où les questions courtes (Nom, Email, Téléphone, Faculté) se placent côte à côte pour limiter le défilement.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'layout-autosave',
      category: 'layout',
      badge: 'Expérience Utilisateur',
      title: 'Sauvegarde locale automatique (Brouillons)',
      summary: 'Protection contre la perte de saisie en cas de coupure ou fermeture accidentelle.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p>
            Toutes les réponses sont immédiatement persistées dans le <code>localStorage</code> du navigateur du candidat dès chaque frappe.
          </p>
          <p>
            Si l&apos;étudiant ferme par inadvertance son onglet ou perd sa connexion, ses réponses sont instantanément restaurées à son retour avec un message : <em>« Brouillon sauvegardé à 14:32 »</em>.
          </p>
        </div>
      ),
    },

    // ------------------------------------------------------------------------
    // CATEGORY: IA GEMINI & SENIOR EMAIL DESIGNER
    // ------------------------------------------------------------------------
    {
      id: 'ai-senior-designer',
      category: 'ai',
      badge: 'IA & Email Design',
      title: 'Studio IA : Moteur Senior Email Designer',
      summary: 'Spécification du prompt Gemini pour concevoir des emails HTML professionnels et humains.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            L’API Gemini 3.8 Flash est configurée avec une directive système d’élite de <strong>Senior Email Designer & Front-End Developer</strong>. Elle garantit un rendu soigné, digne d&apos;un travail sur-mesure d’artisan numérique, sans l&apos;aspect générique d&apos;un SaaS :
          </p>
          <div className="space-y-2">
            <h4 className="font-bold text-[#18181B] text-xs uppercase tracking-wider">Entrées de Contenu (Content Input) :</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Langue</strong> : Français soigné et adapté au milieu universitaire médical.</li>
              <li><strong>Type</strong> : Confirmation d’inscription, convocation, rappel, résultats ou annonce officielle.</li>
              <li><strong>Titre (H1) & Sur-titre (Eyebrow)</strong> : Ex. « ECOS · Hépato-Gastro-Entérologie » en violet (#8B3EE1).</li>
              <li><strong>Variable de salutation</strong> : Variable littérale conservée <code>{'{{prenom}}'}</code> pour le publipostage personnalisé.</li>
              <li><strong>Informations clés (Key Info)</strong> : Paires libellé / valeur (Date et heure, Lieu, Candidats, Matériel à apporter, Heure d&apos;arrivée).</li>
              <li><strong>Alerte importante</strong> : Encadré d&apos;avertissement mis en valeur en orange (#F97316).</li>
              <li><strong>Bouton d’action</strong> : Bouton d&apos;appel à l&apos;action (ex: « Confirmer ma présence »).</li>
              <li><strong>Signature</strong> : « Bonne préparation, / L’équipe New Era Club ».</li>
            </ul>
          </div>
          <div className="space-y-2 pt-2 border-t border-[#E6DFD5]">
            <h4 className="font-bold text-[#18181B] text-xs uppercase tracking-wider">Entrées de Design (Design Input) :</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Palette Crème signature</strong> : Fond page <code>#F0E8DB</code>, carte <code>#FFFDF9</code>, bordure <code>#E3D8C6</code>, encre titres <code>#1B1740</code>, texte corps <code>#4A4460</code>, accent primaire <code>#3B33FF</code>.</li>
              <li><strong>Styles de présentation des infos</strong> : Tableau avec séparateurs fins, Grille 2x2 de blocs aérés, Timeline chronologique verticale, ou Billet / Ticket d&apos;accès.</li>
              <li><strong>Mise en valeur de la date</strong> : Grand texte coloré avec barre d’accentuation latérale gauche.</li>
              <li><strong>Compatibilité email maximale</strong> : HTML tabulaire compatible Apple Mail, Gmail (Web & Apps), Outlook et clients mobiles.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'ai-refinements',
      category: 'ai',
      badge: 'IA & Email Design',
      title: 'Ajustements itératifs en langage naturel',
      summary: 'Dialogue interactif avec l’IA pour peaufiner chaque détail du template.',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
          <p>
            Après la première génération, vous n&apos;avez pas besoin de réécrire le code HTML. Utilisez la boîte d&apos;ajustement pour guider l&apos;IA :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-0.5">« Change le lieu en Salle TD 5 »</span>
              Gemini met à jour les paires clés/valeurs sans déformer le gabarit.
            </div>
            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-0.5">« Ajoute une note sur les stéthoscopes »</span>
              L&apos;IA enrichit la section des fournitures médicales requises.
            </div>
            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-0.5">« Passe la palette en mode sombre »</span>
              La charte bascule instantanément vers un fond <code>#0B0A11</code>.
            </div>
            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD5]">
              <span className="font-semibold text-[#18181B] block mb-0.5">« Envoie un test »</span>
              Vérifiez la réception en conditions réelles avant toute diffusion massive.
            </div>
          </div>
        </div>
      ),
    },

    // ------------------------------------------------------------------------
    // CATEGORY: SÉCURITÉ & NOTIFICATIONS
    // ------------------------------------------------------------------------
    {
      id: 'security-honeypot',
      category: 'security',
      badge: 'Sécurité & Confidentialité',
      title: 'Protection Anti-Spam & Honeypot',
      summary: 'Filtrage invisible des robots sans perturber les étudiants avec des captchas.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p>
            Un champ piège (<em>honeypot</em>) invisible pour les humains mais rempli par les scripts automatisés intercepte immédiatement le spam.
          </p>
          <p>
            De plus, les adresses IP des soumissions sont transformées en hachage cryptographique non réversible <strong>HMAC SHA-256</strong>, protégeant la vie privée des étudiants tout en limitant les abus.
          </p>
        </div>
      ),
    },
    {
      id: 'security-smtp',
      category: 'security',
      badge: 'Sécurité & Confidentialité',
      title: 'Verrouillage de l’email officiel New Era Club',
      summary: 'Garantie de non-altération du canal de communication officiel.',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-[#3F3F46]">
          <p>
            Pour éviter toute fuite ou fausse configuration, l&apos;adresse de notification interne de l&apos;équipe est strictement verrouillée au niveau du code et de la base de données :
          </p>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E6DFD5] rounded font-mono text-xs text-[#18181B]">
            event@new-era-medical-club-univ-ouargla.dz
          </div>
          <p className="text-xs text-[#52525B]">
            Même si un utilisateur modifie les paramètres du formulaire, le serveur garantit que cette adresse officielle reste toujours destinataire prioritaire de chaque nouvelle candidature.
          </p>
        </div>
      ),
    },
  ];

  // Filtering logic
  const filteredSections = SECTIONS.filter((sec) => {
    const matchesCategory = activeCategory === 'all' || sec.category === activeCategory;
    const matchesQuery =
      searchQuery === '' ||
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-[#FAF6EE] text-[#18181B] pb-16">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E6DFD5] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
              <Image
                src="/logo_light_mode.png"
                alt="Club Médical New Era Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#52525B] block">
                Club Médical New Era
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#18181B] tracking-tight block">
                Documentation & Guide Plateforme
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-[#18181B] bg-white border border-[#E6DFD5] hover:bg-[#FAF8F5] px-3.5 py-2 rounded-lg transition shadow-xs"
            >
              ← Retour au Dashboard
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] hidden sm:inline-block"
            >
              Accueil public
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner (Modern Light Mode) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-[#3B33FF] via-[#8B3EE1] to-[#E53888] absolute top-0 left-0 right-0" />
          <div className="max-w-3xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#3B33FF]/10 text-[#3B33FF] mb-2">
              Guide officiel New Era Club
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#18181B] tracking-tight mb-2">
              Manuel de Référence de la Plateforme
            </h1>
            <p className="text-xs sm:text-base text-[#52525B] leading-relaxed mb-6">
              Retrouvez l’explication détaillée de chaque section de la barre latérale, le fonctionnement des 11 types de questions du constructeur, ainsi que le guide du studio d’emails IA.
            </p>

            {/* Quick Search */}
            <div className="relative max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un élément (ex: texte court, Gemini, mobile, statistiques)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#D4D4D8] rounded-xl focus:bg-white focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 transition"
              />
              <svg
                className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Toutes les rubriques' },
            { id: 'sidebar', label: 'Barre latérale (Admin)' },
            { id: 'fields', label: '11 Types de questions' },
            { id: 'ai', label: 'Studio Emails IA (Gemini)' },
            { id: 'layout', label: 'Ergonomie & Affichage' },
            { id: 'security', label: 'Sécurité & Notification' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white border border-[#E6DFD5] text-[#52525B] hover:text-[#18181B] hover:bg-[#FAF8F5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Docs Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSections.map((sec) => (
            <article
              key={sec.id}
              id={sec.id}
              className="bg-white border border-[#E6DFD5] rounded-xl p-5 sm:p-6 shadow-xs hover:border-[#3B33FF]/40 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E6DFD5] text-[#52525B]">
                  {sec.badge}
                </span>
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  #{sec.id}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-[#18181B] tracking-tight">
                {sec.title}
              </h2>

              <p className="text-xs text-[#52525B] leading-relaxed font-medium">
                {sec.summary}
              </p>

              <div className="pt-3 border-t border-[#E6DFD5]/80">
                {sec.content}
              </div>
            </article>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="bg-white border border-[#E6DFD5] rounded-xl p-10 text-center text-xs text-[#71717A]">
            Aucun résultat ne correspond à votre recherche &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 mt-12 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
        <div>
          <span>Club Médical New Era &bull; Faculté de Médecine Univ. Ouargla</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]">Réseaux officiels :</span>
          <ClubSocialLinks />
        </div>
      </footer>
    </main>
  );
}
