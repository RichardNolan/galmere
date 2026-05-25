import type { Product as ProductType } from "#/api/Products";
import { formatPercent } from "#/components/ingredient-declaration";
import { Button } from "#/components/ui/button";
import { supabase } from "#/lib/supabase";
import {
  type EditableIngredientRowInput as EditableIngredientRow,
  validateRecipeRows,
} from "#/lib/validation/ingredients";
import React from "react";

type IngredientsSectionProps = {
  product: ProductType;
};

function buildRowsByRecipe(product: ProductType): Record<string, EditableIngredientRow[]> {
  const recipes = product.product_recipes ?? [];

  return Object.fromEntries(
    recipes.map((recipe) => {
      const rows = [...(recipe.product_ingredients ?? [])]
        .sort((left, right) => left.sequence_no - right.sequence_no)
        .map((row) => ({
          id: row.id,
          raw_material_id: row.raw_material_id,
          sequence_no: row.sequence_no,
          percent_of_recipe: String(row.percent_of_recipe),
          declare: row.declare,
          quided: row.quided,
          raw_material_code: row.raw_material?.rm_code ?? "-",
          raw_material_name: row.raw_material?.name ?? "-",
        }));

      return [recipe.id, rows];
    }),
  );
}

export function IngredientsSection({ product }: IngredientsSectionProps) {
  const recipes = React.useMemo(() => {
    return [...(product.product_recipes ?? [])].sort((a, b) => {
      if (a.is_current === b.is_current) {
        return a.version_label.localeCompare(b.version_label);
      }

      return a.is_current ? -1 : 1;
    });
  }, [product.product_recipes]);

  const [rowsByRecipe, setRowsByRecipe] = React.useState<Record<string, EditableIngredientRow[]>>(
    () => buildRowsByRecipe(product),
  );
  const [savingRecipeId, setSavingRecipeId] = React.useState<string | null>(null);
  const [statusByRecipe, setStatusByRecipe] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setRowsByRecipe(buildRowsByRecipe(product));
    setStatusByRecipe({});
    setSavingRecipeId(null);
  }, [product]);

  const updateRow = (
    recipeId: string,
    rowId: string,
    patch: Partial<Omit<EditableIngredientRow, "id" | "raw_material_code" | "raw_material_name">>,
  ) => {
    setRowsByRecipe((current) => {
      const rows = current[recipeId] ?? [];
      return {
        ...current,
        [recipeId]: rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
      };
    });
  };

  const saveRecipe = async (recipeId: string) => {
    const rows = rowsByRecipe[recipeId] ?? [];
    const validationErrors = validateRecipeRows(rows);

    if (validationErrors.length) {
      setStatusByRecipe((current) => ({
        ...current,
        [recipeId]: `Cannot save: ${validationErrors[0]}`,
      }));
      return;
    }

    setSavingRecipeId(recipeId);
    setStatusByRecipe((current) => ({
      ...current,
      [recipeId]: "Saving...",
    }));

    const updates = await Promise.all(
      rows.map(async (row) => {
        const payload = {
          sequence_no: row.sequence_no,
          percent_of_recipe: Number(row.percent_of_recipe),
          declare: row.declare,
          quided: row.quided,
        };

        const { error } = await supabase
          .from("product_ingredients")
          .update(payload)
          .eq("id", row.id);
        return error;
      }),
    );

    const firstError = updates.find((error) => Boolean(error));

    if (firstError) {
      setStatusByRecipe((current) => ({
        ...current,
        [recipeId]: `Failed to save: ${firstError.message}`,
      }));
      setSavingRecipeId(null);
      return;
    }

    setStatusByRecipe((current) => ({
      ...current,
      [recipeId]: "Recipe saved successfully.",
    }));
    setSavingRecipeId(null);
  };

  if (!recipes.length) {
    return <p className="text-sm text-slate-600">No product recipe data found for this product.</p>;
  }

  return (
    <>
      {recipes.map((recipe) => {
        const rows = [...(rowsByRecipe[recipe.id] ?? [])].sort(
          (left, right) => left.sequence_no - right.sequence_no,
        );
        const validationErrors = validateRecipeRows(rows);
        const isSaving = savingRecipeId === recipe.id;
        const statusMessage = statusByRecipe[recipe.id] ?? "";
        const total = rows.reduce((sum, row) => sum + Number(row.percent_of_recipe || 0), 0);

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
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">{rows.length} rows</div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveRecipe(recipe.id)}
                  disabled={isSaving || validationErrors.length > 0}
                >
                  {isSaving ? "Saving..." : "Save Recipe"}
                </Button>
              </div>
            </div>

            {validationErrors.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {validationErrors.join(" ")}
              </div>
            ) : null}

            {statusMessage ? <p className="text-xs text-slate-600">{statusMessage}</p> : null}

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
                        <td className="px-2 py-2 text-slate-700">
                          <input
                            type="number"
                            min={1}
                            value={row.sequence_no}
                            onChange={(event) => {
                              updateRow(recipe.id, row.id, {
                                sequence_no: Number(event.target.value || 0),
                              });
                            }}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 font-medium text-slate-900">
                          {row.raw_material_code}
                        </td>
                        <td className="px-2 py-2 text-slate-700">{row.raw_material_name}</td>
                        <td className="px-2 py-2 text-slate-700">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.001"
                            value={row.percent_of_recipe}
                            onChange={(event) => {
                              updateRow(recipe.id, row.id, {
                                percent_of_recipe: event.target.value,
                              });
                            }}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                          <span className="ml-1 text-xs text-slate-500">%</span>
                        </td>
                        <td className="px-2 py-2">
                          <label className="inline-flex items-center gap-2 text-slate-700">
                            <input
                              type="checkbox"
                              checked={row.declare}
                              onChange={(event) => {
                                updateRow(recipe.id, row.id, {
                                  declare: event.target.checked,
                                });
                              }}
                            />
                            <span>{row.declare ? "Yes" : "No"}</span>
                          </label>
                        </td>
                        <td className="px-2 py-2">
                          <label className="inline-flex items-center gap-2 text-slate-700">
                            <input
                              type="checkbox"
                              checked={row.quided}
                              onChange={(event) => {
                                updateRow(recipe.id, row.id, {
                                  quided: event.target.checked,
                                });
                              }}
                            />
                            <span>{row.quided ? "Yes" : "No"}</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td
                        colSpan={3}
                        className="px-2 py-2 text-right text-xs font-medium text-slate-600"
                      >
                        Total
                      </td>
                      <td className="px-2 py-2 text-xs font-semibold text-slate-800">
                        {formatPercent(total)}
                      </td>
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2" />
                    </tr>
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
