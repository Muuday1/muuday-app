-- Wave 2: allow professionals to update their own professional_applications rows.
-- This removes false-positive saves in onboarding identity when service-role is unavailable.

begin;

drop policy if exists "Professionals can update own applications" on public.professional_applications;
create policy "Professionals can update own applications"
  on public.professional_applications for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

commit;
