import type { RawMaterialRow } from "#/components/raw-materials/types";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";

type Props = {
  rows: RawMaterialRow[];
  editingId: string | null;
  allergenEditorId: string | null;
  isBusy: boolean;
  isAllergenBusy: boolean;
  onEdit: (row: RawMaterialRow) => void;
  onOpenAllergens: (row: RawMaterialRow) => void;
  onDelete: (row: RawMaterialRow) => void;
};

export function RawMaterialsTable({
  rows,
  editingId,
  allergenEditorId,
  isBusy,
  isAllergenBusy,
  onEdit,
  onOpenAllergens,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-50 text-left">
            <th className="border-b border-zinc-200 px-3 py-2">RM Code</th>
            <th className="border-b border-zinc-200 px-3 py-2">Ingredient</th>
            <th className="border-b border-zinc-200 px-3 py-2">Supplier</th>
            <th className="border-b border-zinc-200 px-3 py-2">Country</th>
            <th className="border-b border-zinc-200 px-3 py-2">Status</th>
            <th className="border-b border-zinc-200 px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            const isAllergenSelected = allergenEditorId === row.id;

            return (
              <tr key={row.id} className="border-b border-zinc-100 align-top last:border-b-0">
                <td className="px-3 py-2 text-zinc-800">{row.rm_code}</td>
                <td className="px-3 py-2 text-zinc-900">{row.name}</td>
                <td className="px-3 py-2 text-zinc-700">{row.supplier_name ?? "-"}</td>
                <td className="px-3 py-2 text-zinc-700">{row.country_of_origin ?? "-"}</td>
                <td className="px-3 py-2">
                  <Badge variant={row.is_active ? "default" : "secondary"}>
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>
                      {isEditing ? "Editing" : "Edit"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAllergenSelected ? "default" : "outline"}
                      onClick={() => onOpenAllergens(row)}
                      disabled={isAllergenBusy && !isAllergenSelected}
                    >
                      {isAllergenSelected ? "Allergens (open)" : "Allergens"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(row)}
                      disabled={isBusy}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
