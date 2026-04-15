-- Wave 2: finance bypass flag for test professionals.
-- Goal: allow onboarding completion for test profiles without forcing financial setup.
-- Safety: only admin users or service role can enable the bypass flag.

alter table public.professional_settings
  add column if not exists onboarding_finance_bypass boolean not null default false;

create or replace function public.guard_onboarding_finance_bypass()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.onboarding_finance_bypass = true then
    if auth.role() = 'service_role' then
      return new;
    end if;

    if auth.uid() is null then
      raise exception 'Only admin can enable onboarding finance bypass.';
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    ) then
      raise exception 'Only admin can enable onboarding finance bypass.';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new.onboarding_finance_bypass = true
     and new.onboarding_finance_bypass is distinct from old.onboarding_finance_bypass then
    if auth.role() = 'service_role' then
      return new;
    end if;

    if auth.uid() is null then
      raise exception 'Only admin can enable onboarding finance bypass.';
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    ) then
      raise exception 'Only admin can enable onboarding finance bypass.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_onboarding_finance_bypass on public.professional_settings;

create trigger trg_guard_onboarding_finance_bypass
before insert or update on public.professional_settings
for each row
execute function public.guard_onboarding_finance_bypass();
