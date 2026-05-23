import type { TypeBrand, TypeNutrition, TypeProduct, TypeProductRecipe } from "./Common";

export type Product = TypeProduct & {
  brand: TypeBrand;
  nutrition: TypeNutrition[] | null;
  product_recipes: TypeProductRecipe[] | null;
};
