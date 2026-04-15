-- Wave 2: central plan configuration managed by Admin > Planos.
-- Goal: move tier limits/features/ranges to DB so updates do not require code changes.

create table if not exists public.plan_configs (
  tier text primary key check (tier in ('basic', 'professional', 'premium')),
  specialties_limit integer not null default 1 check (specialties_limit >= 0),
  tags_limit integer not null default 3 check (tags_limit >= 0),
  services_limit integer not null default 1 check (services_limit >= 0),
  service_options_per_service_limit integer not null default 1 check (service_options_per_service_limit >= 0),
  booking_window_days_limit integer not null default 30 check (booking_window_days_limit >= 1),
  min_notice_hours_min integer not null default 0 check (min_notice_hours_min >= 0),
  min_notice_hours_max integer not null default 48 check (min_notice_hours_max >= 0),
  buffer_configurable boolean not null default false,
  buffer_default_minutes integer not null default 15 check (buffer_default_minutes >= 0),
  buffer_max_minutes integer not null default 15 check (buffer_max_minutes >= 0),
  social_links_limit integer not null default 0 check (social_links_limit >= 0),
  extended_bio_limit integer not null default 0 check (extended_bio_limit >= 0),
  features text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint plan_configs_notice_range_check check (min_notice_hours_max >= min_notice_hours_min)
);

alter table public.plan_configs enable row level security;

drop policy if exists plan_configs_read_authenticated on public.plan_configs;
create policy plan_configs_read_authenticated
  on public.plan_configs
  for select
  to authenticated
  using (true);

drop policy if exists plan_configs_admin_write on public.plan_configs;
create policy plan_configs_admin_write
  on public.plan_configs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = auth.uid()
        and pr.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = auth.uid()
        and pr.role = 'admin'
    )
  );

insert into public.plan_configs (
  tier,
  specialties_limit,
  tags_limit,
  services_limit,
  service_options_per_service_limit,
  booking_window_days_limit,
  min_notice_hours_min,
  min_notice_hours_max,
  buffer_configurable,
  buffer_default_minutes,
  buffer_max_minutes,
  social_links_limit,
  extended_bio_limit,
  features
)
values
  (
    'basic',
    1, 3, 1, 1, 30,
    0, 48,
    false, 15, 15,
    0, 0,
    array['cover_photo']::text[]
  ),
  (
    'professional',
    3, 4, 3, 3, 90,
    0, 96,
    true, 15, 120,
    2, 2000,
    array[
      'cover_photo',
      'manual_accept',
      'auto_accept',
      'video_intro',
      'whatsapp_profile',
      'social_links',
      'extended_bio',
      'outlook_sync',
      'whatsapp_notifications',
      'promotions',
      'csv_export'
    ]::text[]
  ),
  (
    'premium',
    3, 5, 5, 6, 180,
    0, 168,
    true, 15, 120,
    5, 5000,
    array[
      'cover_photo',
      'manual_accept',
      'auto_accept',
      'video_intro',
      'whatsapp_profile',
      'social_links',
      'extended_bio',
      'outlook_sync',
      'whatsapp_notifications',
      'promotions',
      'csv_export',
      'pdf_export'
    ]::text[]
  )
on conflict (tier) do update set
  specialties_limit = excluded.specialties_limit,
  tags_limit = excluded.tags_limit,
  services_limit = excluded.services_limit,
  service_options_per_service_limit = excluded.service_options_per_service_limit,
  booking_window_days_limit = excluded.booking_window_days_limit,
  min_notice_hours_min = excluded.min_notice_hours_min,
  min_notice_hours_max = excluded.min_notice_hours_max,
  buffer_configurable = excluded.buffer_configurable,
  buffer_default_minutes = excluded.buffer_default_minutes,
  buffer_max_minutes = excluded.buffer_max_minutes,
  social_links_limit = excluded.social_links_limit,
  extended_bio_limit = excluded.extended_bio_limit,
  features = excluded.features,
  updated_at = now();

