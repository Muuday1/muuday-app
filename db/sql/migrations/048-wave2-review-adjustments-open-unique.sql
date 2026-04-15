-- Wave 2: prevent duplicate open adjustments for the same field.

create unique index if not exists uq_prof_review_adjustments_open_field
  on public.professional_review_adjustments (professional_id, stage_id, field_key)
  where status in ('open', 'reopened');
