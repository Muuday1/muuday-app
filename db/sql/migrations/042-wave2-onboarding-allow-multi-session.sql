-- Wave 2 onboarding hardening:
-- Ensure professional_settings supports allow_multi_session used by onboarding C5 save flow.

alter table public.professional_settings
  add column if not exists allow_multi_session boolean not null default true;

