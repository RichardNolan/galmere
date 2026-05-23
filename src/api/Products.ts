import type { TypeBrand, TypeNutrition, TypeProduct } from "./Common";

export type Product = TypeProduct & {
  brand: TypeBrand;
  nutrition: TypeNutrition[] | null;
};
