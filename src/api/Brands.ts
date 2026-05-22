import type { TypeBrand, TypeProduct } from "./Common";

export type Brand = TypeBrand & {
  products: TypeProduct[];
};
