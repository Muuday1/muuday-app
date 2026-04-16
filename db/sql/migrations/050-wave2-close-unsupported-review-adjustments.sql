-- Wave 2: close legacy/open review adjustments that the current tracker cannot resolve.
-- Supported structured adjustments are intentionally limited to fields that the
-- professional can currently edit and that the onboarding save flow can resolve.

with supported_adjustments(stage_id, field_key) as (
  values
    ('c2_professional_identity', 'photo'),
    ('c2_professional_identity', 'display_name'),
    ('c2_professional_identity', 'focus_tags'),
    ('c2_professional_identity', 'experience'),
    ('c2_professional_identity', 'languages'),
    ('c2_professional_identity', 'audience'),
    ('c2_professional_identity', 'qualifications'),
    ('c4_services', 'service_title'),
    ('c4_services', 'service_description'),
    ('c4_services', 'service_price'),
    ('c5_availability_calendar', 'weekly_schedule'),
    ('c5_availability_calendar', 'booking_rules')
),
unsupported_open_adjustments as (
  select pra.id
  from public.professional_review_adjustments pra
  where pra.status in ('open', 'reopened')
    and not exists (
      select 1
      from supported_adjustments sa
      where sa.stage_id = pra.stage_id
        and sa.field_key = pra.field_key
    )
)
update public.professional_review_adjustments pra
set status = 'resolved_by_admin',
    resolved_at = coalesce(pra.resolved_at, now()),
    resolution_note = coalesce(
      nullif(pra.resolution_note, ''),
      'closed_by_migration_050_unsupported_adjustment'
    )
from unsupported_open_adjustments uoa
where pra.id = uoa.id;
