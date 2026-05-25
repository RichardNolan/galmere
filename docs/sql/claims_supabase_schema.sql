-- Claims feature schema for Supabase/Postgres
-- PRD reference: docs/claims-feature-prd.md

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

create table if not exists public.claim_rule_thresholds (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  rule_code text not null,
  metric text not null,
  operator text not null check (operator in ('>=', '<=', '>', '==')),
  threshold_value numeric(12, 4) not null,
  unit text not null,
  scope text not null,
  severity text,
  notes text,
  is_active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create unique index if not exists claim_rule_thresholds_active_uniq
  on public.claim_rule_thresholds (policy_version, rule_code)
  where is_active = true;

create index if not exists claim_rule_thresholds_policy_idx
  on public.claim_rule_thresholds (policy_version, is_active);

create trigger trg_claim_rule_thresholds_updated_at
before update on public.claim_rule_thresholds
for each row
execute function public.set_updated_at();

create table if not exists public.claim_rule_messages (
  id uuid primary key default gen_random_uuid(),
  policy_version text not null,
  rule_code text not null,
  title_pass text,
  title_warn text,
  title_fail text,
  subtitle_template text,
  failure_template text,
  recommended_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_version, rule_code)
);

create index if not exists claim_rule_messages_policy_idx
  on public.claim_rule_messages (policy_version);

create trigger trg_claim_rule_messages_updated_at
before update on public.claim_rule_messages
for each row
execute function public.set_updated_at();

create table if not exists public.claim_audit_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  policy_version text not null,
  input_snapshot_json jsonb not null,
  output_snapshot_json jsonb not null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists claim_audit_log_product_idx
  on public.claim_audit_log (product_id, evaluated_at desc);

create index if not exists claim_audit_log_policy_idx
  on public.claim_audit_log (policy_version, evaluated_at desc);
