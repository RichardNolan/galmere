-- Front of Pack (FOP) schema for Supabase/Postgres
-- PRD reference: docs/fop-traffic-light-prd.md

-- Keep updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.fop_nutrient_thresholds (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  nutrient_code text not null check (nutrient_code in ('fat', 'saturates', 'sugars', 'salt')),
  low_cutoff numeric(8, 3) not null check (low_cutoff >= 0),
  medium_cutoff numeric(8, 3) not null check (medium_cutoff >= low_cutoff),
  unit text not null default 'g per serving' check (unit = 'g per serving'),
  comparison_mode text not null default 'inclusive' check (comparison_mode = 'inclusive'),
  is_active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create unique index if not exists fop_nutrient_thresholds_active_uniq
  on public.fop_nutrient_thresholds (policy_version, nutrient_code)
  where is_active = true;

create index if not exists fop_nutrient_thresholds_policy_idx
  on public.fop_nutrient_thresholds (policy_version, is_active);

create trigger trg_fop_nutrient_thresholds_updated_at
before update on public.fop_nutrient_thresholds
for each row
execute function public.set_updated_at();

create table if not exists public.fop_display_messages (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  message_key text not null,
  message_value text not null,
  locale text not null default 'en-GB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_version, message_key, locale)
);

create index if not exists fop_display_messages_policy_locale_idx
  on public.fop_display_messages (policy_version, locale);

create trigger trg_fop_display_messages_updated_at
before update on public.fop_display_messages
for each row
execute function public.set_updated_at();

create table if not exists public.fop_evaluation_audit (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  policy_version text not null,
  input_snapshot_json jsonb not null,
  output_snapshot_json jsonb not null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists fop_evaluation_audit_product_idx
  on public.fop_evaluation_audit (product_id, evaluated_at desc);

create index if not exists fop_evaluation_audit_policy_idx
  on public.fop_evaluation_audit (policy_version, evaluated_at desc);
