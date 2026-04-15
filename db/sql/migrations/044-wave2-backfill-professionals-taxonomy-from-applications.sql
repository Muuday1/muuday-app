-- Backfill taxonomy fields on professionals from the latest professional_applications row.
-- Goal: avoid onboarding C2 blockers for legacy professionals with missing category/subcategory mirror.

with latest_application as (
  select distinct on (pa.user_id)
    pa.user_id,
    nullif(trim(pa.category), '') as category,
    nullif(trim(pa.specialty_name), '') as specialty_name,
    case
      when jsonb_typeof(pa.taxonomy_suggestions) = 'object' then pa.taxonomy_suggestions
      else '{}'::jsonb
    end as taxonomy_suggestions
  from public.professional_applications pa
  where pa.user_id is not null
  order by pa.user_id, coalesce(pa.updated_at, pa.created_at) desc, pa.created_at desc
),
normalized as (
  select
    p.id as professional_id,
    p.user_id,
    la.category as application_category,
    coalesce(
      nullif(trim(la.taxonomy_suggestions ->> 'subcategory_slug'), ''),
      nullif(trim(la.taxonomy_suggestions ->> 'subcategory'), ''),
      la.specialty_name
    ) as inferred_subcategory
  from public.professionals p
  join latest_application la on la.user_id = p.user_id
)
update public.professionals p
set
  category = coalesce(nullif(trim(p.category), ''), n.application_category),
  subcategories = case
    when coalesce(array_length(p.subcategories, 1), 0) > 0 then p.subcategories
    when nullif(trim(n.inferred_subcategory), '') is not null then array[n.inferred_subcategory]
    else p.subcategories
  end,
  updated_at = now()
from normalized n
where p.id = n.professional_id
  and (
    nullif(trim(p.category), '') is null
    or coalesce(array_length(p.subcategories, 1), 0) = 0
  );

