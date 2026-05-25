# Front of Pack (FOP) Traffic Light PRD (Implementation-Agnostic)

## 1. Purpose
Build a Front of Pack (FOP) traffic-light feature that converts nutrition values into a per-serving label view and classifies four nutrients as LOW, MEDIUM, or HIGH.

The feature outputs four nutrient tiles:
- Fat
- Saturated fat
- Sugars
- Salt

Each tile displays:
- Nutrient label
- Per-serving value in grams
- Status (LOW, MEDIUM, HIGH)
- Visual color class (green, amber, red)

This PRD is self-contained and does not require access to any previous codebase.

## 2. Problem Statement
Current FOP behavior is often embedded directly in UI logic. Thresholds and status rules should be externalized into configurable data so policy changes can be applied without redeploying frontend code.

## 3. Goals
- Reproduce existing per-serving FOP behavior exactly.
- Keep rule evaluation deterministic and explainable.
- Externalize all numeric thresholds and status labels to data.
- Decouple rule engine from UI rendering.

## 4. Non-Goals
- HFSS scoring logic.
- Nutrition claims eligibility logic.
- OCR/PDF ingestion.
- Legacy visual design parity.

## 5. Inputs
Required:
- serving_size_g (numeric)
- per_100g nutrient values:
  - fat_g
  - saturates_g
  - sugars_g
  - salt_g

Optional but recommended:
- locale/number format strategy
- policy_version

## 6. Core Logic

### 6.1 Per-Serving Conversion
For each nutrient:

per_serving_value = per_100g_value * (serving_size_g / 100)

Where:
- serving_size_g must be greater than 0
- if serving_size_g is missing or <= 0, no nutrient classification is computed

### 6.2 Classification Rule
For each nutrient, define two cutoffs:
- low_cutoff
- medium_cutoff

Classification is inclusive at both boundaries:
- if value <= low_cutoff => LOW
- else if value <= medium_cutoff => MEDIUM
- else => HIGH

### 6.3 Color Mapping
- LOW => green
- MEDIUM => amber
- HIGH => red

## 7. Numeric Threshold Table (Database Candidate)

Suggested table: fop_nutrient_thresholds
Suggested columns:
- policy_version
- nutrient_code
- low_cutoff
- medium_cutoff
- unit
- comparison_mode
- is_active
- effective_from
- effective_to

| Nutrient Code | Label | Low Cutoff (<=) | Medium Cutoff (<=) | Unit | Comparison Mode |
|---|---|---:|---:|---|---|
| fat | Fat | 3.0 | 17.5 | g per serving | inclusive |
| saturates | Saturated fat | 1.5 | 5.0 | g per serving | inclusive |
| sugars | Sugars | 5.0 | 22.5 | g per serving | inclusive |
| salt | Salt | 0.3 | 1.5 | g per serving | inclusive |

## 8. Validation and Empty-State Rules

### 8.1 Missing or Invalid Serving Size
If serving_size_g is missing or <= 0:
- all FOP tiles remain in pending state
- tile value should be shown as --
- tile status message should be ENTER SERVING SIZE ON DASHBOARD
- tile color defaults to green pending style

### 8.2 Missing Individual Nutrient Input
If a specific nutrient value is not parseable as a number:
- that tile value should be --
- tile status should be nutrient-specific awaiting text
- tile color defaults to green pending style

Default awaiting messages:
- Fat: AWAITING FAT INPUT
- Saturated fat: AWAITING SAT FAT INPUT
- Sugars: AWAITING SUGARS INPUT
- Salt: AWAITING SALT INPUT

## 9. Display Formatting Rules
- Per-serving values are displayed in grams with 1 decimal place.
- Trailing .0 is removed for cleaner display.
- Example:
  - 2.0 => 2g
  - 2.5 => 2.5g

## 10. UI Contract
Each nutrient tile should support the following fields in the rendering contract:
- nutrient_code
- display_name
- display_value (e.g., 2.5g or --)
- status_label (LOW/MEDIUM/HIGH or awaiting message)
- color_tone (green/amber/red/pending)

Recommended status text format for classified values:
- LOW per serving
- MEDIUM per serving
- HIGH per serving

## 11. API Contract (Example)

### 11.1 Input
- product_id
- policy_version
- serving_size_g
- nutrients_per_100g:
  - fat_g
  - saturates_g
  - sugars_g
  - salt_g

### 11.2 Output
- fop_tiles[]
  - nutrient_code
  - per_serving_value_g (nullable)
  - status (LOW|MEDIUM|HIGH|PENDING)
  - color (green|amber|red|pending)
  - low_cutoff
  - medium_cutoff
  - message

## 12. Data Model Proposal

### 12.1 fop_nutrient_thresholds
- id
- policy_version
- nutrient_code
- low_cutoff
- medium_cutoff
- unit
- comparison_mode
- is_active
- effective_from
- effective_to
- created_at
- updated_at

### 12.2 fop_display_messages
- id
- policy_version
- message_key
- message_value
- locale
- created_at
- updated_at

Suggested message keys:
- fop.awaiting_serving_size
- fop.awaiting_fat
- fop.awaiting_sat_fat
- fop.awaiting_sugars
- fop.awaiting_salt
- fop.status.low
- fop.status.medium
- fop.status.high

### 12.3 fop_evaluation_audit
- id
- product_id
- policy_version
- input_snapshot_json
- output_snapshot_json
- evaluated_at

## 13. Acceptance Criteria
- For each nutrient, classification uses inclusive boundary logic exactly as specified.
- Per-serving conversion uses serving_size_g / 100.
- Missing serving size produces pending state for all four tiles.
- Missing nutrient value produces pending state for that tile only.
- Display formatting removes trailing .0 while preserving one decimal for other values.
- Thresholds are database-driven and versioned by policy_version.

## 14. Test Matrix (Minimum)

### 14.1 Fat
- 3.0g => LOW
- 3.1g => MEDIUM
- 17.5g => MEDIUM
- 17.6g => HIGH

### 14.2 Saturated Fat
- 1.5g => LOW
- 1.6g => MEDIUM
- 5.0g => MEDIUM
- 5.1g => HIGH

### 14.3 Sugars
- 5.0g => LOW
- 5.1g => MEDIUM
- 22.5g => MEDIUM
- 22.6g => HIGH

### 14.4 Salt
- 0.3g => LOW
- 0.31g => MEDIUM
- 1.5g => MEDIUM
- 1.51g => HIGH

### 14.5 Validation Cases
- serving_size_g = 0 => all pending
- serving_size_g missing => all pending
- sugars missing, other nutrients present => sugars pending only, others classified

## 15. Migration Plan
1. Create threshold and message tables.
2. Seed thresholds and default messages from this PRD.
3. Implement pure FOP evaluation service.
4. Add regression tests for boundary values.
5. Integrate service output into UI tile rendering.
6. Enable policy_version switching for controlled rollouts.

## 16. Risks
- Jurisdiction-specific FOP thresholds may differ by market.
- Inconsistent nutrient units from upstream data can cause misclassification.
- Locale-specific number parsing may introduce edge-case input errors.

## 17. Open Questions
- Do thresholds vary by market/country in target rollout?
- Should beverages and solids share one threshold profile or separate profiles?
- Should pending states be represented as a distinct enum or inferred from null values?
