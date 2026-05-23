import { type NutritionValues } from "#/hooks/use-product-nutrition";
import React from "react";

type NutritionMismatchAlertProps = {
  average: NutritionValues;
  overrideValues: NutritionValues | null;
};

const mismatchLabelByField: Record<keyof NutritionValues, string> = {
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

export function NutritionMismatchAlert({ average, overrideValues }: NutritionMismatchAlertProps) {
  const mismatchedLabels = React.useMemo(() => {
    if (!overrideValues) {
      return [];
    }

    const fields = Object.keys(mismatchLabelByField) as Array<keyof NutritionValues>;

    return fields
      .filter((field) => Math.abs(overrideValues[field] - average[field]) > 0.01)
      .map((field) => mismatchLabelByField[field]);
  }, [average, overrideValues]);

  if (mismatchedLabels.length === 0) {
    return null;
  }

  return (
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
            Mismatch detected in {mismatchedLabels.join(", ")}. Review values or attach updated lab
            certificates.
          </p>
        </div>
      </div>
    </div>
  );
}
