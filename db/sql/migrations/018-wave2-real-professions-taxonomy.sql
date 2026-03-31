-- ============================================
-- Wave 2: Canonical specialty taxonomy with real professions
-- ============================================
-- Goals:
-- 1) Expand specialties to a broad list of verifiable real professions.
-- 2) Keep taxonomy organized under existing categories/subcategories.
-- 3) Backfill professional_specialties for existing professionals.
-- 4) Preserve backward compatibility by syncing professionals.subcategories.

CREATE OR REPLACE FUNCTION public.normalize_taxonomy_text(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT regexp_replace(
    lower(
      translate(
        coalesce(input_text, ''),
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      )
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
$$;

-- Backward-compatibility: some environments have legacy `subcategories`
-- created before `updated_at` existed.
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

WITH subcategories_seed(category_slug, subcategory_slug, name_pt, name_en, sort_order) AS (
  VALUES
    ('saude-mental-bem-estar', 'psicologia-clinica', 'Psicologia Clínica', 'Clinical Psychology', 1),
    ('saude-mental-bem-estar', 'psiquiatria', 'Psiquiatria', 'Psychiatry', 2),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'Terapias Especializadas', 'Specialized Therapies', 3),

    ('saude-corpo-movimento', 'medicina-clinica', 'Medicina Clínica', 'Clinical Medicine', 1),
    ('saude-corpo-movimento', 'nutricao', 'Nutrição', 'Nutrition', 2),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'Fisioterapia e Reabilitação', 'Physiotherapy & Rehabilitation', 3),
    ('saude-corpo-movimento', 'educacao-fisica', 'Educação Física', 'Physical Education', 4),

    ('educacao-desenvolvimento', 'ensino-escolar', 'Ensino Escolar', 'School Education', 1),
    ('educacao-desenvolvimento', 'idiomas', 'Idiomas', 'Languages', 2),
    ('educacao-desenvolvimento', 'orientacao-academica', 'Orientação Acadêmica', 'Academic Guidance', 3),

    ('contabilidade-financas', 'contabilidade', 'Contabilidade', 'Accounting', 1),
    ('contabilidade-financas', 'tributario-fiscal', 'Tributário e Fiscal', 'Tax & Fiscal', 2),
    ('contabilidade-financas', 'planejamento-financeiro', 'Planejamento Financeiro', 'Financial Planning', 3),

    ('direito-suporte-juridico', 'direito-civil-familia', 'Direito Civil e Família', 'Civil & Family Law', 1),
    ('direito-suporte-juridico', 'direito-trabalho-empresarial', 'Direito do Trabalho e Empresarial', 'Labor & Business Law', 2),
    ('direito-suporte-juridico', 'imigracao-documentacao', 'Imigração e Documentação', 'Immigration & Documentation', 3),

    ('carreira-negocios-desenvolvimento', 'carreira-rh', 'Carreira e RH', 'Career & HR', 1),
    ('carreira-negocios-desenvolvimento', 'negocios-gestao', 'Negócios e Gestão', 'Business & Management', 2),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'Marketing e Vendas', 'Marketing & Sales', 3),

    ('traducao-suporte-documental', 'traducao-juramentada', 'Tradução Juramentada', 'Sworn Translation', 1),
    ('traducao-suporte-documental', 'traducao-tecnica', 'Tradução Técnica', 'Technical Translation', 2),
    ('traducao-suporte-documental', 'documentacao-internacional', 'Documentação Internacional', 'International Documentation', 3),

    ('outro', 'tecnologia-digital', 'Tecnologia e Digital', 'Technology & Digital', 1),
    ('outro', 'design-comunicacao', 'Design e Comunicação', 'Design & Communication', 2),
    ('outro', 'operacoes-projetos', 'Operações e Projetos', 'Operations & Projects', 3)
)
INSERT INTO public.subcategories(category_id, slug, name_pt, name_en, sort_order, is_active)
SELECT c.id, seed.subcategory_slug, seed.name_pt, seed.name_en, seed.sort_order, true
FROM subcategories_seed seed
JOIN public.categories c ON c.slug = seed.category_slug
ON CONFLICT (category_id, slug) DO UPDATE
SET
  name_pt = EXCLUDED.name_pt,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();

WITH specialties_seed(category_slug, subcategory_slug, specialty_slug, name_pt, name_en, sort_order) AS (
  VALUES
    -- Saúde Mental e Bem-estar Emocional
    ('saude-mental-bem-estar', 'psicologia-clinica', 'psicologo-clinico', 'Psicólogo Clínico', 'Clinical Psychologist', 1),
    ('saude-mental-bem-estar', 'psicologia-clinica', 'neuropsicologo', 'Neuropsicólogo', 'Neuropsychologist', 2),
    ('saude-mental-bem-estar', 'psicologia-clinica', 'psicologo-infantil', 'Psicólogo Infantil', 'Child Psychologist', 3),
    ('saude-mental-bem-estar', 'psicologia-clinica', 'psicologo-hospitalar', 'Psicólogo Hospitalar', 'Hospital Psychologist', 4),
    ('saude-mental-bem-estar', 'psicologia-clinica', 'psicologo-organizacional', 'Psicólogo Organizacional', 'Organizational Psychologist', 5),
    ('saude-mental-bem-estar', 'psiquiatria', 'psiquiatra', 'Psiquiatra', 'Psychiatrist', 1),
    ('saude-mental-bem-estar', 'psiquiatria', 'psiquiatra-infantil', 'Psiquiatra Infantil', 'Child Psychiatrist', 2),
    ('saude-mental-bem-estar', 'psiquiatria', 'psiquiatra-geriatrico', 'Psiquiatra Geriátrico', 'Geriatric Psychiatrist', 3),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'psicoterapeuta-tcc', 'Psicoterapeuta Cognitivo-Comportamental', 'CBT Psychotherapist', 1),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'psicoterapeuta-psicanalitico', 'Psicoterapeuta Psicanalítico', 'Psychoanalytic Psychotherapist', 2),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'terapeuta-casal-familia', 'Terapeuta de Casal e Família', 'Couples and Family Therapist', 3),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'terapeuta-ocupacional-saude-mental', 'Terapeuta Ocupacional em Saúde Mental', 'Occupational Therapist - Mental Health', 4),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'arteterapeuta', 'Arteterapeuta', 'Art Therapist', 5),
    ('saude-mental-bem-estar', 'terapias-especializadas', 'psicopedagogo-clinico', 'Psicopedagogo Clínico', 'Clinical Psychopedagogue', 6),

    -- Saúde, Corpo e Movimento
    ('saude-corpo-movimento', 'medicina-clinica', 'medico-clinico-geral', 'Médico Clínico Geral', 'General Practitioner', 1),
    ('saude-corpo-movimento', 'medicina-clinica', 'pediatra', 'Pediatra', 'Pediatrician', 2),
    ('saude-corpo-movimento', 'medicina-clinica', 'ginecologista', 'Ginecologista', 'Gynecologist', 3),
    ('saude-corpo-movimento', 'medicina-clinica', 'endocrinologista', 'Endocrinologista', 'Endocrinologist', 4),
    ('saude-corpo-movimento', 'medicina-clinica', 'medico-esporte', 'Médico do Esporte', 'Sports Physician', 5),
    ('saude-corpo-movimento', 'nutricao', 'nutricionista-clinico', 'Nutricionista Clínico', 'Clinical Nutritionist', 1),
    ('saude-corpo-movimento', 'nutricao', 'nutricionista-esportivo', 'Nutricionista Esportivo', 'Sports Nutritionist', 2),
    ('saude-corpo-movimento', 'nutricao', 'nutricionista-materno-infantil', 'Nutricionista Materno-Infantil', 'Maternal and Child Nutritionist', 3),
    ('saude-corpo-movimento', 'nutricao', 'nutricionista-oncologico', 'Nutricionista Oncológico', 'Oncology Nutritionist', 4),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'fisioterapeuta-ortopedico', 'Fisioterapeuta Ortopédico', 'Orthopedic Physiotherapist', 1),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'fisioterapeuta-respiratorio', 'Fisioterapeuta Respiratório', 'Respiratory Physiotherapist', 2),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'fisioterapeuta-neurologico', 'Fisioterapeuta Neurológico', 'Neurological Physiotherapist', 3),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'fisioterapeuta-pelvico', 'Fisioterapeuta Pélvico', 'Pelvic Physiotherapist', 4),
    ('saude-corpo-movimento', 'fisioterapia-reabilitacao', 'fonoaudiologo', 'Fonoaudiólogo', 'Speech Therapist', 5),
    ('saude-corpo-movimento', 'educacao-fisica', 'profissional-educacao-fisica', 'Profissional de Educação Física', 'Physical Education Professional', 1),
    ('saude-corpo-movimento', 'educacao-fisica', 'personal-trainer', 'Personal Trainer Certificado', 'Certified Personal Trainer', 2),
    ('saude-corpo-movimento', 'educacao-fisica', 'preparador-fisico', 'Preparador Físico', 'Strength and Conditioning Coach', 3),
    ('saude-corpo-movimento', 'educacao-fisica', 'instrutor-pilates', 'Instrutor de Pilates', 'Pilates Instructor', 4),

    -- Educação e Desenvolvimento
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-matematica', 'Professor de Matemática', 'Math Teacher', 1),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-portugues', 'Professor de Português', 'Portuguese Teacher', 2),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-ciencias', 'Professor de Ciências', 'Science Teacher', 3),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-fisica', 'Professor de Física', 'Physics Teacher', 4),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-quimica', 'Professor de Química', 'Chemistry Teacher', 5),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-historia', 'Professor de História', 'History Teacher', 6),
    ('educacao-desenvolvimento', 'ensino-escolar', 'professor-geografia', 'Professor de Geografia', 'Geography Teacher', 7),
    ('educacao-desenvolvimento', 'ensino-escolar', 'pedagogo', 'Pedagogo', 'Pedagogue', 8),
    ('educacao-desenvolvimento', 'idiomas', 'professor-ingles', 'Professor de Inglês', 'English Teacher', 1),
    ('educacao-desenvolvimento', 'idiomas', 'professor-espanhol', 'Professor de Espanhol', 'Spanish Teacher', 2),
    ('educacao-desenvolvimento', 'idiomas', 'professor-frances', 'Professor de Francês', 'French Teacher', 3),
    ('educacao-desenvolvimento', 'idiomas', 'professor-alemao', 'Professor de Alemão', 'German Teacher', 4),
    ('educacao-desenvolvimento', 'orientacao-academica', 'tutor-vestibular-enem', 'Tutor para Vestibular e ENEM', 'ENEM and Admissions Tutor', 1),
    ('educacao-desenvolvimento', 'orientacao-academica', 'orientador-educacional', 'Orientador Educacional', 'Educational Counselor', 2),
    ('educacao-desenvolvimento', 'orientacao-academica', 'mentor-academico', 'Mentor Acadêmico', 'Academic Mentor', 3),
    ('educacao-desenvolvimento', 'orientacao-academica', 'psicopedagogo', 'Psicopedagogo', 'Psychopedagogue', 4),

    -- Contabilidade, Impostos e Finanças
    ('contabilidade-financas', 'contabilidade', 'contador-crc', 'Contador(a) CRC', 'Certified Accountant', 1),
    ('contabilidade-financas', 'contabilidade', 'auditor-contabil', 'Auditor Contábil', 'Accounting Auditor', 2),
    ('contabilidade-financas', 'contabilidade', 'controller-financeiro', 'Controller Financeiro', 'Financial Controller', 3),
    ('contabilidade-financas', 'contabilidade', 'perito-contabil', 'Perito Contábil', 'Forensic Accountant', 4),
    ('contabilidade-financas', 'contabilidade', 'especialista-folha-pagamento', 'Especialista em Folha de Pagamento', 'Payroll Specialist', 5),
    ('contabilidade-financas', 'tributario-fiscal', 'consultor-tributario', 'Consultor Tributário', 'Tax Consultant', 1),
    ('contabilidade-financas', 'tributario-fiscal', 'especialista-imposto-renda-pf', 'Especialista em Imposto de Renda PF', 'Personal Income Tax Specialist', 2),
    ('contabilidade-financas', 'tributario-fiscal', 'especialista-imposto-renda-pj', 'Especialista em Imposto de Renda PJ', 'Corporate Income Tax Specialist', 3),
    ('contabilidade-financas', 'tributario-fiscal', 'especialista-mei-simples', 'Especialista em MEI e Simples Nacional', 'MEI and Simples Specialist', 4),
    ('contabilidade-financas', 'tributario-fiscal', 'consultor-bpo-financeiro', 'Consultor de BPO Financeiro', 'BPO Financial Consultant', 5),
    ('contabilidade-financas', 'planejamento-financeiro', 'planejador-financeiro-cfp', 'Planejador Financeiro CFP', 'CFP Financial Planner', 1),
    ('contabilidade-financas', 'planejamento-financeiro', 'consultor-investimentos-cea', 'Consultor de Investimentos CEA', 'CEA Investment Consultant', 2),
    ('contabilidade-financas', 'planejamento-financeiro', 'analista-financeiro-corporativo', 'Analista Financeiro Corporativo', 'Corporate Financial Analyst', 3),
    ('contabilidade-financas', 'planejamento-financeiro', 'consultor-cambio-remessas', 'Consultor de Câmbio e Remessas', 'FX and Remittance Consultant', 4),

    -- Direito e Suporte Jurídico
    ('direito-suporte-juridico', 'direito-civil-familia', 'advogado-civel', 'Advogado Cível', 'Civil Lawyer', 1),
    ('direito-suporte-juridico', 'direito-civil-familia', 'advogado-familia-sucessoes', 'Advogado de Família e Sucessões', 'Family and Probate Lawyer', 2),
    ('direito-suporte-juridico', 'direito-civil-familia', 'advogado-consumidor', 'Advogado do Consumidor', 'Consumer Lawyer', 3),
    ('direito-suporte-juridico', 'direito-civil-familia', 'advogado-previdenciario', 'Advogado Previdenciário', 'Social Security Lawyer', 4),
    ('direito-suporte-juridico', 'direito-trabalho-empresarial', 'advogado-trabalhista', 'Advogado Trabalhista', 'Labor Lawyer', 1),
    ('direito-suporte-juridico', 'direito-trabalho-empresarial', 'advogado-empresarial', 'Advogado Empresarial', 'Business Lawyer', 2),
    ('direito-suporte-juridico', 'direito-trabalho-empresarial', 'advogado-contratual', 'Advogado Contratual', 'Contract Lawyer', 3),
    ('direito-suporte-juridico', 'direito-trabalho-empresarial', 'advogado-tributario', 'Advogado Tributário', 'Tax Lawyer', 4),
    ('direito-suporte-juridico', 'imigracao-documentacao', 'advogado-imigracao', 'Advogado de Imigração', 'Immigration Lawyer', 1),
    ('direito-suporte-juridico', 'imigracao-documentacao', 'consultor-regularizacao-migratoria', 'Consultor em Regularização Migratória', 'Migration Regularization Consultant', 2),
    ('direito-suporte-juridico', 'imigracao-documentacao', 'especialista-cidadania', 'Especialista em Cidadania e Nacionalidade', 'Citizenship Specialist', 3),
    ('direito-suporte-juridico', 'imigracao-documentacao', 'paralegal-documental', 'Paralegal Documental', 'Paralegal Specialist', 4),

    -- Carreira, Negócios e Desenvolvimento Profissional
    ('carreira-negocios-desenvolvimento', 'carreira-rh', 'consultor-carreira', 'Consultor de Carreira', 'Career Consultant', 1),
    ('carreira-negocios-desenvolvimento', 'carreira-rh', 'headhunter-recruiter', 'Headhunter / Recruiter', 'Headhunter / Recruiter', 2),
    ('carreira-negocios-desenvolvimento', 'carreira-rh', 'especialista-rh-estrategico', 'Especialista em RH Estratégico', 'Strategic HR Specialist', 3),
    ('carreira-negocios-desenvolvimento', 'carreira-rh', 'mentor-lideranca', 'Mentor de Liderança', 'Leadership Mentor', 4),
    ('carreira-negocios-desenvolvimento', 'negocios-gestao', 'consultor-gestao-empresarial', 'Consultor de Gestão Empresarial', 'Business Management Consultant', 1),
    ('carreira-negocios-desenvolvimento', 'negocios-gestao', 'consultor-processos', 'Consultor de Processos', 'Process Consultant', 2),
    ('carreira-negocios-desenvolvimento', 'negocios-gestao', 'consultor-estrategia', 'Consultor de Estratégia', 'Strategy Consultant', 3),
    ('carreira-negocios-desenvolvimento', 'negocios-gestao', 'consultor-product-management', 'Consultor de Product Management', 'Product Management Consultant', 4),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'consultor-marketing-digital', 'Consultor de Marketing Digital', 'Digital Marketing Consultant', 1),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'especialista-growth-marketing', 'Especialista em Growth Marketing', 'Growth Marketing Specialist', 2),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'consultor-vendas-b2b', 'Consultor de Vendas B2B', 'B2B Sales Consultant', 3),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'especialista-crm-funil', 'Especialista em CRM e Funil de Vendas', 'CRM and Funnel Specialist', 4),
    ('carreira-negocios-desenvolvimento', 'marketing-vendas', 'mentor-empreendedorismo', 'Mentor de Empreendedorismo', 'Entrepreneurship Mentor', 5),

    -- Tradução e Suporte Documental
    ('traducao-suporte-documental', 'traducao-juramentada', 'tradutor-juramentado', 'Tradutor Juramentado', 'Sworn Translator', 1),
    ('traducao-suporte-documental', 'traducao-juramentada', 'tradutor-juridico', 'Tradutor Jurídico', 'Legal Translator', 2),
    ('traducao-suporte-documental', 'traducao-juramentada', 'interprete-conferencia', 'Intérprete de Conferência', 'Conference Interpreter', 3),
    ('traducao-suporte-documental', 'traducao-tecnica', 'tradutor-tecnico', 'Tradutor Técnico', 'Technical Translator', 1),
    ('traducao-suporte-documental', 'traducao-tecnica', 'tradutor-medico-cientifico', 'Tradutor Médico-Científico', 'Medical and Scientific Translator', 2),
    ('traducao-suporte-documental', 'traducao-tecnica', 'revisor-texto-profissional', 'Revisor de Texto Profissional', 'Professional Proofreader', 3),
    ('traducao-suporte-documental', 'traducao-tecnica', 'interprete-comunitario', 'Intérprete Comunitário', 'Community Interpreter', 4),
    ('traducao-suporte-documental', 'documentacao-internacional', 'consultor-documentacao-imigracao', 'Consultor de Documentação para Imigração', 'Immigration Documentation Consultant', 1),
    ('traducao-suporte-documental', 'documentacao-internacional', 'especialista-apostilamento-haia', 'Especialista em Apostilamento de Haia', 'Apostille Specialist', 2),
    ('traducao-suporte-documental', 'documentacao-internacional', 'consultor-equivalencia-diploma', 'Consultor de Equivalência de Diploma', 'Diploma Equivalency Consultant', 3),

    -- Outro
    ('outro', 'tecnologia-digital', 'desenvolvedor-software', 'Desenvolvedor de Software', 'Software Developer', 1),
    ('outro', 'tecnologia-digital', 'engenheiro-dados', 'Engenheiro de Dados', 'Data Engineer', 2),
    ('outro', 'tecnologia-digital', 'cientista-dados', 'Cientista de Dados', 'Data Scientist', 3),
    ('outro', 'tecnologia-digital', 'analista-seguranca-informacao', 'Analista de Segurança da Informação', 'Information Security Analyst', 4),
    ('outro', 'tecnologia-digital', 'arquiteto-cloud', 'Arquiteto de Soluções Cloud', 'Cloud Solutions Architect', 5),
    ('outro', 'design-comunicacao', 'designer-ux-ui', 'Designer UX/UI', 'UX/UI Designer', 1),
    ('outro', 'design-comunicacao', 'designer-grafico', 'Designer Gráfico', 'Graphic Designer', 2),
    ('outro', 'design-comunicacao', 'copywriter', 'Copywriter', 'Copywriter', 3),
    ('outro', 'design-comunicacao', 'especialista-seo', 'Especialista em SEO', 'SEO Specialist', 4),
    ('outro', 'operacoes-projetos', 'gestor-projetos-pmp', 'Gestor de Projetos (PMP)', 'Project Manager (PMP)', 1),
    ('outro', 'operacoes-projetos', 'product-manager', 'Product Manager', 'Product Manager', 2),
    ('outro', 'operacoes-projetos', 'scrum-master', 'Scrum Master', 'Scrum Master', 3),
    ('outro', 'operacoes-projetos', 'consultor-automacao-processos', 'Consultor de Automação de Processos', 'Process Automation Consultant', 4),
    ('outro', 'operacoes-projetos', 'especialista-suporte-tecnico-corporativo', 'Especialista em Suporte Técnico Corporativo', 'Corporate Technical Support Specialist', 5)
)
INSERT INTO public.specialties(subcategory_id, slug, name_pt, name_en, sort_order, is_active)
SELECT sc.id, seed.specialty_slug, seed.name_pt, seed.name_en, seed.sort_order, true
FROM specialties_seed seed
JOIN public.categories c ON c.slug = seed.category_slug
JOIN public.subcategories sc ON sc.category_id = c.id AND sc.slug = seed.subcategory_slug
ON CONFLICT (subcategory_id, slug) DO UPDATE
SET
  name_pt = EXCLUDED.name_pt,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

CREATE INDEX IF NOT EXISTS specialties_name_pt_idx ON public.specialties (name_pt);
CREATE INDEX IF NOT EXISTS professional_specialties_professional_idx ON public.professional_specialties (professional_id);

-- Backfill by exact/normalized specialty name from professional applications
INSERT INTO public.professional_specialties (professional_id, specialty_id)
SELECT DISTINCT pa.professional_id, s.id
FROM public.professional_applications pa
JOIN public.specialties s
  ON public.normalize_taxonomy_text(s.name_pt) = public.normalize_taxonomy_text(pa.specialty_name)
WHERE pa.professional_id IS NOT NULL
  AND pa.specialty_name IS NOT NULL
  AND btrim(pa.specialty_name) <> ''
ON CONFLICT (professional_id, specialty_id) DO NOTHING;

-- Backfill by current professionals arrays (subcategories + tags) matching specialty name
WITH candidate_terms AS (
  SELECT
    p.id AS professional_id,
    unnest(
      coalesce(p.subcategories, '{}'::TEXT[])
      || coalesce(p.tags, '{}'::TEXT[])
    ) AS raw_term
  FROM public.professionals p
),
matched_specialties AS (
  SELECT DISTINCT ct.professional_id, s.id AS specialty_id
  FROM candidate_terms ct
  JOIN public.specialties s
    ON public.normalize_taxonomy_text(s.name_pt) = public.normalize_taxonomy_text(ct.raw_term)
  WHERE btrim(coalesce(ct.raw_term, '')) <> ''
)
INSERT INTO public.professional_specialties (professional_id, specialty_id)
SELECT professional_id, specialty_id
FROM matched_specialties
ON CONFLICT (professional_id, specialty_id) DO NOTHING;

-- Fallback: ensure each professional has at least one specialty based on category mapping
WITH professional_category_map AS (
  SELECT
    p.id AS professional_id,
    CASE
      WHEN p.category IN ('saude-mental-bem-estar', 'psicologia', 'psychology') THEN 'saude-mental-bem-estar'
      WHEN p.category IN ('saude-corpo-movimento', 'medicina', 'nutricao', 'fisioterapia', 'wellness', 'nutrition') THEN 'saude-corpo-movimento'
      WHEN p.category IN ('educacao-desenvolvimento', 'educacao', 'education') THEN 'educacao-desenvolvimento'
      WHEN p.category IN ('contabilidade-financas', 'contabilidade', 'accounting') THEN 'contabilidade-financas'
      WHEN p.category IN ('direito-suporte-juridico', 'direito', 'law') THEN 'direito-suporte-juridico'
      WHEN p.category IN ('carreira-negocios-desenvolvimento', 'coaching') THEN 'carreira-negocios-desenvolvimento'
      WHEN p.category IN ('traducao-suporte-documental') THEN 'traducao-suporte-documental'
      ELSE 'outro'
    END AS category_slug
  FROM public.professionals p
),
fallback_specialty AS (
  SELECT
    pcm.professional_id,
    (
      SELECT s.id
      FROM public.specialties s
      JOIN public.subcategories sc ON sc.id = s.subcategory_id
      JOIN public.categories c ON c.id = sc.category_id
      WHERE c.slug = pcm.category_slug
        AND c.is_active = true
        AND sc.is_active = true
        AND s.is_active = true
      ORDER BY sc.sort_order ASC, s.sort_order ASC
      LIMIT 1
    ) AS specialty_id
  FROM professional_category_map pcm
)
INSERT INTO public.professional_specialties (professional_id, specialty_id)
SELECT fs.professional_id, fs.specialty_id
FROM fallback_specialty fs
WHERE fs.specialty_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.professional_specialties ps
    WHERE ps.professional_id = fs.professional_id
  )
ON CONFLICT (professional_id, specialty_id) DO NOTHING;

-- Keep legacy subcategories array aligned for compatibility surfaces
WITH ranked_specialties AS (
  SELECT
    ps.professional_id,
    s.name_pt,
    row_number() OVER (
      PARTITION BY ps.professional_id
      ORDER BY sc.sort_order ASC, s.sort_order ASC, s.name_pt ASC
    ) AS rn
  FROM public.professional_specialties ps
  JOIN public.specialties s ON s.id = ps.specialty_id
  JOIN public.subcategories sc ON sc.id = s.subcategory_id
),
aggregated AS (
  SELECT
    professional_id,
    array_agg(name_pt ORDER BY rn) AS specialty_names
  FROM ranked_specialties
  WHERE rn <= 5
  GROUP BY professional_id
)
UPDATE public.professionals p
SET
  subcategories = aggregated.specialty_names,
  updated_at = NOW()
FROM aggregated
WHERE aggregated.professional_id = p.id;

-- Backfill category_id where missing
WITH category_map AS (
  SELECT
    p.id AS professional_id,
    c.id AS category_id
  FROM public.professionals p
  JOIN public.categories c ON c.slug = CASE
    WHEN p.category IN ('saude-mental-bem-estar', 'psicologia', 'psychology') THEN 'saude-mental-bem-estar'
    WHEN p.category IN ('saude-corpo-movimento', 'medicina', 'nutricao', 'fisioterapia', 'wellness', 'nutrition') THEN 'saude-corpo-movimento'
    WHEN p.category IN ('educacao-desenvolvimento', 'educacao', 'education') THEN 'educacao-desenvolvimento'
    WHEN p.category IN ('contabilidade-financas', 'contabilidade', 'accounting') THEN 'contabilidade-financas'
    WHEN p.category IN ('direito-suporte-juridico', 'direito', 'law') THEN 'direito-suporte-juridico'
    WHEN p.category IN ('carreira-negocios-desenvolvimento', 'coaching') THEN 'carreira-negocios-desenvolvimento'
    WHEN p.category IN ('traducao-suporte-documental') THEN 'traducao-suporte-documental'
    ELSE 'outro'
  END
)
UPDATE public.professionals p
SET category_id = cm.category_id
FROM category_map cm
WHERE p.id = cm.professional_id
  AND p.category_id IS NULL;

-- Keep specialty links updated for future professional signups/updates.
CREATE OR REPLACE FUNCTION public.sync_professional_application_specialty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _specialty_id UUID;
BEGIN
  IF NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.specialty_name IS NULL OR btrim(NEW.specialty_name) = '' THEN
    RETURN NEW;
  END IF;

  SELECT s.id
  INTO _specialty_id
  FROM public.specialties s
  WHERE s.is_active = true
    AND public.normalize_taxonomy_text(s.name_pt) = public.normalize_taxonomy_text(NEW.specialty_name)
  ORDER BY s.sort_order ASC
  LIMIT 1;

  IF _specialty_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.professional_specialties (professional_id, specialty_id)
  VALUES (NEW.professional_id, _specialty_id)
  ON CONFLICT (professional_id, specialty_id) DO NOTHING;

  UPDATE public.professionals p
  SET subcategories = (
      SELECT array_agg(s.name_pt ORDER BY sc.sort_order ASC, s.sort_order ASC)
      FROM public.professional_specialties ps
      JOIN public.specialties s ON s.id = ps.specialty_id
      JOIN public.subcategories sc ON sc.id = s.subcategory_id
      WHERE ps.professional_id = p.id
    ),
    updated_at = NOW()
  WHERE p.id = NEW.professional_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_professional_application_specialty ON public.professional_applications;
CREATE TRIGGER trg_sync_professional_application_specialty
AFTER INSERT OR UPDATE OF specialty_name, professional_id
ON public.professional_applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_professional_application_specialty();
