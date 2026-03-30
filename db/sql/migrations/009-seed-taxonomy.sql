-- ============================================
-- Wave 1: Seed taxonomy — categories, subcategories, specialties
-- Must run AFTER 008-wave1-taxonomy-tiers.sql
-- ============================================

-- Step 1: Update existing categories to new consolidated slugs
-- Current DB slugs: psychology, law, accounting, nutrition, education, coaching, wellness, other
UPDATE categories SET slug = 'saude-mental-bem-estar', name_pt = 'Saúde Mental e Bem-estar Emocional', name_en = 'Mental Health & Emotional Wellbeing', icon = '🧠', sort_order = 1 WHERE slug = 'psychology';
UPDATE categories SET slug = 'saude-corpo-movimento', name_pt = 'Saúde, Corpo e Movimento', name_en = 'Health, Body & Movement', icon = '💪', sort_order = 2 WHERE slug = 'wellness';
UPDATE categories SET slug = 'educacao-desenvolvimento', name_pt = 'Educação e Desenvolvimento', name_en = 'Education & Development', icon = '📚', sort_order = 3 WHERE slug = 'education';
UPDATE categories SET slug = 'contabilidade-financas', name_pt = 'Contabilidade, Impostos e Finanças', name_en = 'Accounting, Tax & Finance', icon = '📊', sort_order = 4 WHERE slug = 'accounting';
UPDATE categories SET slug = 'direito-suporte-juridico', name_pt = 'Direito e Suporte Jurídico', name_en = 'Legal & Legal Support', icon = '⚖️', sort_order = 5 WHERE slug = 'law';
UPDATE categories SET slug = 'carreira-negocios-desenvolvimento', name_pt = 'Carreira, Negócios e Desenvolvimento Profissional', name_en = 'Career, Business & Professional Development', icon = '🚀', sort_order = 6 WHERE slug = 'coaching';

-- Delete legacy categories that merged into saude-corpo-movimento
DELETE FROM categories WHERE slug = 'nutrition';

-- Update 'other' to new slug
UPDATE categories SET slug = 'outro', name_pt = 'Outro', name_en = 'Other', icon = '🧩', sort_order = 8 WHERE slug = 'other';

-- Insert new categories
INSERT INTO categories (slug, name_pt, name_en, icon, sort_order) VALUES
  ('traducao-suporte-documental', 'Tradução e Suporte Documental', 'Translation & Document Support', '🌐', 7)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Subcategories
-- Saúde Mental
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'saude-mental-bem-estar'), 'psicologo', 'Psicólogo(a)', 'Psychologist', 1),
  ((SELECT id FROM categories WHERE slug = 'saude-mental-bem-estar'), 'terapeuta', 'Terapeuta', 'Therapist', 2),
  ((SELECT id FROM categories WHERE slug = 'saude-mental-bem-estar'), 'coach-emocional', 'Coach Emocional', 'Emotional Coach', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Saúde, Corpo e Movimento
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'saude-corpo-movimento'), 'medico', 'Médico(a)', 'Doctor', 1),
  ((SELECT id FROM categories WHERE slug = 'saude-corpo-movimento'), 'nutricionista', 'Nutricionista', 'Nutritionist', 2),
  ((SELECT id FROM categories WHERE slug = 'saude-corpo-movimento'), 'fisioterapeuta', 'Fisioterapeuta', 'Physiotherapist', 3),
  ((SELECT id FROM categories WHERE slug = 'saude-corpo-movimento'), 'personal-trainer', 'Personal Trainer', 'Personal Trainer', 4)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Educação
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'educacao-desenvolvimento'), 'professor', 'Professor(a)', 'Teacher', 1),
  ((SELECT id FROM categories WHERE slug = 'educacao-desenvolvimento'), 'tutor', 'Tutor(a)', 'Tutor', 2),
  ((SELECT id FROM categories WHERE slug = 'educacao-desenvolvimento'), 'mentor-academico', 'Mentor(a) Acadêmico(a)', 'Academic Mentor', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Contabilidade
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'contabilidade-financas'), 'contador', 'Contador(a)', 'Accountant', 1),
  ((SELECT id FROM categories WHERE slug = 'contabilidade-financas'), 'consultor-financeiro', 'Consultor(a) Financeiro(a)', 'Financial Consultant', 2),
  ((SELECT id FROM categories WHERE slug = 'contabilidade-financas'), 'especialista-tributario', 'Especialista Tributário(a)', 'Tax Specialist', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Direito
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'direito-suporte-juridico'), 'advogado', 'Advogado(a)', 'Lawyer', 1),
  ((SELECT id FROM categories WHERE slug = 'direito-suporte-juridico'), 'consultor-juridico', 'Consultor(a) Jurídico(a)', 'Legal Consultant', 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Carreira
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'carreira-negocios-desenvolvimento'), 'coach-carreira', 'Coach de Carreira', 'Career Coach', 1),
  ((SELECT id FROM categories WHERE slug = 'carreira-negocios-desenvolvimento'), 'consultor-negocios', 'Consultor(a) de Negócios', 'Business Consultant', 2),
  ((SELECT id FROM categories WHERE slug = 'carreira-negocios-desenvolvimento'), 'mentor-profissional', 'Mentor(a) Profissional', 'Professional Mentor', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Tradução
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'traducao-suporte-documental'), 'tradutor', 'Tradutor(a)', 'Translator', 1),
  ((SELECT id FROM categories WHERE slug = 'traducao-suporte-documental'), 'revisor', 'Revisor(a)', 'Reviewer/Proofreader', 2),
  ((SELECT id FROM categories WHERE slug = 'traducao-suporte-documental'), 'interprete', 'Intérprete', 'Interpreter', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Outro
INSERT INTO subcategories (category_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug = 'outro'), 'consultor-geral', 'Consultor(a) Geral', 'General Consultant', 1),
  ((SELECT id FROM categories WHERE slug = 'outro'), 'especialista-tecnico', 'Especialista Técnico(a)', 'Technical Specialist', 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Step 3: Specialties
-- Saúde Mental
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'tcc', 'Terapia Cognitivo-Comportamental', 'Cognitive Behavioral Therapy', 1),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'terapia-casal', 'Terapia de Casal', 'Couples Therapy', 2),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'terapia-familiar', 'Terapia Familiar', 'Family Therapy', 3),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'ansiedade', 'Ansiedade', 'Anxiety', 4),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'depressao', 'Depressão', 'Depression', 5),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'burnout', 'Burnout', 'Burnout', 6),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'psicanalise', 'Psicanálise', 'Psychoanalysis', 7),
  ((SELECT id FROM subcategories WHERE slug = 'psicologo'), 'orientacao-parental', 'Orientação Parental', 'Parental Guidance', 8),
  ((SELECT id FROM subcategories WHERE slug = 'terapeuta'), 'mindfulness', 'Mindfulness', 'Mindfulness', 1),
  ((SELECT id FROM subcategories WHERE slug = 'coach-emocional'), 'coaching-emocional', 'Coaching Emocional', 'Emotional Coaching', 1)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Saúde, Corpo e Movimento
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'medico'), 'clinica-geral', 'Clínica Geral', 'General Practice', 1),
  ((SELECT id FROM subcategories WHERE slug = 'medico'), 'saude-mulher', 'Saúde da Mulher', 'Women''s Health', 2),
  ((SELECT id FROM subcategories WHERE slug = 'medico'), 'saude-preventiva', 'Saúde Preventiva', 'Preventive Health', 3),
  ((SELECT id FROM subcategories WHERE slug = 'nutricionista'), 'nutricao-clinica', 'Nutrição Clínica', 'Clinical Nutrition', 1),
  ((SELECT id FROM subcategories WHERE slug = 'nutricionista'), 'emagrecimento', 'Emagrecimento Saudável', 'Healthy Weight Loss', 2),
  ((SELECT id FROM subcategories WHERE slug = 'fisioterapeuta'), 'reabilitacao', 'Reabilitação Física', 'Physical Rehabilitation', 1),
  ((SELECT id FROM subcategories WHERE slug = 'fisioterapeuta'), 'fisio-esportiva', 'Fisioterapia Esportiva', 'Sports Physiotherapy', 2),
  ((SELECT id FROM subcategories WHERE slug = 'fisioterapeuta'), 'dor-cronica', 'Dor Crônica', 'Chronic Pain', 3),
  ((SELECT id FROM subcategories WHERE slug = 'fisioterapeuta'), 'postura-ergonomia', 'Postura e Ergonomia', 'Posture & Ergonomics', 4)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Educação
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'professor'), 'reforco-escolar', 'Reforço Escolar', 'Tutoring', 1),
  ((SELECT id FROM subcategories WHERE slug = 'professor'), 'vestibular', 'Preparação para Vestibular', 'University Entrance Prep', 2),
  ((SELECT id FROM subcategories WHERE slug = 'professor'), 'idiomas', 'Aulas de Idiomas', 'Language Classes', 3),
  ((SELECT id FROM subcategories WHERE slug = 'professor'), 'matematica', 'Aulas de Matemática', 'Math Classes', 4),
  ((SELECT id FROM subcategories WHERE slug = 'tutor'), 'tecnicas-estudo', 'Técnicas de Estudo', 'Study Techniques', 1),
  ((SELECT id FROM subcategories WHERE slug = 'tutor'), 'alfabetizacao', 'Alfabetização', 'Literacy', 2),
  ((SELECT id FROM subcategories WHERE slug = 'mentor-academico'), 'mentoria-universitaria', 'Mentoria Universitária', 'University Mentoring', 1)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Contabilidade
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'contador'), 'imposto-renda', 'Imposto de Renda', 'Income Tax', 1),
  ((SELECT id FROM subcategories WHERE slug = 'contador'), 'planejamento-tributario', 'Planejamento Tributário', 'Tax Planning', 2),
  ((SELECT id FROM subcategories WHERE slug = 'contador'), 'abertura-empresa', 'Abertura de Empresa', 'Company Formation', 3),
  ((SELECT id FROM subcategories WHERE slug = 'contador'), 'mei-simples', 'MEI e Simples Nacional', 'MEI & Simples Nacional', 4),
  ((SELECT id FROM subcategories WHERE slug = 'contador'), 'contabilidade-expatriados', 'Contabilidade para Expatriados', 'Expat Accounting', 5),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-financeiro'), 'planejamento-financeiro', 'Planejamento Financeiro Pessoal', 'Personal Financial Planning', 1),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-financeiro'), 'investimentos-basicos', 'Investimentos Básicos', 'Basic Investments', 2)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Direito
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'advogado'), 'imigracao', 'Imigração', 'Immigration', 1),
  ((SELECT id FROM subcategories WHERE slug = 'advogado'), 'direito-familia', 'Direito de Família', 'Family Law', 2),
  ((SELECT id FROM subcategories WHERE slug = 'advogado'), 'direito-trabalhista', 'Direito Trabalhista', 'Labor Law', 3),
  ((SELECT id FROM subcategories WHERE slug = 'advogado'), 'direito-contratual', 'Direito Contratual', 'Contract Law', 4),
  ((SELECT id FROM subcategories WHERE slug = 'advogado'), 'direito-consumidor', 'Direito do Consumidor', 'Consumer Law', 5),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-juridico'), 'regularizacao-documental', 'Regularização Documental', 'Document Regularization', 1),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-juridico'), 'apostilamento', 'Apostilamento', 'Apostille', 2),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-juridico'), 'procuracoes', 'Procurações', 'Powers of Attorney', 3)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Carreira
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'coach-carreira'), 'mentoria-carreira', 'Mentoria de Carreira', 'Career Mentoring', 1),
  ((SELECT id FROM subcategories WHERE slug = 'coach-carreira'), 'transicao-carreira', 'Transição de Carreira', 'Career Transition', 2),
  ((SELECT id FROM subcategories WHERE slug = 'coach-carreira'), 'curriculo-linkedin', 'Currículo e LinkedIn', 'Resume & LinkedIn', 3),
  ((SELECT id FROM subcategories WHERE slug = 'coach-carreira'), 'preparacao-entrevistas', 'Preparação para Entrevistas', 'Interview Preparation', 4),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-negocios'), 'estrategia-negocios', 'Estratégia de Negócios', 'Business Strategy', 1),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-negocios'), 'marketing-profissionais', 'Marketing para Profissionais', 'Marketing for Professionals', 2),
  ((SELECT id FROM subcategories WHERE slug = 'mentor-profissional'), 'lideranca', 'Liderança', 'Leadership', 1),
  ((SELECT id FROM subcategories WHERE slug = 'mentor-profissional'), 'produtividade', 'Produtividade', 'Productivity', 2)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Tradução
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'tradutor'), 'traducao-juramentada', 'Tradução Juramentada', 'Sworn Translation', 1),
  ((SELECT id FROM subcategories WHERE slug = 'tradutor'), 'traducao-simples', 'Tradução Simples', 'Simple Translation', 2),
  ((SELECT id FROM subcategories WHERE slug = 'tradutor'), 'documentos-imigracao', 'Documentos para Imigração', 'Immigration Documents', 3),
  ((SELECT id FROM subcategories WHERE slug = 'revisor'), 'revisao-textos', 'Revisão de Textos', 'Text Review', 1),
  ((SELECT id FROM subcategories WHERE slug = 'revisor'), 'documentos-academicos', 'Documentos Acadêmicos', 'Academic Documents', 2),
  ((SELECT id FROM subcategories WHERE slug = 'interprete'), 'interpretacao-remota', 'Interpretação Remota', 'Remote Interpretation', 1)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Outro
INSERT INTO specialties (subcategory_id, slug, name_pt, name_en, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE slug = 'consultor-geral'), 'consultoria-personalizada', 'Consultoria Personalizada', 'Custom Consulting', 1),
  ((SELECT id FROM subcategories WHERE slug = 'consultor-geral'), 'orientacao-geral', 'Orientação Geral', 'General Guidance', 2),
  ((SELECT id FROM subcategories WHERE slug = 'especialista-tecnico'), 'suporte-tecnico', 'Suporte Técnico', 'Technical Support', 1),
  ((SELECT id FROM subcategories WHERE slug = 'especialista-tecnico'), 'projetos-especiais', 'Projetos Especiais', 'Special Projects', 2)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Step 4: Backfill category_id on professionals from text category field
-- Professionals have 'psicologia' as category text, which maps to the old 'psychology' slug (now 'saude-mental-bem-estar')
UPDATE professionals p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND (
    (p.category = 'psicologia' AND c.slug = 'saude-mental-bem-estar')
    OR (p.category IN ('medicina', 'nutricao', 'fisioterapia') AND c.slug = 'saude-corpo-movimento')
    OR (p.category = 'educacao' AND c.slug = 'educacao-desenvolvimento')
    OR (p.category = 'contabilidade' AND c.slug = 'contabilidade-financas')
    OR (p.category = 'direito' AND c.slug = 'direito-suporte-juridico')
    OR (p.category = 'coaching' AND c.slug = 'carreira-negocios-desenvolvimento')
    OR (p.category = c.slug)
  );
