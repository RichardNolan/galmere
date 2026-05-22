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
  id?: number;
  brandName: string;
  brandCode: string;
  brandImage: string;
};

export type TypeNutrition = {
  id: number;
  created_at: string;
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
