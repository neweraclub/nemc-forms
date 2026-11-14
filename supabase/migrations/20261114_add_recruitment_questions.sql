-- ==============================================================================
-- NEW ERA MEDICAL CLUB — Recruitment Questions Seed
-- Migration: Add Medical Club Recruitment & Interview Questions
-- File: supabase/migrations/20261114_add_recruitment_questions.sql
-- ==============================================================================

INSERT INTO public.question_bank (id, label, type, category, help_text, placeholder, required, options)
VALUES
  (
    'q_recruitment_firstname',
    'الاسم (First Name)',
    'short_text',
    'المعلومات الشخصية',
    'الاسم الشخصي',
    'أدخل اسمك الشخصي',
    true,
    '[]'::jsonb
  ),
  (
    'q_recruitment_lastname',
    'اللقب (Last Name)',
    'short_text',
    'المعلومات الشخصية',
    'اللقب العائلي',
    'أدخل لقبك العائلي',
    true,
    '[]'::jsonb
  ),
  (
    'q_recruitment_specialty',
    'التخصص (Specialty)',
    'select',
    'المعلومات الشخصية',
    'اختر تخصصك الجامعي',
    'اختر التخصص',
    true,
    '[{"label": "Medicine (الطب البشري)", "value": "medicine"}, {"label": "Pharmacy (الصيدلة)", "value": "pharmacy"}, {"label": "Other (تخصص آخر)", "value": "other"}]'::jsonb
  ),
  (
    'q_recruitment_academic_year',
    'المستوى الدراسي (Academic Year)',
    'short_text',
    'المعلومات الشخصية',
    'السنة الدراسية أو المستوى الأكاديمي الحالي',
    'مثال: سنة أولى، سنة ثانية، مقيم...',
    true,
    '[]'::jsonb
  ),
  (
    'q_recruitment_phone',
    'رقم الهاتف (WhatsApp)',
    'phone',
    'المعلومات الشخصية',
    'رقم الهاتف المتاح للتواصل والمقابلة',
    '+213 6 00 00 00 00',
    true,
    '[]'::jsonb
  ),
  (
    'q_recruitment_hobbies',
    'ماهي هواياتك واهتماماتك ؟',
    'long_text',
    'المهارات والاهتمامات',
    'الهوايات، الأنشطة أو مجالات الشغف التي تفضلها في أوقات فراغك.',
    'شاركنا هواياتك واهتماماتك...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_skills',
    'ما هي المهارات (Skills) التي تمتلكها؟',
    'long_text',
    'المهارات والاهتمامات',
    'المهارات الشخصية، الفنية، التنظيمية، التقنية أو اللغوية.',
    'اذكر مهاراتك ونقاط قوتك...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_associative_exp',
    'هل لديك خبرة سابقة في العمل الجمعوي أو المشاركة في النوادي؟',
    'long_text',
    'المهارات والاهتمامات',
    'حدثنا عن تجاربك السابقة ومسؤولياتك إن وجدت.',
    'تجاربك السابقة في النوادي أو الأنشطة التطوعية...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_vision_club_to_you',
    'من وجهة نظرك، ما الذي يمكن أن يضيفه النادي إليك على المستوى الشخصي أو العلمي أو المهني؟',
    'long_text',
    'رؤيتك للنادي',
    'تطلعاتك وما تأمل في اكتسابه أو تعلمه من النادي.',
    'اكتب تطلعاتك الشخصية والعلمية والمهنية...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_vision_you_to_club',
    'ما الذي يمكنك إضافته للنادي؟ وما الإضافة التي تعتقد أنك ستقدمها له؟',
    'long_text',
    'رؤيتك للنادي',
    'القيمة المضافة، الأفكار أو المبادرات التي يمكنك تقديمها للفريق.',
    'كيف ترى مساهمتك وبصمتك في النادي...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_workshop_idea',
    'إذا مُنحت لك فرصة اقتراح وتنظيم ورشة (Workshop)، فما الموضوع الذي ستختاره؟ ولماذا؟',
    'long_text',
    'رؤيتك للنادي',
    'اقتراح لورشة عمل تدريبية أو علمية تفاعلية مع توضيح سبب اختيارها.',
    'عنوان الورشة المقترحة والأسباب والأهداف...',
    false,
    '[]'::jsonb
  ),
  (
    'q_recruitment_motivation',
    'ما الذي يحفزك للانضمام إلى هذا النادي؟',
    'long_text',
    'رؤيتك للنادي',
    'الدافع الرئيسي والشغف الذي قادك للتقديم لمقابلة الانضمام.',
    'اشرح باختصار دافعك وحماسك للانضمام...',
    true,
    '[]'::jsonb
  ),
  (
    'q_recruitment_cv_upload',
    'السيرة الذاتية (CV / Portfolio)',
    'file',
    'Justificatifs & Documents',
    'نرحّب بإرفاق سيرتك الذاتية (CV) إن توفّرت (PDF، حجم أقصى 5 ميغابايت). الأهم بالنسبة لنا هو التعرّف على شخصك وما يمكنك إضافته للفريق.',
    'اختر ملف السيرة الذاتية بصيغة PDF',
    false,
    '[]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  help_text = EXCLUDED.help_text,
  placeholder = EXCLUDED.placeholder,
  required = EXCLUDED.required,
  options = EXCLUDED.options;
