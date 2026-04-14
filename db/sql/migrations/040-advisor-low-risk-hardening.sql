-- 040-advisor-low-risk-hardening.sql
-- Purpose:
-- - close top low-risk advisor findings without changing product behavior
-- - add missing FK indexes
-- - remove duplicate indexes
-- - add RLS policies for public.professional_subcategories
-- - lock mutable search_path on selected public functions

-- 1) Missing FK indexes (performance)
create index if not exists availability_professional_id_idx
  on public.availability (professional_id);

create index if not exists notification_events_related_package_id_idx
  on public.notification_events (related_package_id);

create index if not exists notification_events_related_payment_id_idx
  on public.notification_events (related_payment_id);

create index if not exists packages_service_id_idx
  on public.packages (service_id);

create index if not exists payments_package_id_idx
  on public.payments (package_id);

create index if not exists professional_applications_professional_id_idx
  on public.professional_applications (professional_id);

create index if not exists professional_applications_reviewed_by_idx
  on public.professional_applications (reviewed_by);

create index if not exists professional_credentials_verified_by_idx
  on public.professional_credentials (verified_by);

create index if not exists professional_specialties_specialty_id_idx
  on public.professional_specialties (specialty_id);

create index if not exists professional_subcategories_subcategory_id_idx
  on public.professional_subcategories (subcategory_id);

create index if not exists professionals_category_id_idx
  on public.professionals (category_id);

create index if not exists professionals_reviewed_by_idx
  on public.professionals (reviewed_by);

create index if not exists professionals_user_id_idx
  on public.professionals (user_id);

create index if not exists request_bookings_converted_booking_id_idx
  on public.request_bookings (converted_booking_id);

create index if not exists reviews_professional_id_idx
  on public.reviews (professional_id);

create index if not exists slot_locks_user_id_idx
  on public.slot_locks (user_id);

create index if not exists stripe_payment_retry_queue_payment_id_idx
  on public.stripe_payment_retry_queue (payment_id);

create index if not exists stripe_subscription_check_queue_professional_id_idx
  on public.stripe_subscription_check_queue (professional_id);

create index if not exists tag_suggestions_professional_id_idx
  on public.tag_suggestions (professional_id);

create index if not exists tag_suggestions_reviewed_by_idx
  on public.tag_suggestions (reviewed_by);

-- 2) Duplicate indexes cleanup (performance)
drop index if exists public.professional_specialties_professional_idx;
drop index if exists public.slot_locks_expires_at_idx;

-- 3) professional_subcategories had RLS enabled and no policy (security)
alter table if exists public.professional_subcategories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_subcategories'
      and policyname = 'Professional subcategories are publicly readable for eligible profiles'
  ) then
    create policy "Professional subcategories are publicly readable for eligible profiles"
      on public.professional_subcategories
      for select
      using (
        exists (
          select 1
          from public.professionals p
          where p.id = professional_subcategories.professional_id
            and (
              p.status = 'approved'
              or p.user_id = (select auth.uid())
              or exists (
                select 1
                from public.profiles pr
                where pr.id = (select auth.uid())
                  and pr.role = 'admin'
              )
            )
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_subcategories'
      and policyname = 'Professionals can manage own subcategories'
  ) then
    create policy "Professionals can manage own subcategories"
      on public.professional_subcategories
      for all
      using (
        exists (
          select 1
          from public.professionals p
          where p.id = professional_subcategories.professional_id
            and p.user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.professionals p
          where p.id = professional_subcategories.professional_id
            and p.user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'professional_subcategories'
      and policyname = 'Admins can manage all professional subcategories'
  ) then
    create policy "Admins can manage all professional subcategories"
      on public.professional_subcategories
      for all
      using (
        exists (
          select 1
          from public.profiles pr
          where pr.id = (select auth.uid())
            and pr.role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles pr
          where pr.id = (select auth.uid())
            and pr.role = 'admin'
        )
      );
  end if;
end
$$;

-- 4) Harden function search_path (security)
alter function public.assign_professional_public_code() set search_path = public, extensions, pg_temp;
alter function public.compute_ends_at() set search_path = public, extensions, pg_temp;
alter function public.compute_remaining_sessions() set search_path = public, extensions, pg_temp;
alter function public.emit_payment_event_to_inngest() set search_path = public, extensions, pg_temp;
alter function public.fill_payments_legacy_required_fields() set search_path = public, extensions, pg_temp;
alter function public.normalize_taxonomy_text(input_text text) set search_path = public, extensions, pg_temp;
alter function public.professional_tier_limits(p_tier text) set search_path = public, extensions, pg_temp;
alter function public.search_text_from_array(input text[]) set search_path = public, extensions, pg_temp;
alter function public.update_updated_at() set search_path = public, extensions, pg_temp;
