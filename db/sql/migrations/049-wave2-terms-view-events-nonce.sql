-- Wave 2: one-time term view proof events to prevent proof token replay.

create table if not exists public.professional_term_view_events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  opened_by uuid references public.profiles(id) on delete set null,
  term_key text not null,
  term_version text not null,
  opened_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  check (expires_at > opened_at)
);

create index if not exists idx_prof_term_view_events_professional
  on public.professional_term_view_events (professional_id, term_key, term_version, opened_at desc);

create index if not exists idx_prof_term_view_events_open
  on public.professional_term_view_events (professional_id, term_key, term_version, consumed_at)
  where consumed_at is null;

alter table public.professional_term_view_events enable row level security;

drop policy if exists "Professionals and admins view term view events" on public.professional_term_view_events;
create policy "Professionals and admins view term view events"
on public.professional_term_view_events
for select
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_view_events.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

drop policy if exists "Professionals and admins insert term view events" on public.professional_term_view_events;
create policy "Professionals and admins insert term view events"
on public.professional_term_view_events
for insert
with check (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_view_events.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

drop policy if exists "Professionals and admins update term view events" on public.professional_term_view_events;
create policy "Professionals and admins update term view events"
on public.professional_term_view_events
for update
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_view_events.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_view_events.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);
