-- ============================================
-- Wave 2: Taxonomy expansion for professional signup
-- ============================================
-- Adds broader subcategory/specialty coverage with expat-focused options.

BEGIN;

WITH subcategories_seed(category_slug, subcategory_slug, name_pt, name_en, sort_order) AS (
  VALUES
    ('saude-corpo-movimento', 'fonoaudiologia', 'Fonoaudiologia', 'Speech Therapy', 30),
    ('saude-corpo-movimento', 'saude-materno-infantil', 'Saúde Materno-Infantil', 'Maternal and Child Health', 31),
    ('saude-corpo-movimento', 'fisioterapia-pelvica-saude-intima', 'Fisioterapia Pélvica e Saúde Íntima', 'Pelvic Physiotherapy and Intimate Health', 32),
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'Fiscal Internacional e Expatriados', 'International Tax and Expats', 30),
    ('contabilidade-financas', 'consultoria-empresa-no-exterior', 'Consultoria para Empresa no Exterior', 'Overseas Business Advisory', 31),
    ('direito-suporte-juridico', 'planejamento-migratorio-familiar', 'Planejamento Migratório Familiar', 'Family Migration Planning', 30),
    ('carreira-negocios-desenvolvimento', 'consultoria-maternidade-carreira', 'Consultoria de Maternidade e Carreira', 'Maternity and Career Consulting', 30)
)
INSERT INTO public.subcategories (category_id, slug, name_pt, name_en, sort_order, is_active)
SELECT c.id, s.subcategory_slug, s.name_pt, s.name_en, s.sort_order, true
FROM subcategories_seed s
JOIN public.categories c ON c.slug = s.category_slug
ON CONFLICT (category_id, slug) DO UPDATE
SET
  name_pt = EXCLUDED.name_pt,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();

WITH specialties_seed(category_slug, subcategory_slug, specialty_slug, name_pt, name_en, sort_order) AS (
  VALUES
    -- Fonoaudiologia
    ('saude-corpo-movimento', 'fonoaudiologia', 'fonoaudiologia-adultos', 'Fonoaudiologia para Adultos', 'Adult Speech Therapy', 1),
    ('saude-corpo-movimento', 'fonoaudiologia', 'fonoaudiologia-infantil', 'Fonoaudiologia Infantil', 'Child Speech Therapy', 2),
    ('saude-corpo-movimento', 'fonoaudiologia', 'reabilitacao-da-fala', 'Reabilitação da Fala', 'Speech Rehabilitation', 3),
    ('saude-corpo-movimento', 'fonoaudiologia', 'disfagia', 'Disfagia', 'Dysphagia', 4),

    -- Saude materno-infantil
    ('saude-corpo-movimento', 'saude-materno-infantil', 'consultoria-gestante', 'Consultoria para Gestante', 'Pregnancy Consulting', 1),
    ('saude-corpo-movimento', 'saude-materno-infantil', 'consultoria-amamentacao', 'Consultoria em Amamentação', 'Breastfeeding Consulting', 2),
    ('saude-corpo-movimento', 'saude-materno-infantil', 'nutricao-gestacional', 'Nutrição Gestacional', 'Pregnancy Nutrition', 3),
    ('saude-corpo-movimento', 'saude-materno-infantil', 'saude-pos-parto', 'Saúde no Pós-parto', 'Postpartum Care', 4),

    -- Fisioterapia pelvica
    ('saude-corpo-movimento', 'fisioterapia-pelvica-saude-intima', 'fisioterapia-pelvica-feminina', 'Fisioterapia Pélvica Feminina', 'Female Pelvic Physiotherapy', 1),
    ('saude-corpo-movimento', 'fisioterapia-pelvica-saude-intima', 'fisioterapia-pelvica-masculina', 'Fisioterapia Pélvica Masculina', 'Male Pelvic Physiotherapy', 2),
    ('saude-corpo-movimento', 'fisioterapia-pelvica-saude-intima', 'reabilitacao-pos-parto-pelvica', 'Reabilitação Pélvica Pós-parto', 'Postpartum Pelvic Rehabilitation', 3),
    ('saude-corpo-movimento', 'fisioterapia-pelvica-saude-intima', 'reabilitacao-incontinencia', 'Reabilitação para Incontinência', 'Incontinence Rehabilitation', 4),

    -- Fiscal internacional / expats
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'declaracao-saida-definitiva', 'Declaração de Saída Definitiva', 'Final Exit Tax Return', 1),
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'planejamento-saida-fiscal', 'Planejamento de Saída Fiscal do Brasil', 'Brazil Tax Exit Planning', 2),
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'regularizacao-fiscal-nao-residente', 'Regularização Fiscal de Não Residente', 'Non-resident Tax Regularization', 3),
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'dupla-tributacao-expatriados', 'Dupla Tributação para Expatriados', 'Double Taxation for Expats', 4),
    ('contabilidade-financas', 'fiscal-internacional-expatriados', 'imposto-renda-brasileiro-no-exterior', 'Imposto de Renda Brasileiro para Residentes no Exterior', 'Brazilian Income Tax for Expats', 5),

    -- Empresa no exterior
    ('contabilidade-financas', 'consultoria-empresa-no-exterior', 'abertura-empresa-no-exterior', 'Abertura de Empresa no Exterior', 'Overseas Company Formation', 1),
    ('contabilidade-financas', 'consultoria-empresa-no-exterior', 'estrutura-societaria-internacional', 'Estrutura Societária Internacional', 'International Corporate Structuring', 2),
    ('contabilidade-financas', 'consultoria-empresa-no-exterior', 'compliance-fiscal-internacional', 'Compliance Fiscal Internacional', 'International Tax Compliance', 3),
    ('contabilidade-financas', 'consultoria-empresa-no-exterior', 'planejamento-remessa-internacional', 'Planejamento de Remessas Internacionais', 'International Remittance Planning', 4),

    -- Planejamento migratorio familiar
    ('direito-suporte-juridico', 'planejamento-migratorio-familiar', 'visto-familia', 'Visto para Reunificação Familiar', 'Family Reunification Visa', 1),
    ('direito-suporte-juridico', 'planejamento-migratorio-familiar', 'planejamento-mudanca-familiar', 'Planejamento de Mudança Familiar', 'Family Relocation Planning', 2),
    ('direito-suporte-juridico', 'planejamento-migratorio-familiar', 'documentacao-escolar-filhos', 'Documentação Escolar para Filhos no Exterior', 'School Documentation for Children Abroad', 3),

    -- Maternidade e carreira
    ('carreira-negocios-desenvolvimento', 'consultoria-maternidade-carreira', 'retorno-ao-trabalho-pos-maternidade', 'Retorno ao Trabalho Pós-maternidade', 'Return to Work After Maternity', 1),
    ('carreira-negocios-desenvolvimento', 'consultoria-maternidade-carreira', 'planejamento-carreira-gestante', 'Planejamento de Carreira para Gestantes', 'Career Planning During Pregnancy', 2),
    ('carreira-negocios-desenvolvimento', 'consultoria-maternidade-carreira', 'equilibrio-carreira-maternidade', 'Equilíbrio entre Carreira e Maternidade', 'Career and Motherhood Balance', 3)
)
INSERT INTO public.specialties (subcategory_id, slug, name_pt, name_en, sort_order, is_active)
SELECT sc.id, s.specialty_slug, s.name_pt, s.name_en, s.sort_order, true
FROM specialties_seed s
JOIN public.categories c ON c.slug = s.category_slug
JOIN public.subcategories sc ON sc.category_id = c.id AND sc.slug = s.subcategory_slug
ON CONFLICT (subcategory_id, slug) DO UPDATE
SET
  name_pt = EXCLUDED.name_pt,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

COMMIT;
