-- Wave 2: onboarding tracker support
-- 1) Add service catalog options per subcategory (admin-managed)
-- 2) Expand calendar integration provider constraint to include outlook + apple

BEGIN;

CREATE TABLE IF NOT EXISTS public.taxonomy_service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_slug TEXT NOT NULL,
  slug TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subcategory_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_service_options_subcategory
  ON public.taxonomy_service_options(subcategory_slug, is_active, sort_order, name_pt);

ALTER TABLE public.taxonomy_service_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service options are publicly readable" ON public.taxonomy_service_options;
CREATE POLICY "Service options are publicly readable"
  ON public.taxonomy_service_options
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only admins can manage service options" ON public.taxonomy_service_options;
CREATE POLICY "Only admins can manage service options"
  ON public.taxonomy_service_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

INSERT INTO public.taxonomy_service_options (subcategory_slug, slug, name_pt, name_en, sort_order)
VALUES
  ('fiscal-internacional-expatriados', 'consulta-orientacao-fiscal', 'Consulta de orientação fiscal', 'Tax guidance consultation', 10),
  ('fiscal-internacional-expatriados', 'planejamento-saida-fiscal', 'Planejamento de saída fiscal', 'Tax residency exit planning', 20),
  ('fiscal-internacional-expatriados', 'analise-dupla-tributacao', 'Análise de dupla tributação', 'Double taxation analysis', 30),
  ('consultoria-empresa-no-exterior', 'consulta-estrategia-internacional', 'Consulta de estratégia internacional', 'International business strategy consultation', 10),
  ('consultoria-empresa-no-exterior', 'estrutura-societaria', 'Estrutura societária e abertura', 'Corporate structure and setup', 20),
  ('consultoria-empresa-no-exterior', 'compliance-fiscal', 'Compliance fiscal internacional', 'International tax compliance', 30),
  ('psicologo', 'sessao-acolhimento', 'Sessão de acolhimento', 'Intake session', 10),
  ('psicologo', 'sessao-terapia-individual', 'Sessão de terapia individual', 'Individual therapy session', 20),
  ('nutricionista', 'consulta-nutricao', 'Consulta nutricional', 'Nutrition consultation', 10),
  ('fisioterapeuta', 'sessao-fisioterapia-online', 'Sessão de fisioterapia online', 'Online physiotherapy session', 10),
  ('contador', 'consulta-contabil-expatriado', 'Consulta contábil para expatriados', 'Expat accounting consultation', 10),
  ('advogado', 'consulta-juridica-informativa', 'Consulta jurídica informativa', 'Informational legal consultation', 10)
ON CONFLICT (subcategory_slug, slug) DO UPDATE
SET
  name_pt = EXCLUDED.name_pt,
  name_en = EXCLUDED.name_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();

DO $$
DECLARE
  provider_constraint TEXT;
BEGIN
  SELECT c.conname
  INTO provider_constraint
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'calendar_integrations'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%provider%';

  IF provider_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.calendar_integrations DROP CONSTRAINT %I', provider_constraint);
  END IF;

  ALTER TABLE public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_provider_check
    CHECK (provider IN ('google', 'outlook', 'apple'));
END;
$$;

COMMIT;
