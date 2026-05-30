-- RLS policy templates for raw materials + allergen tables
-- Context: this app currently uses Supabase from the browser and does NOT use Supabase Auth.
-- In that setup, requests are usually role = anon.
--
-- IMPORTANT:
-- - If you keep browser-side inserts/updates/deletes, you must allow anon writes (PROFILE A).
-- - If you want safer production posture, make browser read-only and do writes server-side with service_role (PROFILE B).
--
-- Tables covered:
-- - public.raw_materials (existing table used by raw materials page)
-- - public.allergen_rules
-- - public.allergen_subtypes
-- - public.raw_material_allergen_declarations
-- - public.product_allergen_assessments

-- -----------------------------------------------------------------------------
-- Shared setup (run once)
-- -----------------------------------------------------------------------------

-- Ensure roles can access public schema.
grant usage on schema public to anon, authenticated;

-- Ensure table privileges exist (RLS still controls row access).
grant select, insert, update, delete on table public.raw_materials to anon, authenticated;
grant select, insert, update, delete on table public.allergen_rules to anon, authenticated;
grant select, insert, update, delete on table public.allergen_subtypes to anon, authenticated;
grant select, insert, update, delete on table public.raw_material_allergen_declarations to anon, authenticated;
grant select, insert, update, delete on table public.product_allergen_assessments to anon, authenticated;

-- Turn on RLS for covered tables.
alter table public.raw_materials enable row level security;
alter table public.allergen_rules enable row level security;
alter table public.allergen_subtypes enable row level security;
alter table public.raw_material_allergen_declarations enable row level security;
alter table public.product_allergen_assessments enable row level security;

-- Drop existing policies so script is re-runnable.
drop policy if exists raw_materials_select_policy on public.raw_materials;
drop policy if exists raw_materials_insert_policy on public.raw_materials;
drop policy if exists raw_materials_update_policy on public.raw_materials;
drop policy if exists raw_materials_delete_policy on public.raw_materials;

drop policy if exists allergen_rules_select_policy on public.allergen_rules;
drop policy if exists allergen_rules_insert_policy on public.allergen_rules;
drop policy if exists allergen_rules_update_policy on public.allergen_rules;
drop policy if exists allergen_rules_delete_policy on public.allergen_rules;

drop policy if exists allergen_subtypes_select_policy on public.allergen_subtypes;
drop policy if exists allergen_subtypes_insert_policy on public.allergen_subtypes;
drop policy if exists allergen_subtypes_update_policy on public.allergen_subtypes;
drop policy if exists allergen_subtypes_delete_policy on public.allergen_subtypes;

drop policy if exists rm_allergen_declarations_select_policy on public.raw_material_allergen_declarations;
drop policy if exists rm_allergen_declarations_insert_policy on public.raw_material_allergen_declarations;
drop policy if exists rm_allergen_declarations_update_policy on public.raw_material_allergen_declarations;
drop policy if exists rm_allergen_declarations_delete_policy on public.raw_material_allergen_declarations;

drop policy if exists product_allergen_assessments_select_policy on public.product_allergen_assessments;
drop policy if exists product_allergen_assessments_insert_policy on public.product_allergen_assessments;
drop policy if exists product_allergen_assessments_update_policy on public.product_allergen_assessments;
drop policy if exists product_allergen_assessments_delete_policy on public.product_allergen_assessments;

-- -----------------------------------------------------------------------------
-- PROFILE A: NO SUPABASE AUTH + CLIENT WRITES (permissive)
-- Use this if you want current UI writes to work immediately from browser.
-- SECURITY: anyone with your anon key + project URL can write these tables.
-- -----------------------------------------------------------------------------

-- raw_materials
create policy raw_materials_select_policy
  on public.raw_materials
  for select
  to anon, authenticated
  using (true);

create policy raw_materials_insert_policy
  on public.raw_materials
  for insert
  to anon, authenticated
  with check (true);

create policy raw_materials_update_policy
  on public.raw_materials
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy raw_materials_delete_policy
  on public.raw_materials
  for delete
  to anon, authenticated
  using (true);

-- allergen_rules
create policy allergen_rules_select_policy
  on public.allergen_rules
  for select
  to anon, authenticated
  using (true);

create policy allergen_rules_insert_policy
  on public.allergen_rules
  for insert
  to anon, authenticated
  with check (true);

create policy allergen_rules_update_policy
  on public.allergen_rules
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy allergen_rules_delete_policy
  on public.allergen_rules
  for delete
  to anon, authenticated
  using (true);

-- allergen_subtypes
create policy allergen_subtypes_select_policy
  on public.allergen_subtypes
  for select
  to anon, authenticated
  using (true);

create policy allergen_subtypes_insert_policy
  on public.allergen_subtypes
  for insert
  to anon, authenticated
  with check (true);

create policy allergen_subtypes_update_policy
  on public.allergen_subtypes
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy allergen_subtypes_delete_policy
  on public.allergen_subtypes
  for delete
  to anon, authenticated
  using (true);

-- raw_material_allergen_declarations
create policy rm_allergen_declarations_select_policy
  on public.raw_material_allergen_declarations
  for select
  to anon, authenticated
  using (true);

create policy rm_allergen_declarations_insert_policy
  on public.raw_material_allergen_declarations
  for insert
  to anon, authenticated
  with check (true);

create policy rm_allergen_declarations_update_policy
  on public.raw_material_allergen_declarations
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy rm_allergen_declarations_delete_policy
  on public.raw_material_allergen_declarations
  for delete
  to anon, authenticated
  using (true);

-- product_allergen_assessments
create policy product_allergen_assessments_select_policy
  on public.product_allergen_assessments
  for select
  to anon, authenticated
  using (true);

create policy product_allergen_assessments_insert_policy
  on public.product_allergen_assessments
  for insert
  to anon, authenticated
  with check (true);

create policy product_allergen_assessments_update_policy
  on public.product_allergen_assessments
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy product_allergen_assessments_delete_policy
  on public.product_allergen_assessments
  for delete
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- PROFILE B: NO SUPABASE AUTH + SAFER CLIENT (read-only client)
-- If you choose this profile, comment out PROFILE A policies above and use this block.
-- Then do all writes in server code with SUPABASE_SERVICE_ROLE_KEY.
-- service_role bypasses RLS, so no write policies are needed for browser roles.
-- -----------------------------------------------------------------------------

-- Example replacement for one table (repeat for all 5 tables if using Profile B):
-- drop policy if exists raw_materials_insert_policy on public.raw_materials;
-- drop policy if exists raw_materials_update_policy on public.raw_materials;
-- drop policy if exists raw_materials_delete_policy on public.raw_materials;
--
-- revoke insert, update, delete on table public.raw_materials from anon, authenticated;
--
-- create policy raw_materials_select_policy
--   on public.raw_materials
--   for select
--   to anon, authenticated
--   using (true);
