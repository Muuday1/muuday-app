-- Wave 2: harden professional_review_adjustments update permissions.

drop policy if exists "Professionals and admins update review adjustments" on public.professional_review_adjustments;

create policy "Admins update review adjustments"
on public.professional_review_adjustments
for update
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

create policy "Professionals update own adjustments"
on public.professional_review_adjustments
for update
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_review_adjustments.professional_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_review_adjustments.professional_id
      and p.user_id = auth.uid()
  )
);

create or replace function public.enforce_professional_review_adjustments_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
  acting_role text;
  owns_adjustment boolean;
begin
  acting_user := auth.uid();
  if acting_user is null then
    raise exception 'not authenticated';
  end if;

  select pr.role into acting_role
  from public.profiles pr
  where pr.id = acting_user;

  if acting_role = 'admin' then
    return new;
  end if;

  select exists (
    select 1
    from public.professionals p
    where p.id = old.professional_id
      and p.user_id = acting_user
  ) into owns_adjustment;

  if not owns_adjustment then
    raise exception 'not allowed';
  end if;

  if old.status not in ('open', 'reopened') or new.status <> 'resolved_by_professional' then
    raise exception 'invalid status transition';
  end if;

  if new.professional_id <> old.professional_id
     or new.stage_id <> old.stage_id
     or new.field_key <> old.field_key
     or new.message <> old.message
     or new.severity <> old.severity
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable fields cannot be modified by professional';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_professional_review_adjustments_update on public.professional_review_adjustments;
create trigger trg_enforce_professional_review_adjustments_update
before update on public.professional_review_adjustments
for each row
execute function public.enforce_professional_review_adjustments_update();
