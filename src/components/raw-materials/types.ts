export type RawMaterialRow = {
  id: string;
  rm_code: string;
  name: string;
  supplier_name: string | null;
  country_of_origin: string | null;
  declaration_text: string | null;
  spec_file_path: string | null;
  is_active: boolean;
};

export type AllergenRuleRow = {
  id: string;
  label: string;
  short_label: string;
  has_subtypes: boolean;
  sort_order: number;
  is_active: boolean | null;
};

export type AllergenSubtypeRow = {
  id: string;
  allergen_id: string;
  label: string;
  sort_order: number;
  is_active: boolean | null;
};

export type DeclarationStatus = "contains" | "may-contain" | "does-not-contain" | "unknown";
export type DeclarationSource =
  | "supplier_spec"
  | "manual_review"
  | "lab_test"
  | "inferred_from_ingredients";
export type DeclarationConfidence = "low" | "medium" | "high" | "manual";

export type AllergenDeclarationRow = {
  id: string;
  raw_material_id: string;
  allergen_id: string;
  subtype_id: string | null;
  declared_status: DeclarationStatus;
  source: DeclarationSource;
  confidence: DeclarationConfidence;
  notes: string | null;
};

export type DeclarationDraftRow = {
  allergen_id: string;
  subtype_id: string;
  declared_status: DeclarationStatus;
  source: DeclarationSource;
  confidence: DeclarationConfidence;
  notes: string;
};

export type FormDraft = {
  rm_code: string;
  name: string;
  supplier_name: string;
  country_of_origin: string;
  declaration_text: string;
  spec_file_path: string;
  is_active: boolean;
};

export type RawMaterialsLoaderData = {
  rawMaterials: RawMaterialRow[];
  allergenRules: AllergenRuleRow[];
  allergenSubtypes: AllergenSubtypeRow[];
};

export const EMPTY_FORM_DRAFT: FormDraft = {
  rm_code: "",
  name: "",
  supplier_name: "",
  country_of_origin: "",
  declaration_text: "",
  spec_file_path: "",
  is_active: true,
};

export const EMPTY_DECLARATION_DRAFT: DeclarationDraftRow = {
  allergen_id: "",
  subtype_id: "",
  declared_status: "unknown",
  source: "manual_review",
  confidence: "manual",
  notes: "",
};
