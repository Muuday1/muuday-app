-- Wave 2: structured admin review adjustments + per-term legal acceptance log.

create table if not exists public.professional_review_adjustments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  stage_id text not null,
  field_key text not null,
  message text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'resolved_by_professional', 'resolved_by_admin', 'reopened')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text
);

create index if not exists idx_prof_review_adj_professional_status
  on public.professional_review_adjustments (professional_id, status, created_at desc);

create index if not exists idx_prof_review_adj_stage
  on public.professional_review_adjustments (professional_id, stage_id, status);

alter table public.professional_review_adjustments enable row level security;

drop policy if exists "Professionals and admins view review adjustments" on public.professional_review_adjustments;
create policy "Professionals and admins view review adjustments"
on public.professional_review_adjustments
for select
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_review_adjustments.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

drop policy if exists "Admins create review adjustments" on public.professional_review_adjustments;
create policy "Admins create review adjustments"
on public.professional_review_adjustments
for insert
with check (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

drop policy if exists "Professionals and admins update review adjustments" on public.professional_review_adjustments;
create policy "Professionals and admins update review adjustments"
on public.professional_review_adjustments
for update
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_review_adjustments.professional_id
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
    where p.id = professional_review_adjustments.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

create table if not exists public.professional_term_acceptances (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete set null,
  term_key text not null,
  term_version text not null,
  text_hash text not null,
  accepted_at timestamptz not null default now(),
  ip inet,
  user_agent text,
  unique (professional_id, term_key, term_version)
);

create index if not exists idx_prof_term_acceptances_professional
  on public.professional_term_acceptances (professional_id, accepted_at desc);

alter table public.professional_term_acceptances enable row level security;

drop policy if exists "Professionals and admins view term acceptances" on public.professional_term_acceptances;
create policy "Professionals and admins view term acceptances"
on public.professional_term_acceptances
for select
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_acceptances.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);

drop policy if exists "Professionals and admins insert term acceptances" on public.professional_term_acceptances;
create policy "Professionals and admins insert term acceptances"
on public.professional_term_acceptances
for insert
with check (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_term_acceptances.professional_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  )
);
