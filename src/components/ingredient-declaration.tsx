import type { Product as ProductType } from "#/api/Products";
import React from "react";

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${value
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1")}%`;
}

export function formatQuidPercent(value: number): string {
  if (!Number.isFinite(value)) return "";
  return `${value.toFixed(2)}%`;
}

export function buildIngredientDeclaration(product: ProductType): string {
  const recipes = product.product_recipes ?? [];
  const activeRecipe = recipes.find((recipe) => recipe.is_current) ?? recipes[0] ?? null;

  if (!activeRecipe?.product_ingredients?.length) {
    return "";
  }

  const rows = [...activeRecipe.product_ingredients]
    .filter((row) => row.declare)
    .sort((left, right) => left.sequence_no - right.sequence_no);

  const segments = rows.map((row) => {
    const displayName =
      row.raw_material?.name?.trim() || row.raw_material?.rm_code || "Unknown Ingredient";
    const declarationText = row.raw_material?.declaration_text?.trim() ?? "";
    const hasDistinctSubIngredients =
      declarationText && normalizeText(declarationText) !== normalizeText(displayName);

    const quidSuffix = row.quided ? ` (${formatQuidPercent(row.percent_of_recipe)})` : "";
    const subIngredientSuffix = hasDistinctSubIngredients ? ` (${declarationText})` : "";

    return `${displayName}${quidSuffix}${subIngredientSuffix}`;
  });

  return segments.join(", ");
}

type IngredientDeclarationProps = {
  product: ProductType;
};

export function IngredientDeclaration({ product }: IngredientDeclarationProps) {
  const ingredientDeclaration = React.useMemo(() => buildIngredientDeclaration(product), [product]);

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-3">
      <div className="text-sm font-semibold text-slate-900">Ingredient Declaration</div>
      <textarea
        readOnly
        value={ingredientDeclaration}
        className="min-h-40 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800"
        placeholder="Declaration will appear here once declared recipe rows are available."
      />
    </section>
  );
}
