import type { Product as ProductType } from "#/api/Products";
import { NutritionMismatchAlert } from "#/components/nutrition-mismatch-alert";
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

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <h3 className="text-4xl font-semibold text-slate-900">Nutrition Declaration</h3>

      <NutritionMismatchAlert average={average} overrideValues={overrideValues} />

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
