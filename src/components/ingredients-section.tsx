import type { Product as ProductType } from "#/api/Products";
import { formatPercent } from "#/components/ingredient-declaration";
import React from "react";

type IngredientsSectionProps = {
  product: ProductType;
};

export function IngredientsSection({ product }: IngredientsSectionProps) {
  const recipes = React.useMemo(() => {
    return [...(product.product_recipes ?? [])].sort((a, b) => {
      if (a.is_current === b.is_current) {
        return a.version_label.localeCompare(b.version_label);
      }

      return a.is_current ? -1 : 1;
    });
  }, [product.product_recipes]);

  if (!recipes.length) {
    return <p className="text-sm text-slate-600">No product recipe data found for this product.</p>;
  }

  return (
    <>
      {recipes.map((recipe) => {
        const rows = [...(recipe.product_ingredients ?? [])].sort(
          (left, right) => left.sequence_no - right.sequence_no,
        );

        return (
          <section key={recipe.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {recipe.version_label}
                {recipe.is_current ? (
                  <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">{rows.length} rows</div>
            </div>

            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Raw Material</th>
                      <th className="px-2 py-2">Ingredient</th>
                      <th className="px-2 py-2">Percent</th>
                      <th className="px-2 py-2">Declare</th>
                      <th className="px-2 py-2">QUID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 align-top last:border-b-0"
                      >
                        <td className="px-2 py-2 text-slate-700">{row.sequence_no}</td>
                        <td className="px-2 py-2 font-medium text-slate-900">
                          {row.raw_material?.rm_code ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {row.raw_material?.name ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {formatPercent(row.percent_of_recipe)}
                        </td>
                        <td className="px-2 py-2">
                          <span className={row.declare ? "text-emerald-700" : "text-slate-500"}>
                            {row.declare ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className={row.quided ? "text-emerald-700" : "text-slate-500"}>
                            {row.quided ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No ingredient rows in this recipe.</p>
            )}
          </section>
        );
      })}
    </>
  );
}
