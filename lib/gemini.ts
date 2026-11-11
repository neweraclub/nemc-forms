/**
 * Google Gemini AI Integration for New Era Medical Club
 * Supports gemini-3.8-flash, gemini-2.5-flash, and automatic model fallback.
 */
export interface EmailGenerationInput {
  subject?: string;
  contextType?: string; // e.g. "confirmation d'inscription", "convocation", "rappel", "résultats", "annonce"
  title?: string; // e.g. "Votre inscription est confirmée."
  eyebrow?: string; // e.g. "ECOS · Hépato-Gastro-Entérologie"
  intro?: string;
  keyInfo?: string; // specific structured key-value notes if any
  contentPrompt?: string; // main flexible instructions / message to communicate
  importantNote?: string; // e.g. "Tout retard entraîne l'exclusion de l'épreuve."
  buttonText?: string;
  buttonUrl?: string;
  signOff?: string;
  designMode?: 'cream' | 'dark' | 'light';
  infoPresentation?: 'divider table' | '2x2 grid of small blocks' | 'vertical timeline' | 'ticket style';
  fontStyle?: 'Plus Jakarta Sans' | 'Inter' | 'Poppins' | 'Georgia (serif editorial)';
  headingStyle?: 'bold tight sans' | 'light large sans' | 'serif editorial';
  extraNotes?: string;
  tone?: 'officiel' | 'chaleureux' | 'urgent';
  selectedFormTitle?: string;
  selectedFormSlug?: string;
  greetingFormat?: 'fname' | 'both' | 'formal';
  selectedFields?: Array<{ key: string; label: string; placeholder?: string }>;
}

export interface GeneratedEmailResult {
  subject: string;
  badge: string;
  headline: string;
  preheader: string;
  html: string;
  plainText: string;
}

// High-stability, low-latency lighter model roster with automatic fallback on 503 / 429
const STABLE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

function getCandidateModels(): string[] {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const list: string[] = [];
  // If envModel is specified and not the deprecated/overloaded gemini-3.8-flash, include it first
  if (envModel && envModel !== 'gemini-3.8-flash' && !STABLE_MODELS.includes(envModel)) {
    list.push(envModel);
  }
  list.push(...STABLE_MODELS);
  return Array.from(new Set(list));
}

const API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Senior Email Designer System Prompt according to the official New Era Club guidelines.
 */
const EMAIL_DESIGN_SYSTEM_PROMPT = `You are a senior email designer and front-end developer. Generate ONE production-ready HTML email for the New Era Club (New Era Medical Club, Faculté de Médecine d'Ouargla). Follow the CONTENT and DESIGN inputs exactly.

## CONTENT GUIDELINES
- language: Français
- type: confirmation d'inscription / convocation / rappel / résultats / annonce
- title (H1): e.g. "Votre inscription est confirmée." or context-adapted
- greeting: Use the recipient's name variable ONLY if a name field is present in the selected dynamic variables, otherwise use a warm universal greeting like "Bonjour," without inventing non-existent variables.
- intro (1–2 sentences): warm, inspiring, university medical standard
- key info (label: value pairs):
  - Date et heure
  - Lieu / Salle
  - Candidats / Effectif
  - À apporter (blouse, carte d'étudiant, etc.)
  - Arrivée (e.g. Dès 07h45)
- important note: highlighted callout (e.g. "Tout retard entraîne l'exclusion de l'épreuve.")
- button (optional): label + URL, or "none"
- sign-off: "Bonne préparation," / "L'équipe New Era Club" / "Excellence clinique · Innovation pédagogique"

## DESIGN MODES & PALETTES
1. Mode "cream" (default luxury warm palette):
   - page background: #F0E8DB
   - card background: #FFFDF9
   - card border: 1px solid #E3D8C6
   - card radius: 12px
   - ink (headings): #1B1740
   - body text: #4A4460
   - muted labels: #7A7390
   - primary accent: #3B33FF (date/time, button)
   - secondary accent: #8B3EE1 (eyebrow / badge)
   - alert accent: #F97316 (important note only)
   - top brand bar: linear-gradient(90deg, #3B33FF 0%, #8B3EE1 50%, #E53888 100%)

2. Mode "dark" (official nocturnal high-tech medical palette):
   - page background: #0B0A11
   - card background: #161326
   - card border: 1px solid rgba(139, 62, 225, 0.4)
   - card radius: 12px
   - ink (headings): #FFFFFF
   - body text: #E4E4E7
   - muted labels: #A1A1AA
   - primary accent: #FF7A00 or #3B33FF
   - secondary accent: #FBBF24 (gold badge)
   - alert accent: #F97316
   - key info box background: #211936 with border #433268

3. Mode "light" (modern minimalist clean palette):
   - page background: #FAF6EE
   - card background: #FFFFFF
   - card border: 1px solid #E6DFD5
   - card radius: 12px
   - ink: #18181B
   - body text: #3F3F46
   - muted labels: #71717A
   - primary accent: #3B33FF

## INFO PRESENTATION STYLES
- "divider table": clean table rows separated by subtle borders
- "2x2 grid of small blocks": 2-column rounded cards inside the email table
- "vertical timeline": steps with vertical accent indicator
- "ticket style": boarding pass / event ticket cut-out styling with perforated border

## RULES (always apply)
Design quality:
- It MUST look hand-designed by a human senior front-end designer, NOT generated by generic AI or from a cookie-cutter SaaS template.
- Fully production-ready, table-based HTML with inline styles compatible with Gmail (desktop/mobile, web/app), Outlook (Windows/Mac/365), Apple Mail, and Yahoo.
- Header & Official Logo (MANDATORY IN EVERY EMAIL):
  Insert the official New Era Medical Club logo at the top of the email card:
  <img src="https://aysysyrjqhqrcqoinbgx.supabase.co/storage/v1/object/public/Html_forms/logo_light_mode.png" alt="Club Médical New Era" width="130" style="display:block; max-width:140px; height:auto; margin:0 auto 14px auto; border:0;" />
- Wordmark: "NEW ERA MEDICAL CLUB" in bold tracking 0.1em.
- Contact Inquiries: If any contact email is provided for questions, ALWAYS use "contact@new-era-medical-club-univ-ouargla.dz".
- Footer: "NEW ERA CLUB · PAVING THE FUTURE OF MEDICINE" & "© 2026 New Era Club. Tous droits réservés."

STRICT JSON OUTPUT FORMAT:
You must output ONLY valid JSON without any markdown formatting or \`\`\`json wrappers:
{
  "subject": "Email subject line",
  "badge": "EYEBROW / BADGE TEXT",
  "headline": "Main Title (H1)",
  "preheader": "Hidden preheader text (50-90 chars)",
  "html": "Full standalone production-ready HTML email code",
  "plainText": "Readable plain-text fallback version"
}`;

/**
 * Calls Gemini API with automatic model fallback & retry on 503 / 429 / 500 errors.
 * Prioritizes high-availability lightweight models for rock-solid stability.
 */
async function callGemini(prompt: string, systemPrompt: string = EMAIL_DESIGN_SYSTEM_PROMPT): Promise<string> {
  const apiKey = API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Gemini non configurée dans GEMINI_API_KEY. Veuillez la renseigner dans le fichier .env.");
  }

  const candidateModels = getCandidateModels();
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    // Retry up to 2 times for temporary 503 / 429 errors before switching to next candidate model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
          throw new Error("Réponse vide reçue de l'IA Gemini.");
        }

        const errorText = await response.text();
        console.warn(
          `[Gemini] Modèle ${model} tentative ${attempt}/2 a retourné [${response.status}]: ${errorText.slice(0, 160)}`
        );

        const isUnavailable =
          response.status === 503 ||
          response.status === 429 ||
          errorText.includes('high demand') ||
          errorText.includes('UNAVAILABLE') ||
          errorText.includes('RESOURCE_EXHAUSTED');

        if (isUnavailable && attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }

        lastError = new Error(`Erreur Gemini API (${response.status}) sur ${model}: ${errorText.slice(0, 180)}`);
        break; // Switch to next candidate model
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini] Exception sur ${model} (tentative ${attempt}/2): ${msg}`);
        lastError = err instanceof Error ? err : new Error(msg);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
  }

  throw (
    lastError ||
    new Error("Impossible de générer le courriel : tous les modèles d'IA légers sont temporairement occupés.")
  );
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
 * Generates an email template according to the Senior Email Designer specification.
 */
export async function generateEmailTemplate(input: EmailGenerationInput): Promise<GeneratedEmailResult> {
  const selectedFieldsList =
    input.selectedFields && input.selectedFields.length > 0
      ? input.selectedFields.map((f) => `  - {{${f.key}}} : intitulé "${f.label}"`).join('\n')
      : '  (Aucune variable personnalisée sélectionnée. N\'utiliser aucune variable {{...}} fictive, saluer simplement avec "Bonjour,".)';

  const userInstructions = (input.contentPrompt || input.keyInfo || '').trim();

  const prompt = `Génère UN courriel HTML de qualité production pour le New Era Medical Club selon ces paramètres :

## LOGO OFFICIEL NEW ERA MEDICAL CLUB (OBLIGATOIRE EN HAUT DU COURRIEL) :
- URL absolue du logo à insérer au tout début de l'en-tête (centré) :
  https://aysysyrjqhqrcqoinbgx.supabase.co/storage/v1/object/public/Html_forms/logo_light_mode.png
- Balise HTML obligatoire en haut du courriel :
  <img src="https://aysysyrjqhqrcqoinbgx.supabase.co/storage/v1/object/public/Html_forms/logo_light_mode.png" alt="Club Médical New Era" width="130" style="display:block; max-width:140px; height:auto; margin:0 auto 14px auto; border:0;" />

## FORMULAIRE ASSOCIÉ : "${input.selectedFormTitle || 'New Era Medical Club'}" (slug: /f/${input.selectedFormSlug || 'general'})

## VARIABLES DE PERSONNALISATION DYNAMIQUES DU FORMULAIRE :
- Variables réelles sélectionnées disponibles :
${selectedFieldsList}
- RÈGLE FONDAMENTALE DYNAMIQUE : N'utilise AUCUNE variable par défaut ni variable inventée. Ne JAMAIS insérer de variables arbitraires (comme {{prenom}} ou {{email}}) sauf si leur clé figure expressément dans la liste ci-dessus.
- Si un champ correspondant au nom ou prénom du candidat figure dans les variables sélectionnées ci-dessus, utilise sa clé pour saluer (ex: "Bonjour {{cle}},"). Sinon, salue simplement avec "Bonjour," sans variable.
- Intègre élégamment les réponses des variables sélectionnées {{cle}} dans le texte ou les blocs récapitulatifs.

## CONSIGNES & CONTENU DU MESSAGE :
- language: Français
- subject: ${input.subject || "Confirmation — New Era Medical Club"}
- type / contexte: ${input.contextType || "Communication officielle"}
- title (H1): ${input.title || input.subject || 'Votre demande a bien été enregistrée'}
- eyebrow: ${input.eyebrow || input.contextType || 'NEW ERA MEDICAL CLUB'}
- instructions de contenu :
${userInstructions ? userInstructions : "Remercier chaleureusement le destinataire, lui confirmer la bonne prise en compte de sa démarche et lui fournir les indications nécessaires avec professionnalisme et bienveillance."}
${input.importantNote ? `- note importante / avertissement : ${input.importantNote}` : ''}
${input.extraNotes ? `- consignes supplémentaires : ${input.extraNotes}` : ''}
${input.buttonText ? `- bouton d'action (CTA) : "${input.buttonText}" pointant vers ${input.buttonUrl || '#'}` : '- bouton: none'}
- sign-off: ${input.signOff || "L'équipe New Era Medical Club / Excellence clinique · Innovation pédagogique"}

## DIRECTIVES RÉDACTIONNELLES & ADAPTABILITÉ :
- Adapte la structure du courriel au CONTENU RÉEL demandé :
  * Si des dates, heures ou lieux sont mentionnés dans les consignes, présente-les dans un bloc épuré (tableau ou grille).
  * Si le courriel est une confirmation simple, un accusé de réception ou une annonce SANS date ni lieu, NE PAS inventer de fausse salle ni de fausse date d'examen. Rédige un courriel clair, valorisant et structuré.
  * Si une note importante est demandée, mets-la en avant dans un bloc discret. Sinon, n'ajoute pas de mise en garde superflue.

## DESIGN INPUT
- mode: ${input.designMode || 'cream'}
- info presentation: ${input.infoPresentation || 'divider table'}
- font: ${input.fontStyle || 'Plus Jakarta Sans'}
- heading style: ${input.headingStyle || 'bold tight sans'}
- density: compact

RÉPONDS UNIQUEMENT EN JSON VALIDE :
{
  "subject": "Objet précis et soigné de l'email",
  "badge": "BADGE D'EN-TÊTE",
  "headline": "Titre principal H1",
  "preheader": "Texte d'aperçu boîte de réception (50-90 caractères)",
  "html": "Code HTML complet pour clients de messagerie",
  "plainText": "Version texte brut"
}`;

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
  const prompt = `Voici un modèle d'email HTML du New Era Medical Club :

SUJET ACTUEL : ${currentResult.subject}
BADGE : ${currentResult.badge}
HEADLINE : ${currentResult.headline}
HTML ACTUEL :
${currentResult.html}

MODIFICATION DEMANDÉE :
"${suggestion}"

Consigne de senior email designer :
Applique précisément l'ajustement demandé en préservant le design unique, élégant et hand-crafted pour New Era Club.
Réponds impérativement en JSON avec les clés : subject, badge, headline, preheader, html, plainText.`;

  const rawJson = await callGemini(prompt);
  return parseGeminiJson<GeneratedEmailResult>(rawJson);
}
