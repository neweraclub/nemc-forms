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
  language?: 'fr' | 'ar';
  isRTL?: boolean;
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
 * Supports both French (LTR) and Arabic (RTL) dynamically with luxury, artisanal styling.
 */
const EMAIL_DESIGN_SYSTEM_PROMPT = `You are a senior email designer and front-end developer for New Era Medical Club (Faculté de Médecine d'Ouargla).
Generate ONE production-ready HTML email following the CONTENT, LANGUAGE (French or Arabic RTL), and DESIGN inputs exactly.

## CONTENT & LANGUAGE GUIDELINES
- language: French (LTR) OR Arabic (RTL) depending on the request and content.
- DYNAMIC RTL SUPPORT (MANDATORY WHEN ARABIC):
  * Root tag: <html lang="ar" dir="rtl">
  * Every table, cell, heading, and paragraph MUST have inline style: dir="rtl" style="direction: rtl; text-align: right; font-family: 'Plus Jakarta Sans', Tahoma, Arial, sans-serif;"
  * GREETING IN ARABIC: Use recipient name variable if present (e.g. "مرحباً بك {{cle}}،" or "أهلاً وسهلاً {{cle}}،"), or universal respectful greeting ("السلام عليكم ورحمة الله وبركاته،"). NEVER use French "Bonjour" in an Arabic email!
  * BADGE IN ARABIC: Translate badge to Arabic (e.g. "إشعار استلام رسمي", "تأكيد الترشح", "دعوة رسمية للمقابلة"). NEVER leave "ACCUSÉ DE RÉCEPTION" in French!
  * LATIN BRAND NAME ISOLATION: When mentioning Latin brand words like "New Era Medical Club" inside Arabic paragraphs, you MUST wrap them with:
    <span dir="ltr" style="unicode-bidi: embed; display: inline-block;">New Era Medical Club</span>
    This prevents Arabic punctuation marks (periods, commas, parentheses) from flipping to the opposite side.
  * SIGN-OFF IN ARABIC:
    مع أطيب التحيات والتمنيات بالتوفيق،<br/><strong>فريق New Era Medical Club</strong><br/><span style="font-weight: 400; font-size: 12px; color: #7A7390;">كلية الطب · جامعة قاصدي مرباح ورقلة</span>

- GREETING IN FRENCH (WHEN FRENCH): Use recipient name variable if present (e.g. "Bonjour {{cle}},"), otherwise "Bonjour,".
- SIGN-OFF IN FRENCH: "Bonne préparation," / "L'équipe New Era Medical Club" / "Excellence clinique · Innovation pédagogique".

## MANDATORY OFFICIAL HEADER & LOGO:
Insert the official New Era Medical Club logo centered at the top of the card:
<img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/logo_light_mode.png" alt="Club Médical New Era" width="130" style="display:block; max-width:140px; height:auto; margin:0 auto 14px auto; border:0;" />

## MANDATORY FOOTER WITH ONLY THE 5 OFFICIAL SOCIAL NETWORKS:
Every email MUST contain this exact table footer with ONLY these 5 official networks (no TikTok, no X/Twitter, no YouTube):
1. Site Web: http://new-era-medical-club-univ-ouargla.dz/
   Icon: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/website.png
2. Telegram: https://t.me/UOMKM
   Icon: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/telegram.png
3. Facebook: https://www.facebook.com/profile.php?id=61583732851117
   Icon: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/facebook.png
4. Instagram: https://www.instagram.com/new.eraclub3?dlrf=MTN5bmlyYmVnYjljdg==
   Icon: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/instagram.png
5. LinkedIn: https://www.linkedin.com/company/new-era-club
   Icon: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/linkedin.png

Structure:
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #E3D8C6; padding-top: 20px;">
  <tr>
    <td align="center" style="padding-bottom: 12px;">
      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #1B1740; letter-spacing: 0.05em; text-transform: uppercase;">
        [Suivez nos réseaux officiels / تابعونا على منصاتنا الرسمية]
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="padding: 0 5px;"><a href="http://new-era-medical-club-univ-ouargla.dz/" target="_blank"><img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/website.png" alt="Site Web" width="24" height="24" style="display:block; border:0;" /></a></td>
          <td style="padding: 0 5px;"><a href="https://t.me/UOMKM" target="_blank"><img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/telegram.png" alt="Telegram" width="24" height="24" style="display:block; border:0;" /></a></td>
          <td style="padding: 0 5px;"><a href="https://www.facebook.com/profile.php?id=61583732851117" target="_blank"><img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/facebook.png" alt="Facebook" width="24" height="24" style="display:block; border:0;" /></a></td>
          <td style="padding: 0 5px;"><a href="https://www.instagram.com/new.eraclub3?dlrf=MTN5bmlyYmVnYjljdg==" target="_blank"><img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/instagram.png" alt="Instagram" width="24" height="24" style="display:block; border:0;" /></a></td>
          <td style="padding: 0 5px;"><a href="https://www.linkedin.com/company/new-era-club" target="_blank"><img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/linkedin.png" alt="LinkedIn" width="24" height="24" style="display:block; border:0;" /></a></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="font-size: 11px; color: #7A7390; line-height: 1.5;">
      NEW ERA MEDICAL CLUB &bull; FACULTÉ DE MÉDECINE &bull; UNIV. OUARGLA<br/>
      &copy; 2026 New Era Club. Tous droits réservés.
    </td>
  </tr>
</table>

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

## STRICT JSON OUTPUT FORMAT:
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

function isArabicText(text?: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Generates an email template according to the Senior Email Designer specification.
 * Automatically adapts between French (LTR) and Arabic (RTL) with dynamic variable injection
 * and the 5 official social media networks.
 */
export async function generateEmailTemplate(input: EmailGenerationInput): Promise<GeneratedEmailResult> {
  const isArabic =
    input.language === 'ar' ||
    Boolean(input.isRTL) ||
    isArabicText(input.subject) ||
    isArabicText(input.title) ||
    isArabicText(input.contentPrompt) ||
    isArabicText(input.keyInfo) ||
    isArabicText(input.selectedFormTitle);

  const selectedFieldsList =
    input.selectedFields && input.selectedFields.length > 0
      ? input.selectedFields.map((f) => `  - {{${f.key}}} : intitulé "${f.label}"`).join('\n')
      : isArabic
      ? '  (لا توجد متغيرات مخصصة محددة. لا تستخدم متغيرات {{...}} وهمية، استخدم تحية عامة مثل "السلام عليكم ورحمة الله وبركاته،".)'
      : '  (Aucune variable personnalisée sélectionnée. N\'utiliser aucune variable {{...}} fictive, saluer simplement avec "Bonjour,".)';

  const userInstructions = (input.contentPrompt || input.keyInfo || '').trim();

  const prompt = `Génère UN courriel HTML de qualité production pour le New Era Medical Club selon ces paramètres :

## LOGO OFFICIEL NEW ERA MEDICAL CLUB (OBLIGATOIRE EN HAUT DU COURRIEL) :
- URL absolue du logo à insérer au tout début de l'en-tête (centré) :
  https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/logo_light_mode.png
- Balise HTML obligatoire en haut du courriel :
  <img src="https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/logo_light_mode.png" alt="Club Médical New Era" width="130" style="display:block; max-width:140px; height:auto; margin:0 auto 14px auto; border:0;" />

## FORMULAIRE ASSOCIÉ : "${input.selectedFormTitle || 'New Era Medical Club'}" (slug: /f/${input.selectedFormSlug || 'general'})

## LANGUE & DIRECTION DU COURRIEL (CRITIQUE) :
- Langue sélectionnée : ${isArabic ? 'ARABE (العربية الفصحى) avec support RTL dynamique natif' : 'FRANÇAIS (LTR)'}
- Mode RTL : ${isArabic ? 'ACTIF (dir="rtl")' : 'INACTIF (dir="ltr")'}
${
  isArabic
    ? `### RÈGLES RTL ARABE STRICTES ET IMPÉRATIVES :
1. Balise racine : <html lang="ar" dir="rtl">
2. Tous les conteneurs de texte, paragraphes et cellules de tableau doivent obligatoirement porter :
   dir="rtl" style="direction: rtl; text-align: right; font-family: 'Plus Jakarta Sans', Tahoma, 'Segoe UI', Arial, sans-serif;"
3. SALUTATION EN ARABE : Si une variable de prénom/nom figure ci-dessous (ex: {{cle}}), salue en arabe (ex: "مرحباً بك {{cle}}،" ou "أهلاً وسهلاً {{cle}}،"). Sinon, salue simplement avec "السلام عليكم ورحمة الله وبركاته،". Ne JAMAIS mettre "Bonjour" en français dans un courriel arabe !
4. BADGE EN ARABE : Rédige le badge en arabe (ex: "إشعار استلام رسمي", "تأكيد الترشح", "دعوة رسمية"). Ne JAMAIS laisser "ACCUSÉ DE RÉCEPTION" en français !
5. ISOLATION BIDI DU NOM DU CLUB : Pour tout mot en alphabet latin dans une phrase arabe (notamment "New Era Medical Club"), enveloppe-le obligatoirement dans :
   <span dir="ltr" style="unicode-bidi: embed; display: inline-block;">New Era Medical Club</span>
   pour éviter que les points, virgules et parenthèses arabes ne soient inversés ou décalés en début de ligne.
6. SIGNATURE EN ARABE :
   مع أطيب التحيات والتمنيات بالتوفيق،<br/><strong>فريق New Era Medical Club</strong><br/><span style="font-weight: 400; font-size: 12px; color: #7A7390;">كلية الطب · جامعة قاصدي مرباح ورقلة</span>`
    : `### RÈGLES FRANÇAIS :
1. Salutation : Si un champ de nom/prénom figure ci-dessous, salue avec "Bonjour {{cle}},", sinon "Bonjour,".
2. Badge : En français (ex: "ACCUSÉ DE RÉCEPTION", "CONFIRMATION D'INSCRIPTION").
3. Signature : "Bonne préparation," / "L'équipe New Era Medical Club" / "Excellence clinique · Innovation pédagogique".`
}

## VARIABLES DE PERSONNALISATION DYNAMIQUES DU FORMULAIRE :
- Variables réelles sélectionnées disponibles :
${selectedFieldsList}
- RÈGLE FONDAMENTALE DYNAMIQUE : N'utilise AUCUNE variable par défaut ni variable inventée. Ne JAMAIS insérer de variables arbitraires (comme {{prenom}} ou {{email}}) sauf si leur clé figure expressément dans la liste ci-dessus.
- Intègre élégamment les réponses des variables sélectionnées {{cle}} dans le texte ou les blocs récapitulatifs.

## CONSIGNES & CONTENU DU MESSAGE :
- subject: ${input.subject || (isArabic ? 'تأكيد استلام الطلب — New Era Medical Club' : 'Confirmation — New Era Medical Club')}
- type / contexte: ${input.contextType || (isArabic ? 'مراسلة رسمية' : 'Communication officielle')}
- title (H1): ${input.title || input.subject || (isArabic ? 'تم تسجيل طلبكم بنجاح' : 'Votre demande a bien été enregistrée')}
- eyebrow: ${input.eyebrow || input.contextType || 'NEW ERA MEDICAL CLUB'}
- instructions de contenu :
${
  userInstructions
    ? userInstructions
    : isArabic
    ? 'شكر المترشح بحرارة، تأكيد استلام طلبه بنجاح، وتزويده بالتعليمات والمراحل المقبلة بكل احترافية ووضوح.'
    : 'Remercier chaleureusement le destinataire, lui confirmer la bonne prise en compte de sa démarche et lui fournir les indications nécessaires avec professionnalisme et bienveillance.'
}
${input.importantNote ? `- note importante : ${input.importantNote}` : ''}
${input.extraNotes ? `- consignes supplémentaires : ${input.extraNotes}` : ''}
${input.buttonText ? `- bouton d'action (CTA) : "${input.buttonText}" pointant vers ${input.buttonUrl || '#'}` : '- bouton: none'}
- sign-off: ${input.signOff || (isArabic ? 'فريق New Era Medical Club' : "L'équipe New Era Medical Club")}

## PIED DE PAGE AVEC LES 5 RÉSEAUX SOCIAUX OFFICIELS (OBLIGATOIRE DANS LE CODE HTML) :
Tu DOIS inclure dans le tableau de pied de page EXACTEMENT les 5 liens et icônes officiels suivants (centrés, 24px) :
1. Site Web: http://new-era-medical-club-univ-ouargla.dz/ -> icône: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/website.png
2. Telegram: https://t.me/UOMKM -> icône: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/telegram.png
3. Facebook: https://www.facebook.com/profile.php?id=61583732851117 -> icône: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/facebook.png
4. Instagram: https://www.instagram.com/new.eraclub3?dlrf=MTN5bmlyYmVnYjljdg== -> icône: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/instagram.png
5. LinkedIn: https://www.linkedin.com/company/new-era-club -> icône: https://klggvkylzvkyhxtpwpxd.supabase.co/storage/v1/object/public/files/social_icons/linkedin.png

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
