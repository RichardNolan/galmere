-- Seed data for Claims policy v1
-- PRD reference: docs/claims-feature-prd.md

insert into public.claim_rule_thresholds (
  policy_version,
  rule_code,
  metric,
  operator,
  threshold_value,
  unit,
  scope,
  severity,
  notes,
  is_active,
  effective_from,
  effective_to
)
values
  ('v1', 'validation.serving_size.required', 'serving_size', '>', 0, 'g', 'global', 'error', 'Claims cannot run without serving size', true, '2026-01-01', null),
  ('v1', 'validation.kcal.required', 'kcal_per_100g', '>', 0, 'kcal', 'global', 'error', 'Claims cannot run without kcal greater than 0', true, '2026-01-01', null),
  ('v1', 'protein.source', 'protein_energy_percent', '>=', 12, '% energy', 'per serving', 'info', 'Source of protein threshold', true, '2026-01-01', null),
  ('v1', 'protein.high', 'protein_energy_percent', '>=', 20, '% energy', 'per serving', 'info', 'High protein threshold', true, '2026-01-01', null),
  ('v1', 'fibre.source.serving', 'fibre_per_serving', '>=', 3, 'g', 'per serving', 'info', 'Source of fibre path 1', true, '2026-01-01', null),
  ('v1', 'fibre.source.energy', 'fibre_per_100kcal', '>=', 1.5, 'g', 'per 100 kcal', 'info', 'Source of fibre path 2', true, '2026-01-01', null),
  ('v1', 'fibre.high.serving', 'fibre_per_serving', '>=', 6, 'g', 'per serving', 'info', 'High fibre path 1', true, '2026-01-01', null),
  ('v1', 'fibre.high.energy', 'fibre_per_100kcal', '>=', 3, 'g', 'per 100 kcal', 'info', 'High fibre path 2', true, '2026-01-01', null),
  ('v1', 'fat.low', 'fat_per_serving', '<=', 3, 'g', 'per serving', 'info', 'Low fat threshold', true, '2026-01-01', null),
  ('v1', 'sat.low', 'saturates_per_serving', '<=', 1.5, 'g', 'per serving', 'info', 'Low saturated fat threshold', true, '2026-01-01', null),
  ('v1', 'sugar.low', 'sugars_per_serving', '<=', 5, 'g', 'per serving', 'info', 'Low sugar threshold', true, '2026-01-01', null),
  ('v1', 'salt.low', 'salt_per_serving', '<=', 0.3, 'g', 'per serving', 'info', 'Low salt threshold', true, '2026-01-01', null),
  ('v1', 'dietary.vegetarian', 'dietary_status.vegetarian', '==', 1, 'enum', 'recipe-linked', 'info', 'Must be suitable', true, '2026-01-01', null),
  ('v1', 'dietary.vegan', 'dietary_status.vegan', '==', 1, 'enum', 'recipe-linked', 'info', 'Must be suitable', true, '2026-01-01', null),
  ('v1', 'dietary.gluten_free', 'dietary_status.glutenFree', '==', 1, 'enum', 'recipe-linked', 'info', 'Must be suitable', true, '2026-01-01', null),
  ('v1', 'fiveaday.claim.minimum', 'portions_per_serving', '>=', 1, 'portions', 'per serving', 'info', 'Enables dynamic X of your 5-a-day claim', true, '2026-01-01', null),
  ('v1', 'fiveaday.portion_grams', 'grams_per_portion', '==', 80, 'g', 'global', 'info', 'Portion conversion baseline', true, '2026-01-01', null),
  ('v1', 'fiveaday.status.strong', 'portions_per_serving', '>=', 1, 'portions', 'per serving', 'info', 'Strong status threshold', true, '2026-01-01', null),
  ('v1', 'fiveaday.status.close', 'portions_per_serving', '>=', 0.75, 'portions', 'per serving', 'info', 'Close status threshold', true, '2026-01-01', null),
  ('v1', 'ui.reco.protein.helper', 'protein_per_serving', '>=', 5, 'g', 'per serving', 'info', 'Insight helper only, not legal threshold', true, '2026-01-01', null),
  ('v1', 'ui.reco.fibre.helper', 'fibre_per_serving', '>=', 3, 'g', 'per serving', 'info', 'Insight helper only, not legal threshold', true, '2026-01-01', null),
  ('v1', 'ui.warning.salt_high', 'salt_per_serving', '>', 1.5, 'g', 'per serving', 'warning', 'Warning only', true, '2026-01-01', null)
on conflict (policy_version, rule_code)
where is_active = true
  do update set
    metric = excluded.metric,
    operator = excluded.operator,
    threshold_value = excluded.threshold_value,
    unit = excluded.unit,
    scope = excluded.scope,
    severity = excluded.severity,
    notes = excluded.notes,
    effective_from = excluded.effective_from,
    effective_to = excluded.effective_to,
    updated_at = now();

insert into public.claim_rule_messages (
  policy_version,
  rule_code,
  title_pass,
  title_warn,
  title_fail,
  subtitle_template,
  failure_template,
  recommended_text
)
values
  ('v1', 'protein.source', 'Source of protein', 'Protein support', 'Source of protein', 'At least 12% of energy from protein.', 'Protein energy contribution is below 12%.', 'SOURCE OF PROTEIN'),
  ('v1', 'protein.high', 'High protein', 'Protein support', 'High protein', 'At least 20% of energy from protein.', 'Protein energy contribution is below 20%.', 'HIGH PROTEIN'),
  ('v1', 'fibre.source', 'Source of fibre', 'Fibre support', 'Source of fibre', 'At least 3g per serving or 1.5g per 100kcal.', 'Fibre does not meet source threshold.', 'SOURCE OF FIBRE'),
  ('v1', 'fibre.high', 'High fibre', 'Fibre support', 'High fibre', 'At least 6g per serving or 3g per 100kcal.', 'Fibre does not meet high threshold.', 'HIGH FIBRE'),
  ('v1', 'fat.low', 'Low fat', 'Fat profile', 'Low fat', 'No more than 3g fat per serving.', 'Fat exceeds low claim threshold.', 'LOW FAT'),
  ('v1', 'sat.low', 'Low saturated fat', 'Saturates profile', 'Low saturated fat', 'No more than 1.5g saturates per serving.', 'Saturates exceed low claim threshold.', 'LOW SATURATED FAT'),
  ('v1', 'sugar.low', 'Low sugar', 'Sugar profile', 'Low sugar', 'No more than 5g sugars per serving.', 'Sugars exceed low claim threshold.', 'LOW SUGAR'),
  ('v1', 'salt.low', 'Low salt', 'Salt profile', 'Low salt', 'No more than 0.3g salt per serving.', 'Salt exceeds low claim threshold.', 'LOW SALT')
on conflict (policy_version, rule_code)
  do update set
    title_pass = excluded.title_pass,
    title_warn = excluded.title_warn,
    title_fail = excluded.title_fail,
    subtitle_template = excluded.subtitle_template,
    failure_template = excluded.failure_template,
    recommended_text = excluded.recommended_text,
    updated_at = now();
