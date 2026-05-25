-- Seed data for Front of Pack (FOP) policy v1
-- PRD reference: docs/fop-traffic-light-prd.md

insert into public.fop_nutrient_thresholds (
  policy_version,
  nutrient_code,
  low_cutoff,
  medium_cutoff,
  unit,
  comparison_mode,
  is_active,
  effective_from,
  effective_to
)
values
  ('v1', 'fat', 3.0, 17.5, 'g per serving', 'inclusive', true, '2026-01-01', null),
  ('v1', 'saturates', 1.5, 5.0, 'g per serving', 'inclusive', true, '2026-01-01', null),
  ('v1', 'sugars', 5.0, 22.5, 'g per serving', 'inclusive', true, '2026-01-01', null),
  ('v1', 'salt', 0.3, 1.5, 'g per serving', 'inclusive', true, '2026-01-01', null)
on conflict (policy_version, nutrient_code)
where is_active = true
  do update set
    low_cutoff = excluded.low_cutoff,
    medium_cutoff = excluded.medium_cutoff,
    unit = excluded.unit,
    comparison_mode = excluded.comparison_mode,
    effective_from = excluded.effective_from,
    effective_to = excluded.effective_to,
    updated_at = now();

insert into public.fop_display_messages (
  policy_version,
  message_key,
  message_value,
  locale
)
values
  ('v1', 'fop.awaiting_serving_size', 'ENTER SERVING SIZE ON DASHBOARD', 'en-GB'),
  ('v1', 'fop.awaiting_fat', 'AWAITING FAT INPUT', 'en-GB'),
  ('v1', 'fop.awaiting_sat_fat', 'AWAITING SAT FAT INPUT', 'en-GB'),
  ('v1', 'fop.awaiting_sugars', 'AWAITING SUGARS INPUT', 'en-GB'),
  ('v1', 'fop.awaiting_salt', 'AWAITING SALT INPUT', 'en-GB'),
  ('v1', 'fop.status.low', 'LOW per serving', 'en-GB'),
  ('v1', 'fop.status.medium', 'MEDIUM per serving', 'en-GB'),
  ('v1', 'fop.status.high', 'HIGH per serving', 'en-GB')
on conflict (policy_version, message_key, locale)
  do update set
    message_value = excluded.message_value,
    updated_at = now();
