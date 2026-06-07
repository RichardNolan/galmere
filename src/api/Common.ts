export type TypeProduct = {
  id: string;
  created_at: string;
  productName: string;
  servingSizeValue: number;
  servingSizeUnit: string;
  packSizeValue: number;
  packSizeUnit: string;
  versionNumber: string;
  reviewStatus: string;
  lastUpdated: string;
  owner: string;
  lifecycle: string;
  market: string;
  approvalStage: string;
  completionPercent: number;
};

export type TypeBrand = {
  id: number;
  brandName: string;
  brandCode: string;
  brandImage: string;
};

export type TypeNutrition = {
  id: number;
  created_at: string;
  product: string;
  rejected: boolean;
  source: string | null;
  carbs: number;
  fat: number;
  fibre: number;
  kcal: number;
  kj: number;
  protein: number;
  salt: number;
  sat: number;
  sugar: number;
};

export type TypeRawMaterial = {
  id: string;
  rm_code: string;
  name: string;
  supplier_name: string | null;
  country_of_origin: string | null;
  declaration_text: string | null;
  spec_file_path: string | null;
  is_active: boolean;
};

export type TypeProductIngredient = {
  id: string;
  product_recipe_id: string;
  raw_material_id: string;
  sequence_no: number;
  percent_of_recipe: number;
  declare: boolean;
  quided: boolean;
  notes: string | null;
  raw_material: TypeRawMaterial | null;
};

export type TypeProductRecipe = {
  id: string;
  product_id: string;
  version_label: string;
  is_current: boolean;
  effective_from: string | null;
  effective_to: string | null;
  product_ingredients: TypeProductIngredient[] | null;
};
