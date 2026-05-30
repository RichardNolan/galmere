# Ingredients Roadmap

## Completed

- Phase 1: Display declaration, ingredient rows, and flattened composition as reusable components.
- Phase 2: Inline editing and save for recipe rows in ingredients section.
- Validation before save:
  - Recipe total must be 100% (+/- 0.5).
  - Sequence numbers must be unique.
  - Percent values must be numeric and within 0-100.
  - Raw material links must be present.
- Zod migration (in progress):
  - Ingredients section validation now uses Zod schemas (`editableIngredientRowSchema`, `recipeRowsSchema`).

## Next (Planned)

### 3) Declaration fallback from flattened composition

- Keep supplier declaration text as primary source.
- If supplier declaration text is missing for a composite material, build sub-ingredient text from flattened rows.
- Ensure output remains stable and deterministic for regulatory copy.

### 4) Route-level include/exclude controls

- Wire section visibility booleans from products route.
- Support context-specific layouts:
  - Editor mode (ingredients table only)
  - Review mode (declaration + flattened)

### 5) Regression tests

- Unit tests for declaration builder and percent formatting.
- Integration test for product page ingredients render and save validation behavior.
- Add a test fixture for the soup sample recipe.

## Notes

- Keep save interaction batch-based per recipe.
- Preserve compatibility with existing Supabase schema and RPC function `get_flat_product_ingredients`.
- Continue migrating validation logic to Zod as new editor flows are added (declaration fallback and test fixtures can share schemas).

## Recommendations

### Validation Architecture

- Move ingredient-related Zod schemas into a shared module (recommended path: `src/lib/validation/ingredients.ts`).
- Use a single parse path for UI validation and pre-save validation to avoid drift.
- Add typed schema outputs for save payloads so Supabase updates consume validated values only.

### Data Integrity and Save Strategy

- Keep per-recipe batch save, but send updates in a deterministic order (by `sequence_no`) for easier debugging.
- Add optimistic concurrency guard in a later phase (for example, check `updated_at` on save) to reduce overwrite risk when multiple users edit.
- Add a clear server-side error mapping layer so DB constraint errors show user-friendly guidance.

### Declaration Quality

- Normalize punctuation/whitespace in declaration output before render and before copy/export.
- Add deterministic sorting and grouping rules for fallback declaration generation from flattened rows.
- Add a lightweight preview diff (“current vs generated”) in review workflows to reduce accidental label regressions.

### UX Recommendations

- Add unsaved-changes detection per recipe and warn on route leave.
- Add recipe-level reset action to reload current DB values without full page refresh.
- Show validation summaries near the save action and inline on offending fields for faster correction.

### Testing and Observability

- Add unit tests around shared Zod schemas and cross-row rules (unique sequence, total tolerance).
- Add integration tests for save success/failure states and Supabase error rendering.
- Add a small telemetry/event hook for save outcomes (success/fail + reason) to monitor editor reliability.

### Front of Pack (FOP) Traffic Light Recommendations

#### Data Ownership (DB vs Constants)

- Move policy-driven thresholds to DB table `fop_nutrient_thresholds` (versioned + active rows).
- Move policy-driven text to DB table `fop_display_messages` (versioned + locale-aware keys).
- Keep visual presentation mapping in app constants (status -> color classes), unless design requires runtime theming.
- Keep utility logic in code constants/helpers (per-serving arithmetic, number formatting).

#### Service Architecture

- Extract FOP evaluation into a reusable service module so UI only renders tile contracts.
- Prefer one evaluation entry point that accepts product nutrition + serving size + policy version.
- Keep fallback defaults in app code so missing policy rows do not break product pages.

#### Audit and Traceability

- Use `fop_evaluation_audit` for runtime evaluation snapshots (inputs + outputs + policy version).
- Do not write audit rows from pure UI render paths by default.
- Add server-side evaluation endpoint or RPC that performs: fetch policy -> evaluate -> write audit -> return tiles.
- Add dedupe/idempotency guard for audit writes (for example request id or stable evaluation hash) to reduce noisy duplicates.

#### Rollout and Versioning

- Introduce explicit policy activation workflow:
  - seed policy rows for next version,
  - validate in staging,
  - flip active policy per market/country.
- Add effective date governance for future thresholds/messages (`effective_from`, `effective_to`).
- Add locale coverage plan for message keys before non-`en-GB` rollout.

#### Testing Matrix (FOP)

- Add unit tests for inclusive threshold boundaries:
  - low boundary stays LOW,
  - medium boundary stays MEDIUM,
  - above medium is HIGH.
- Add conversion tests for `serving_size / 100` multiplier correctness.
- Add pending-state tests:
  - missing or invalid serving size -> all pending,
  - missing nutrient value -> single tile pending only.
- Add contract tests for tile payload fields:
  - `nutrient_code`, `display_name`, `display_value`, `status_label`, `color_tone`.

#### Operational Checks

- Add a post-seed verification script/query set:
  - required nutrient threshold rows exist per active policy,
  - required message keys exist per locale,
  - no duplicate active rows per nutrient/policy.
- Add alerting for policy fetch failures in product route loaders.

## Next (FOP Planned)

### 6) Move FOP evaluation behind server boundary

- Implement a Supabase RPC or edge function for policy fetch + evaluation + optional audit write.
- Update product route to consume evaluated tile payload from the server path.

### 7) Implement controlled audit logging

- Write to `fop_evaluation_audit` only on explicit evaluation events (not every render).
- Store minimal required snapshots for reproducibility and debugging.

### 8) Expand policy operations

- Add admin-safe workflow for policy version creation and activation.
- Add validation checks for thresholds/messages before a policy can be activated.

## Security/Auth Backlog (Potential)

### S1) Remove public URL dependence for uploaded PDFs

- Risk: uploaded files can become broadly accessible if bucket/public URL behavior is misconfigured.
- Current behavior: PDF upload flow resolves a public URL after upload.
- Future change:
  - keep bucket private,
  - store object path only,
  - generate short-lived signed URLs for read/download.
- Acceptance criteria:
  - no persisted public URLs,
  - private bucket access only,
  - signed URL expiry is enforced.

### S2) Remove auth claim debug logging from runtime paths

- Risk: token claims and identity data can leak into logs if debug mode is enabled outside local development.
- Current behavior: optional auth debug logging is available behind an env flag.
- Future change:
  - remove or hard-limit claim logging to local-only contexts,
  - keep only non-sensitive diagnostics.
- Acceptance criteria:
  - no claim payloads in non-local logs,
  - production environment cannot enable verbose claim dumps.

### S3) Move from role-only RLS to ownership/sharing RLS

- Risk: authenticated-only table policies allow any signed-in user to read/write all rows.
- Current behavior: RLS is restricted to authenticated role, but not row ownership.
- Future change:
  - introduce owner columns and ownership predicates,
  - add explicit share/join tables for collaborative read access,
  - keep write access limited to owner (or explicit editors).
- Acceptance criteria:
  - user A cannot read/write user B rows unless explicitly shared,
  - policy tests cover insert/select/update/delete ownership rules,
  - no table retains broad using (true) for user-owned data.

## Next (Security Planned)

### 9) Private storage + signed URL migration

- Refactor upload/read flows to path + signed URL model.
- Add a cleanup migration for any historical public URLs.

### 10) Logging hardening

- Remove sensitive auth debug outputs from runtime code.
- Keep a minimal, non-sensitive diagnostics path for auth/RLS troubleshooting.

### 11) Ownership-based RLS rollout

- Implement ownership policy model on high-risk tables first (comments, nutrition, raw materials).
- Expand to all user-owned entities once integration tests pass.
