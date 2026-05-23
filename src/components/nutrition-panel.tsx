import type { Product as ProductType } from "#/api/Products";
import { Button } from "#/components/ui/button";
import { supabase } from "#/lib/supabase";
import React from "react";

type NutritionPanelProps = {
  product: ProductType;
};

type NutritionFieldName =
  | "carbs"
  | "fat"
  | "fibre"
  | "kcal"
  | "kj"
  | "protein"
  | "salt"
  | "sat"
  | "sugar";

type NutritionValues = Record<NutritionFieldName, number>;

const nutritionFieldDefs: Array<{
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

function toNutritionValues(value: Partial<NutritionValues> | null | undefined): NutritionValues {
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

function toAverage(records: NutritionValues[]): NutritionValues {
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

function hasSource(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

export function NutritionPanel({ product }: NutritionPanelProps) {
  const [reports, setReports] = React.useState(() =>
    (product.nutrition ?? []).filter((record) => hasSource(record.source)),
  );
  const [overrideId, setOverrideId] = React.useState<number | null>(null);
  const [overrideDraft, setOverrideDraft] = React.useState<NutritionValues | null>(null);
  const [overrideMarkedForDelete, setOverrideMarkedForDelete] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const allRecords = product.nutrition ?? [];
    const sourceRecords = allRecords.filter((record) => hasSource(record.source));
    const existingOverride = allRecords.find((record) => record.source === null) ?? null;

    setReports(sourceRecords);
    setOverrideId(existingOverride?.id ?? null);
    setOverrideDraft(existingOverride ? toNutritionValues(existingOverride) : null);
    setOverrideMarkedForDelete(false);
    setStatusMessage(null);
  }, [product]);

  const includedReports = React.useMemo(
    () => reports.filter((record) => !record.rejected),
    [reports],
  );

  const average = React.useMemo(
    () => toAverage(includedReports.map((record) => toNutritionValues(record))),
    [includedReports],
  );

  const toggleInclude = (reportId: number, includeInAverage: boolean) => {
    setReports((current) =>
      current.map((record) =>
        record.id === reportId ? { ...record, rejected: !includeInAverage } : record,
      ),
    );
  };

  const updateOverrideField = (field: NutritionFieldName, value: number) => {
    setOverrideDraft((current) => ({
      ...(current ?? average),
      [field]: Number.isFinite(value) ? value : 0,
    }));
  };

  const createOverrideFromAverage = () => {
    setOverrideMarkedForDelete(false);
    setOverrideDraft(average);
  };

  const deleteOverride = () => {
    if (overrideId) {
      setOverrideMarkedForDelete(true);
    }

    setOverrideDraft(null);
  };

  const handleSave = async () => {
    setStatusMessage(null);
    setIsSaving(true);

    const reportUpdates = await Promise.all(
      reports.map(async (record) => {
        const { error } = await supabase
          .from("nutrition")
          .update({ rejected: record.rejected })
          .eq("id", record.id);

        return { id: record.id, error };
      }),
    );

    const reportError = reportUpdates.find((result) => result.error);

    if (reportError?.error) {
      setIsSaving(false);
      setStatusMessage(`Failed to update report rejection state: ${reportError.error.message}`);
      return;
    }

    if (overrideMarkedForDelete && overrideId) {
      const { error } = await supabase.from("nutrition").delete().eq("id", overrideId);

      if (error) {
        setIsSaving(false);
        setStatusMessage(`Failed to delete override: ${error.message}`);
        return;
      }

      setOverrideId(null);
      setOverrideMarkedForDelete(false);
    }

    if (overrideDraft) {
      const payload = {
        ...overrideDraft,
        rejected: false,
        source: null,
      };

      if (overrideId) {
        const { error } = await supabase.from("nutrition").update(payload).eq("id", overrideId);

        if (error) {
          setIsSaving(false);
          setStatusMessage(`Failed to update override: ${error.message}`);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("nutrition")
          .insert({
            ...payload,
            product: product.id,
          })
          .select("id")
          .single();

        if (error) {
          setIsSaving(false);
          setStatusMessage(`Failed to create override: ${error.message}`);
          return;
        }

        setOverrideId(data.id);
      }
    }

    setIsSaving(false);
    setStatusMessage("Nutrition updated successfully");
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Nutrition reports</h3>
          <p className="text-sm text-slate-500">
            Reject individual lab reports from averaging, and optionally maintain a manual override.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Metric
              </th>
              {reports.map((record, index) => (
                <th
                  key={record.id}
                  className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {record.source ?? `Report ${index + 1}`}
                </th>
              ))}
              <th className="whitespace-nowrap border-b border-r border-slate-200 bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                Average
              </th>
              <th className="whitespace-nowrap border-b border-slate-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                <div className="flex items-center justify-between gap-2">
                  {overrideDraft ? <span>Override</span> : null}
                  {!overrideDraft ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={createOverrideFromAverage}
                    >
                      Create override
                    </Button>
                  ) : null}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-medium text-slate-700">
                Include in average
              </td>
              {reports.map((record) => (
                <td key={record.id} className="border-b border-r border-slate-200 px-3 py-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={!record.rejected}
                      onChange={(event) => toggleInclude(record.id, event.target.checked)}
                    />
                    Included
                  </label>
                </td>
              ))}
              <td className="border-b border-r border-slate-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
                {includedReports.length} report(s) included
              </td>
              <td className="border-b border-slate-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <div className="flex items-center justify-between gap-2">
                  <span>{overrideDraft ? "Override is active" : null}</span>
                  {overrideDraft ? (
                    <Button variant="destructive" size="xs" type="button" onClick={deleteOverride}>
                      Delete override
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>

            {nutritionFieldDefs.map((field) => (
              <tr key={field.name}>
                <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-medium text-slate-700">
                  {field.label}
                </td>
                {reports.map((record) => (
                  <td
                    key={record.id}
                    className="border-b border-r border-slate-200 px-3 py-2 text-slate-700"
                  >
                    {record[field.name]}
                  </td>
                ))}
                <td className="border-b border-r border-slate-200 bg-cyan-50 px-3 py-2 text-cyan-900">
                  {average[field.name]}
                </td>
                <td className="border-b border-slate-200 bg-amber-50 px-3 py-1.5">
                  {overrideDraft ? (
                    <input
                      type="number"
                      step={field.step ?? "0.01"}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      value={overrideDraft[field.name]}
                      onChange={(event) =>
                        updateOverrideField(field.name, Number(event.target.value))
                      }
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save nutrition changes"}
        </Button>
        {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
      </div>
    </section>
  );
}
