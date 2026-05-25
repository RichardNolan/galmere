# Claims Feature PRD (Implementation-Agnostic)

## 1. Purpose
Build a Claims Evaluation feature that takes nutrition and recipe context and outputs:
- Eligible claims
- Recommended on-pack wording
- Failed claim reasons
- Threshold detail cards
- Dietary suitability claims (Vegetarian, Vegan, Gluten free)
- Optional 5-a-day claim integration

This PRD is self-contained and does not assume access to any prior codebase.

## 2. Problem Statement
In the current behavior model, logic and thresholds are hard-coded in frontend code and coupled to UI rendering and browser storage. Numeric thresholds should be externalized to database configuration for easier governance, policy versioning, and regulatory updates.

## 3. Goals
- Reproduce current eligibility behavior exactly.
- Separate rule engine from UI rendering.
- Move all numeric thresholds and min/max values to persistent config tables.
- Keep explainability: every claim must include threshold text, actual value, and failure reason.

## 4. Non-Goals
- OCR/PDF ingestion workflow.
- Full lab import workflow.
- Legacy UI styling parity.

## 5. User Personas
- Product Technologist: enters declared nutrition values and recipe context.
- Regulatory Reviewer: needs clear pass/fail rationale and wording.
- Developer/Admin: updates thresholds without code deployment.

## 6. Inputs and Dependencies

### 6.1 Required Inputs
- Per-100g nutrients: kcal, fat, saturates, sugars, protein, salt, fibre.
- Serving size (g), must be greater than 0.
- Recipe rows (for dietary suitability and 5-a-day).

### 6.2 Upstream Data
- Dietary suitability snapshot from ingredients workflow.
- Optional 5-a-day snapshot from fruit and veg contribution workflow.

## 7. Functional Scope

### 7.1 Claim Engine
Compute per-serving values using factor = serving_size / 100 and evaluate:
- Protein claim
- Fibre claim
- Low fat claim
- Low saturated fat claim
- Low sugar claim
- Low salt claim

### 7.2 Claim Result Object (per claim)
Each claim result must include:
- title
- subtitle (threshold explanation)
- eligible
- threshold (human-readable)
- actual (computed current value)
- failureReason
- recommended (on-pack phrase)

### 7.3 Claims Workflow Aggregation
- Eligible claims list
- Recommended claims list
- Missed claims list with reasons
- Count badges and footer messaging

### 7.4 Threshold Detail Panel
Render all claim evaluations with actual values and rule summaries.

### 7.5 Dietary Suitability Claims
If status is suitable, inject claim items for:
- Vegetarian
- Vegan
- Gluten free

### 7.6 5-a-day Claim Injection
If portions_per_serving >= 1, add dynamic claim such as 1 of your 5-a-day.

## 8. Rules and Threshold Table (Database Candidate)

Suggested table: claim_rule_thresholds
Suggested columns:
- rule_code
- metric
- operator
- threshold_value
- unit
- scope
- severity
- notes

| Rule Code | Metric | Operator | Value | Unit | Scope | Notes |
|---|---|---:|---:|---|---|---|
| validation.serving_size.required | serving_size | > | 0 | g | global | Claims cannot run without serving size |
| validation.kcal.required | kcal_per_100g | > | 0 | kcal | global | Claims cannot run without kcal greater than 0 |
| protein.source | protein_energy_percent | >= | 12 | % energy | per serving | Source of protein threshold |
| protein.high | protein_energy_percent | >= | 20 | % energy | per serving | High protein threshold |
| fibre.source.serving | fibre_per_serving | >= | 3 | g | per serving | Source of fibre path 1 |
| fibre.source.energy | fibre_per_100kcal | >= | 1.5 | g | per 100 kcal | Source of fibre path 2 |
| fibre.high.serving | fibre_per_serving | >= | 6 | g | per serving | High fibre path 1 |
| fibre.high.energy | fibre_per_100kcal | >= | 3 | g | per 100 kcal | High fibre path 2 |
| fat.low | fat_per_serving | <= | 3 | g | per serving | Low fat threshold |
| sat.low | saturates_per_serving | <= | 1.5 | g | per serving | Low saturated fat threshold |
| sugar.low | sugars_per_serving | <= | 5 | g | per serving | Low sugar threshold |
| salt.low | salt_per_serving | <= | 0.3 | g | per serving | Low salt threshold |
| dietary.vegetarian | dietary_status.vegetarian | == | suitable | enum | recipe-linked | Must be suitable |
| dietary.vegan | dietary_status.vegan | == | suitable | enum | recipe-linked | Must be suitable |
| dietary.gluten_free | dietary_status.glutenFree | == | suitable | enum | recipe-linked | Must be suitable |
| fiveaday.claim.minimum | portions_per_serving | >= | 1 | portions | per serving | Enables dynamic X of your 5-a-day claim |
| fiveaday.portion_grams | grams_per_portion | == | 80 | g | global | Portion conversion baseline |
| fiveaday.status.strong | portions_per_serving | >= | 1 | portions | per serving | Strong status threshold |
| fiveaday.status.close | portions_per_serving | >= | 0.75 | portions | per serving | Close status threshold |
| ui.reco.protein.helper | protein_per_serving | >= | 5 | g | per serving | Insight helper only, not legal threshold |
| ui.reco.fibre.helper | fibre_per_serving | >= | 3 | g | per serving | Insight helper only, not legal threshold |
| ui.warning.salt_high | salt_per_serving | > | 1.5 | g | per serving | Warning only |

## 9. Related Numeric Sets Worth Externalizing
These are not direct pass/fail for the six core nutrition claims, but are part of the decision UX and should also move to data.

### 9.1 FOP Traffic Light Bands
| Nutrient | Low <= | Medium <= | Unit |
|---|---:|---:|---|
| Fat | 3 | 17.5 | g per serving |
| Saturates | 1.5 | 5 | g per serving |
| Sugars | 5 | 22.5 | g per serving |
| Salt | 0.3 | 1.5 | g per serving |

### 9.2 HFSS Scoring Threshold Arrays
| Metric | Thresholds |
|---|---|
| Energy | 335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350 |
| Saturated fat | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Sugar | 4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45 |
| Sodium | 90, 180, 270, 360, 450, 540, 630, 720, 810, 900 |
| Fibre | 0.9, 1.9, 2.8, 3.7, 4.7 |
| Protein | 1.6, 3.2, 4.8, 6.4, 8 |
| HFSS class cutoff (drink) | 1 |
| HFSS class cutoff (food) | 4 |

## 10. Proposed Target Architecture

### 10.1 Services
- ClaimRulesRepository: fetch active thresholds and versioned policy profile.
- ClaimEvaluationService: pure rule functions, no UI or storage coupling.
- ClaimPresentationMapper: maps engine output to UI-friendly cards.
- SuitabilityAdapter: consumes dietary suitability snapshot from upstream module.
- FiveADayAdapter: consumes portions snapshot from upstream module.

### 10.2 API Contract (example)
Input payload:
- product_id
- serving_size_g
- nutrients_per_100g
- dietary_suitability_statuses
- fiveaday_snapshot

Output payload:
- claim_results[] containing eligible, threshold, actual, failureReason, recommended
- approved_claims[]
- recommended_claims[]
- failed_claims[]
- threshold_details[]

## 11. Data Model Proposal

### 11.1 claim_rule_thresholds
- id
- policy_version
- rule_code
- metric
- operator
- threshold_value
- unit
- scope
- is_active
- created_at
- updated_at

### 11.2 claim_rule_messages
- id
- policy_version
- rule_code
- title_pass
- title_warn
- title_fail
- subtitle_template
- failure_template
- recommended_text

### 11.3 claim_audit_log
- id
- product_id
- policy_version
- input_snapshot_json
- output_snapshot_json
- evaluated_at

## 12. Acceptance Criteria
- For identical inputs, the new engine returns the same eligibility outcomes defined in this PRD.
- Every claim result includes threshold and actual values.
- Updating a threshold in database changes behavior without code changes.
- Deterministic output for same input.
- Full traceability via audit records.

## 13. Migration Plan
1. Seed database with thresholds and message templates from this PRD.
2. Build a pure evaluation engine and snapshot-based tests.
3. Validate parity against known historical product outcomes.
4. Replace UI hard-coded logic with API-backed results.
5. Enable versioned policy rollout and controlled migration by policy_version.

## 14. Risks
- Regulatory wording may vary by market and need jurisdiction profiles.
- Mixed scope units (per serving vs per 100 kcal) can cause integration mistakes.
- Upstream dietary and 5-a-day snapshots may be stale or partial.

## 15. Open Questions
- Should claims be jurisdiction-specific by market or country?
- Should dietary suitability stay tri-state or include confidence and evidence?
- Is 5-a-day claim always permitted when portions_per_serving >= 1, or are additional constraints required?
- Should HFSS classification block certain recommended claim wordings?
