import type { Product as ProductType } from "#/api/Products";
import React from "react";

export type NutritionFieldName =
  | "carbs"
  | "fat"
  | "fibre"
  | "kcal"
  | "kj"
  | "protein"
  | "salt"
  | "sat"
  | "sugar";

export type NutritionValues = Record<NutritionFieldName, number>;

export const nutritionFieldDefs: Array<{
  name: NutritionFieldName;
  label: string;
  step?: string;
}> = [
  { name: "carbs", label: "Carbs" },
  { name: "fat", label: "Fat" },
  { name: "fibre", label: "Fibre" },
  { name: "kcal", label: "Kcal", step: "1" },
  { name: "kj", label: "Kj", step: "1" },
  { name: "protein", label: "Protein" },
  { name: "salt", label: "Salt" },
  { name: "sat", label: "Sat" },
  { name: "sugar", label: "Sugar" },
];

const zeroNutrition: NutritionValues = {
  carbs: 0,
  fat: 0,
  fibre: 0,
  kcal: 0,
  kj: 0,
  protein: 0,
  salt: 0,
  sat: 0,
  sugar: 0,
};

export function toNutritionValues(
  value: Partial<NutritionValues> | null | undefined,
): NutritionValues {
  return {
    carbs: value?.carbs ?? 0,
    fat: value?.fat ?? 0,
    fibre: value?.fibre ?? 0,
    kcal: value?.kcal ?? 0,
    kj: value?.kj ?? 0,
    protein: value?.protein ?? 0,
    salt: value?.salt ?? 0,
    sat: value?.sat ?? 0,
    sugar: value?.sugar ?? 0,
  };
}

export function toAverage(records: NutritionValues[]): NutritionValues {
  if (!records.length) {
    return zeroNutrition;
  }

  const totals = records.reduce<NutritionValues>(
    (acc, item) => ({
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fibre: acc.fibre + item.fibre,
      kcal: acc.kcal + item.kcal,
      kj: acc.kj + item.kj,
      protein: acc.protein + item.protein,
      salt: acc.salt + item.salt,
      sat: acc.sat + item.sat,
      sugar: acc.sugar + item.sugar,
    }),
    zeroNutrition,
  );

  const count = records.length;

  return {
    carbs: Number((totals.carbs / count).toFixed(2)),
    fat: Number((totals.fat / count).toFixed(2)),
    fibre: Number((totals.fibre / count).toFixed(2)),
    kcal: Number((totals.kcal / count).toFixed(2)),
    kj: Number((totals.kj / count).toFixed(2)),
    protein: Number((totals.protein / count).toFixed(2)),
    salt: Number((totals.salt / count).toFixed(2)),
    sat: Number((totals.sat / count).toFixed(2)),
    sugar: Number((totals.sugar / count).toFixed(2)),
  };
}

export function hasSource(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

export function useProductNutritionSummary(product: ProductType) {
  const nutritionRecords = React.useMemo(() => product.nutrition ?? [], [product.nutrition]);

  const reports = React.useMemo(
    () => nutritionRecords.filter((record) => hasSource(record.source)),
    [nutritionRecords],
  );

  const includedReports = React.useMemo(
    () => reports.filter((record) => !record.rejected),
    [reports],
  );

  const average = React.useMemo(
    () => toAverage(includedReports.map((record) => toNutritionValues(record))),
    [includedReports],
  );

  const override = React.useMemo(
    () => nutritionRecords.find((record) => record.source === null) ?? null,
    [nutritionRecords],
  );

  const overrideValues = React.useMemo(
    () => (override ? toNutritionValues(override) : null),
    [override],
  );

  const effectiveNutrition = overrideValues ?? average;

  return {
    reports,
    includedReports,
    average,
    override,
    overrideValues,
    effectiveNutrition,
  };
}
