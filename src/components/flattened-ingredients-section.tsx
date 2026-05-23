import { formatPercent } from "#/components/ingredient-declaration";

type FlatIngredientRow = {
  top_raw_material_id: string;
  top_raw_material_code: string;
  top_raw_material_name: string;
  leaf_raw_material_id: string;
  leaf_raw_material_code: string;
  leaf_raw_material_name: string;
  path: string;
  depth: number;
  effective_percent: number;
  declared_inherited: boolean;
};

type FlattenedIngredientsSectionProps = {
  flatIngredients?: FlatIngredientRow[];
};

export function FlattenedIngredientsSection({
  flatIngredients = [],
}: FlattenedIngredientsSectionProps) {
  if (!flatIngredients.length) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">
          Flattened Composition (Current Recipe)
        </h4>
        <span className="text-xs text-slate-500">{flatIngredients.length} leaf rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">Top RM</th>
              <th className="px-2 py-2">Leaf RM</th>
              <th className="px-2 py-2">Effective %</th>
              <th className="px-2 py-2">Declared</th>
            </tr>
          </thead>
          <tbody>
            {flatIngredients.map((row) => (
              <tr
                key={`${row.top_raw_material_id}-${row.leaf_raw_material_id}-${row.path}`}
                className="border-b border-slate-100 align-top last:border-b-0"
              >
                <td className="px-2 py-2 text-slate-900">
                  {row.top_raw_material_code} - {row.top_raw_material_name}
                </td>
                <td className="px-2 py-2 text-slate-700">
                  {row.leaf_raw_material_code} - {row.leaf_raw_material_name}
                </td>
                <td className="px-2 py-2 text-slate-700">{formatPercent(row.effective_percent)}</td>
                <td className="px-2 py-2">
                  <span className={row.declared_inherited ? "text-emerald-700" : "text-slate-500"}>
                    {row.declared_inherited ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export type { FlatIngredientRow };
