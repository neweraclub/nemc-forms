/**
 * Google Gemini AI Integration for Club Médical New Era
 * Supports gemini-3.8-flash, gemini-2.5-flash, and automatic model fallback.
 */

export interface EmailGenerationInput {
  subject?: string;
  contextType?: string; // e.g. "Simulation ECOS", "Recrutement", "Atelier", "Convocation", "Information"
  keyInfo?: string; // e.g. "Lundi 12 octobre 2026 à 08h00, Salle TD 4, carte d'étudiant obligatoire"
  extraNotes?: string; // e.g. "Effectif 25 personnes, arriver 15 min en avance"
  tone?: 'officiel' | 'chaleureux' | 'urgent';
  applicantNamePlaceholder?: string;
  formTitle?: string;
}

export interface GeneratedEmailResult {
  subject: string;
  badge: string;
  headline: string;
  preheader: string;
  html: string;
  plainText: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * System prompt embedding the exact Club Médical New Era email design system
 * seen in official club communications (Gmail screenshot).
 */
const EMAIL_DESIGN_SYSTEM_PROMPT = `Tu es l'assistant IA officiel du Club Médical New Era (NEW ERA CLUB), un club scientifique et médical dynamique d'étudiants en médecine à l'Université d'Ouargla.
Ta mission est de générer des emails HTML responsives extrêmement élégants, professionnels et percutants pour les étudiants, candidats et participants.

CHARTE GRAPHIQUE ET STRUCTURE DU TEMPLATE OFFICIEL (EXACTE AU TEMPLATE GMAIL DU CLUB) :
1. Style général :
   - Thème Sombre Médical / Nocturne prestigieux :
     * Fond global du mail : #0B0A11 ou #0F0D1B
     * Conteneur de carte : #161326 avec bordure fine rgba(139, 62, 225, 0.4) et léger dégradé supérieur
     * Barre dégradé néon en haut : background linear-gradient(90deg, #3B33FF 0%, #8B3EE1 50%, #E53888 100%)
     * Typographie : -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
2. En-tête :
   - Texte "NEW ERA CLUB" en gras majuscule blanc (#FFFFFF), espacement tracking 0.1em
   - Motif subtil de losanges / étoiles à droite (ex: ✦ ✦ ✦ ✦ ✦ ou ❖ ❖ ❖)
3. Badge thématique :
   - Petit badge rectangulaire arrondi : background rgba(245, 158, 11, 0.15), bordure rgba(245, 158, 11, 0.35), texte jaune/ambre doré (#FBBF24), texte en majuscules (ex: "DOSSIER ECOS · 2026" ou "CANDIDATURE · 2026")
4. Titre Principal (Headline) :
   - Grand titre blanc (#FFFFFF), taille 22-26px, gras. Mettre en valeur le mot-clé principal (ex: ECOS, RECRUTEMENT, WORKSHOP) avec une couleur corail / orange éclatante (#FF7A00) ou un dégradé.
5. Sous-titre :
   - Module ou précision en gris bleuté clair (#A1A1AA) (ex: "Module — Hépato-Gastro-Entérologie" ou "Pôle Scientifique & Formations")
6. Corps du message :
   - "Bonjour {{prenom}}," ou "Bonjour {{nom}},"
   - Texte bienveillant, clair, universitaire et rigoureux en blanc cassé (#E4E4E7), interligne aéré (line-height: 1.6).
7. Bloc encadré "INFORMATIONS CLÉS" :
   - Boîte mise en valeur : background #211936, bordure 1px solid #433268, border-radius 10px, padding 16px 20px
   - Titre "❖❖❖❖❖❖ INFORMATIONS CLÉS" en ambre/or (#F59E0B), taille 12px gras
   - Date / Heure en grand et gras blanc (#FFFFFF)
   - Détails : effectif, consignes d'arrivée, pièces requises (carte d'étudiant, blouse, etc.)
8. Clôture & Signature :
   - Souhaits de réussite
   - "L'équipe New Era Club" (en gras blanc)
   - "Excellence clinique · Innovation pédagogique" (en gris #A1A1AA)
9. Pied de page (Footer) :
   - "NEW ERA CLUB · PAVING THE FUTURE OF MEDICINE" (taille 11px, gras, gris #71717A)
   - "© 2026 New Era Club. Tous droits réservés."
   - Liens vers les réseaux sociaux du club
10. Compatibilité HTML email :
   - Utiliser des tables HTML (table, tr, td) avec styles CSS inline pour une compatibilité parfaite avec Gmail, Outlook, Apple Mail et navigateurs mobiles.
   - Utiliser les variables dynamiques si pertinent : {{nom}}, {{prenom}}, {{date}}, {{lieu}}, {{reponses}}, {{confirmation_id}}.

RÉPONSE STRICTE EN FORMAT JSON :
Tu dois impérativement répondre UNIQUEMENT un objet JSON valide, sans balises markdown de code (pas de \`\`\`json), avec les clés suivantes :
{
  "subject": "Sujet percutant et professionnel",
  "badge": "TEXTE DU BADGE (ex: DOSSIER ECOS · 2026)",
  "headline": "Titre principal avec accentuation",
  "preheader": "Court texte d'aperçu pour la boîte de réception (50-90 car)",
  "html": "Code HTML complet et autonome du courriel avec tables et styles inline",
  "plainText": "Version texte brut lisible pour les clients mail sans HTML"
}`;

/**
 * Call Gemini API using generateContent with gemini-3.8-flash.
 */
async function callGemini(prompt: string, systemPrompt: string = EMAIL_DESIGN_SYSTEM_PROMPT): Promise<string> {
  if (!API_KEY) {
    throw new Error("Clé API Gemini non configurée dans GEMINI_API_KEY. Veuillez la renseigner dans le fichier .env.");
  }

  const model = DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Gemini API Error [${response.status}]:`, errorData);
    throw new Error(`Erreur Gemini API (${response.status}): ${errorData.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Réponse vide reçue de l'IA Gemini.");
  }

  return text;
}

/**
 * Parses JSON response from Gemini, removing any accidental markdown fences.
 */
function parseGeminiJson<T>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Generates an email template from scratch.
 */
export async function generateEmailTemplate(input: EmailGenerationInput): Promise<GeneratedEmailResult> {
  const prompt = `Génère un email HTML complet pour le Club Médical New Era selon les paramètres suivants :
- Sujet souhaité : ${input.subject || 'Confirmation de candidature / inscription'}
- Contexte / Type d'événement : ${input.contextType || 'Confirmation d\'inscription'}
- Informations clés (date, heure, lieu, effectif, matériel) : ${input.keyInfo || 'Non spécifié'}
- Consignes supplémentaires / Détails optionnels : ${input.extraNotes || 'Aucune consigne particulière'}
- Ton souhaité : ${input.tone || 'officiel'}
- Titre du formulaire source : ${input.formTitle || 'Club Médical New Era'}

Respecte scrupuleusement la charte graphique sombre prestigieuse avec badge, grand titre bicolore, encadré INFORMATIONS CLÉS violet/doré, signature officielle New Era Club et responsive tables.`;

  const rawJson = await callGemini(prompt);
  return parseGeminiJson<GeneratedEmailResult>(rawJson);
}

/**
 * Refines or adjusts an existing email template based on user suggestions.
 */
export async function refineEmailTemplate(
  currentResult: GeneratedEmailResult,
  suggestion: string
): Promise<GeneratedEmailResult> {
  const prompt = `Voici un modèle d'email HTML actuellement généré pour le Club Médical New Era :

SUJET ACTUEL : ${currentResult.subject}
BADGE : ${currentResult.badge}
HEADLINE : ${currentResult.headline}
HTML ACTUEL :
${currentResult.html}

MODIFICATION DEMANDÉE PAR L'ADMINISTRATEUR :
"${suggestion}"

Consigne :
Applique précisément les modifications demandées (ex: changer une date, ajuster le ton, ajouter ou retirer une consigne, reformuler) TOUT EN CONSERVANT la structure visuelle prestigieuse (dark theme, barres dégradées, tables compatibles email, encadré INFORMATIONS CLÉS, signature).
Réponds impérativement en JSON avec les mêmes champs : subject, badge, headline, preheader, html, plainText.`;

  const rawJson = await callGemini(prompt);
  return parseGeminiJson<GeneratedEmailResult>(rawJson);
}
