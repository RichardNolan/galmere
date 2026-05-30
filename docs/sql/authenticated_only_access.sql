-- Authenticated-only access hardening for app tables.
--
-- What this script does:
-- 1) Revokes anon access to schema/tables/sequences.
-- 2) Grants authenticated role CRUD access on selected tables.
-- 3) Enables RLS on selected tables.
-- 4) Drops existing policies on selected tables and recreates authenticated-only policies.
--
-- Note: This policy set allows any authenticated user to read/write all rows in the selected tables.
-- If you need per-user ownership (A can write, A+B can read), add owner/share conditions later.

begin;

-- Schema-level visibility: only authenticated can use public schema from PostgREST roles.
revoke usage on schema public from anon;
grant usage on schema public to authenticated;

do $$
declare
  target_tables text[] := array[
    'allergen_rules',
    'allergen_subtypes',
    'brands',
    'claim_audit_log',
    'claim_rule_messages',
    'claim_rule_thresholds',
    'comments',
    'fop_display_messages',
    'fop_evaluation_audit',
    'fop_nutrient_thresholds',
    'nutrition',
    'product_allergen_assessments',
    'product_ingredients',
    'product_recipes',
    'products',
    'raw_material_allergen_declarations',
    'raw_material_components',
    'raw_material_recipes',
    'raw_materials',
    'dietary_suitability_statuses',
    'dietary_suitability_snapshots',
    'fiveaday_snapshot',
    'fiveaday_snapshots'
  ];
  t text;
  p record;
begin
  foreach t in array target_tables loop
    if to_regclass(format('public.%I', t)) is null then
      raise notice 'Skipping missing table public.%', t;
      continue;
    end if;

    -- Remove direct anon privileges.
    execute format('revoke all on table public.%I from anon', t);

    -- Ensure authenticated has table privileges (RLS still applies).
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);

    -- Turn on RLS.
    execute format('alter table public.%I enable row level security', t);

    -- Drop all existing policies for a clean, deterministic state.
    for p in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;

    -- Recreate authenticated-only CRUD policies.
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_authenticated',
      t
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_insert_authenticated',
      t
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_update_authenticated',
      t
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete_authenticated',
      t
    );
  end loop;
end $$;

-- Remove anon sequence usage and allow authenticated inserts using serial/identity columns.
do $$
declare
  s record;
begin
  for s in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  loop
    execute format('revoke all on sequence %I.%I from anon', s.sequence_schema, s.sequence_name);
    execute format('grant usage, select on sequence %I.%I to authenticated', s.sequence_schema, s.sequence_name);
  end loop;
end $$;

commit;
