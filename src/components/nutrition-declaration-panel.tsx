import type { Product as ProductType } from "#/api/Products";
import { useProductNutritionSummary } from "#/hooks/use-product-nutrition";
import React from "react";

type NutritionDeclarationPanelProps = {
  product: ProductType;
};

type RowDefinition = {
  label: string;
  field: "fat" | "sat" | "carbs" | "sugar" | "fibre" | "protein" | "salt";
  isSubRow?: boolean;
  withUnit?: boolean;
};

const rowDefs: RowDefinition[] = [
  { label: "Fat", field: "fat", withUnit: true },
  { label: "of which saturates", field: "sat", isSubRow: true, withUnit: true },
  { label: "Carbohydrate", field: "carbs", withUnit: true },
  { label: "of which sugars", field: "sugar", isSubRow: true, withUnit: true },
  { label: "Fibre", field: "fibre", withUnit: true },
  { label: "Protein", field: "protein", withUnit: true },
  { label: "Salt", field: "salt", withUnit: true },
];

const mismatchLabelByField: Record<
  keyof ReturnType<typeof useProductNutritionSummary>["average"],
  string
> = {
  kj: "Energy (kJ)",
  kcal: "Energy (kcal)",
  fat: "Fat",
  sat: "Saturates",
  carbs: "Carbohydrate",
  sugar: "Sugars",
  fibre: "Fibre",
  protein: "Protein",
  salt: "Salt",
};

function roundForDisplay(value: number, places = 1): number {
  return Number(value.toFixed(places));
}

function formatNumber(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.001) {
    return String(Math.round(value));
  }

  return value.toFixed(1);
}

function formatWeight(value: number): string {
  return `${formatNumber(value)}g`;
}

export function NutritionDeclarationPanel({ product }: NutritionDeclarationPanelProps) {
  const { average, effectiveNutrition, overrideValues } = useProductNutritionSummary(product);

  const servingSizeMultiplier = React.useMemo(() => {
    const servingSize = Number(product.servingSizeValue ?? 0);

    if (!Number.isFinite(servingSize) || servingSize <= 0) {
      return 0;
    }

    return servingSize / 100;
  }, [product.servingSizeValue]);

  const perServing = React.useMemo(
    () => ({
      kj: roundForDisplay(effectiveNutrition.kj * servingSizeMultiplier),
      kcal: roundForDisplay(effectiveNutrition.kcal * servingSizeMultiplier),
      fat: roundForDisplay(effectiveNutrition.fat * servingSizeMultiplier),
      sat: roundForDisplay(effectiveNutrition.sat * servingSizeMultiplier),
      carbs: roundForDisplay(effectiveNutrition.carbs * servingSizeMultiplier),
      sugar: roundForDisplay(effectiveNutrition.sugar * servingSizeMultiplier),
      fibre: roundForDisplay(effectiveNutrition.fibre * servingSizeMultiplier),
      protein: roundForDisplay(effectiveNutrition.protein * servingSizeMultiplier),
      salt: roundForDisplay(effectiveNutrition.salt * servingSizeMultiplier),
    }),
    [effectiveNutrition, servingSizeMultiplier],
  );

  const mismatchedLabels = React.useMemo(() => {
    if (!overrideValues) {
      return [];
    }

    const fields = Object.keys(mismatchLabelByField) as Array<keyof typeof mismatchLabelByField>;

    return fields
      .filter((field) => Math.abs(overrideValues[field] - average[field]) > 0.01)
      .map((field) => mismatchLabelByField[field]);
  }, [average, overrideValues]);

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <h3 className="text-4xl font-semibold text-slate-900">Nutrition Declaration</h3>

      {mismatchedLabels.length > 0 ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-4">
            <div className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xl font-bold text-amber-900">
              !
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold">
                Nutrition values no longer match imported lab certificate averages.
              </p>
              <p className="text-lg">
                Mismatch detected in {mismatchedLabels.join(", ")}. Review values or attach updated
                lab certificates.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 text-slate-900">
              <th className="px-5 py-4 text-xl font-semibold">Nutrient</th>
              <th className="px-5 py-4 text-right text-xl font-semibold">Per 100g</th>
              <th className="px-5 py-4 text-right text-xl font-semibold">Per serving</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 text-slate-800">
              <td className="px-5 py-4 text-2xl font-semibold">Energy</td>
              <td className="px-5 py-4 text-right text-2xl font-semibold">
                {formatNumber(effectiveNutrition.kj)}kJ / {formatNumber(effectiveNutrition.kcal)}
                kcal
              </td>
              <td className="px-5 py-4 text-right text-2xl font-semibold">
                {formatNumber(perServing.kj)}kJ / {formatNumber(perServing.kcal)}kcal
              </td>
            </tr>

            {rowDefs.map((row) => (
              <tr key={row.label} className="border-t border-slate-200 text-slate-800">
                <td
                  className={`px-5 py-4 text-2xl ${row.isSubRow ? "pl-10 font-medium text-slate-500" : "font-semibold"}`}
                >
                  {row.label}
                </td>
                <td className="px-5 py-4 text-right text-2xl font-semibold">
                  {row.withUnit
                    ? formatWeight(effectiveNutrition[row.field])
                    : formatNumber(effectiveNutrition[row.field])}
                </td>
                <td className="px-5 py-4 text-right text-2xl font-semibold">
                  {row.withUnit
                    ? formatWeight(perServing[row.field])
                    : formatNumber(perServing[row.field])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
