export type FlatIngredientRow = {
  top_raw_material_id: string;
  top_raw_material_code: string;
  top_raw_material_name: string;
  leaf_raw_material_id: string;
  leaf_raw_material_code: string;
  leaf_raw_material_name: string;
  path: string;
  depth: number;
  effective_percent: number;
  declared_inherited: boolean;
};

export type FopThresholdRow = {
  nutrient_code: "fat" | "saturates" | "sugars" | "salt";
  low_cutoff: number;
  medium_cutoff: number;
};

export type FopMessageRow = {
  message_key: string;
  message_value: string;
};

export type ClaimThresholdRow = {
  rule_code: string;
  metric: string;
  operator: string;
  threshold_value: number;
  unit: string;
  scope: string;
};

export type ClaimMessageRow = {
  rule_code: string;
  title_pass: string | null;
  title_warn: string | null;
  title_fail: string | null;
  subtitle_template: string | null;
  failure_template: string | null;
  recommended_text: string | null;
};

export type DietaryStatus = "suitable" | "not_suitable" | "unknown";

export type DietarySuitabilitySnapshot = {
  vegetarian?: DietaryStatus;
  vegan?: DietaryStatus;
  glutenFree?: DietaryStatus;
};

export type FiveADaySnapshot = {
  portionsPerServing?: number | null;
};
