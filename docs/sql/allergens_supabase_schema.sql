-- Allergens feature schema for Supabase/Postgres
-- This schema externalizes allergen rule metadata and supports
-- raw-material level declarations plus product-level assessments.
-- This script assumes a clean allergen feature setup.

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

create table if not exists public.allergen_rules (
  id text primary key,
  label text not null,
  short_label text not null,
  keywords text[] not null default '{}',
  aliases text[] not null default '{}',
  has_subtypes boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists allergen_rules_active_sort_idx
  on public.allergen_rules (is_active, sort_order, id);

drop trigger if exists trg_allergen_rules_updated_at on public.allergen_rules;
create trigger trg_allergen_rules_updated_at
before update on public.allergen_rules
for each row
execute function public.set_updated_at();

create table if not exists public.allergen_subtypes (
  id text primary key,
  allergen_id text not null references public.allergen_rules (id) on delete cascade,
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (allergen_id, id),
  unique (allergen_id, label)
);

create index if not exists allergen_subtypes_allergen_idx
  on public.allergen_subtypes (allergen_id, is_active, sort_order);

drop trigger if exists trg_allergen_subtypes_updated_at on public.allergen_subtypes;
create trigger trg_allergen_subtypes_updated_at
before update on public.allergen_subtypes
for each row
execute function public.set_updated_at();

create table if not exists public.raw_material_allergen_declarations (
  id uuid primary key default gen_random_uuid(),
  raw_material_id uuid not null references public.raw_materials (id) on delete cascade,
  allergen_id text not null references public.allergen_rules (id) on delete restrict,
  subtype_id text,
  declared_status text not null check (declared_status in ('contains', 'may-contain', 'does-not-contain', 'unknown')),
  source text not null check (source in ('supplier_spec', 'manual_review', 'lab_test', 'inferred_from_ingredients')),
  confidence text not null default 'manual' check (confidence in ('low', 'medium', 'high', 'manual')),
  evidence_excerpt text,
  source_ref text,
  notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (allergen_id, subtype_id)
    references public.allergen_subtypes (allergen_id, id)
    on delete restrict
);

create unique index if not exists raw_material_allergen_current_uniq
  on public.raw_material_allergen_declarations (raw_material_id, allergen_id, coalesce(subtype_id, ''))
  where is_current = true;

create index if not exists raw_material_allergen_rm_idx
  on public.raw_material_allergen_declarations (raw_material_id, is_current, allergen_id);

drop trigger if exists trg_raw_material_allergen_declarations_updated_at on public.raw_material_allergen_declarations;
create trigger trg_raw_material_allergen_declarations_updated_at
before update on public.raw_material_allergen_declarations
for each row
execute function public.set_updated_at();

create table if not exists public.product_allergen_assessments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  product_recipe_id uuid references public.product_recipes (id) on delete set null,
  allergen_id text not null references public.allergen_rules (id) on delete restrict,
  subtype_id text,
  detected boolean not null default false,
  declaration_status text not null default '' check (declaration_status in ('', 'contains', 'may-contain', 'does-not-contain')),
  present_in_final_product boolean not null default false,
  may_contain boolean not null default false,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'manually_edited', 'approved')),
  confidence text not null default 'manual' check (confidence in ('low', 'medium', 'high', 'manual')),
  source_material_ids uuid[] not null default '{}',
  reasons jsonb not null default '[]'::jsonb,
  notes text,
  last_assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (allergen_id, subtype_id)
    references public.allergen_subtypes (allergen_id, id)
    on delete restrict
);

create unique index if not exists product_allergen_assessments_uniq
  on public.product_allergen_assessments (
    product_id,
    coalesce(product_recipe_id, '00000000-0000-0000-0000-000000000000'::uuid),
    allergen_id,
    coalesce(subtype_id, '')
  );

create index if not exists product_allergen_assessments_product_idx
  on public.product_allergen_assessments (product_id, last_assessed_at desc);

drop trigger if exists trg_product_allergen_assessments_updated_at on public.product_allergen_assessments;
create trigger trg_product_allergen_assessments_updated_at
before update on public.product_allergen_assessments
for each row
execute function public.set_updated_at();