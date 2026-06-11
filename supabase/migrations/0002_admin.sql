-- SourC — Phase 2: admin (authenticated) access policies.
-- Any authenticated user is treated as the admin (single-admin model: you
-- create exactly one user in the Supabase dashboard). Run after 0001_init.sql.

-- These permissive policies OR with the existing public policies, so an
-- authenticated admin can read inactive parts and manage everything, while
-- anon visitors remain limited to active parts / inserting inquiries.

-- parts: full CRUD for the admin, including inactive rows.
drop policy if exists "admin read all parts" on public.parts;
create policy "admin read all parts"
  on public.parts for select to authenticated using (true);

drop policy if exists "admin insert parts" on public.parts;
create policy "admin insert parts"
  on public.parts for insert to authenticated with check (true);

drop policy if exists "admin update parts" on public.parts;
create policy "admin update parts"
  on public.parts for update to authenticated using (true) with check (true);

drop policy if exists "admin delete parts" on public.parts;
create policy "admin delete parts"
  on public.parts for delete to authenticated using (true);

-- inquiries: admin can read the full pipeline and advance lead status.
drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries"
  on public.inquiries for select to authenticated using (true);

drop policy if exists "admin update inquiries" on public.inquiries;
create policy "admin update inquiries"
  on public.inquiries for update to authenticated using (true) with check (true);
