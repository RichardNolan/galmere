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
