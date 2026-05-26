import type {
  AllergenRuleRow,
  AllergenSubtypeRow,
  DeclarationConfidence,
  DeclarationDraftRow,
  DeclarationSource,
  DeclarationStatus,
  RawMaterialRow,
} from "#/components/raw-materials/types";
import { Button } from "#/components/ui/button";

type Props = {
  open: boolean;
  selectedRawMaterial: RawMaterialRow | null;
  allergenRules: AllergenRuleRow[];
  subtypeOptionsByAllergen: Record<string, AllergenSubtypeRow[]>;
  draftRows: DeclarationDraftRow[];
  statusMessage: string | null;
  isBusy: boolean;
  onAddRow: () => void;
  onUpdateRow: (index: number, patch: Partial<DeclarationDraftRow>) => void;
  onRemoveRow: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AllergenDeclarationsDialog({
  open,
  selectedRawMaterial,
  allergenRules,
  subtypeOptionsByAllergen,
  draftRows,
  statusMessage,
  isBusy,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onSave,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl sm:mt-10 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Allergen Declarations</h2>
            <p className="text-sm text-zinc-700">
              {selectedRawMaterial
                ? `Editing declarations for ${selectedRawMaterial.rm_code} - ${selectedRawMaterial.name}`
                : "Edit allergen declarations for the selected raw material."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onAddRow}>
              Add declaration row
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {statusMessage ? (
          <p className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {statusMessage}
          </p>
        ) : null}

        {!allergenRules.length ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No allergen rules are available to select. Check that allergen_rules contains rows and
            that your app client has read access.
          </p>
        ) : null}

        <div className="space-y-3">
          {draftRows.map((row, index) => {
            const selectedRule = allergenRules.find((rule) => rule.id === row.allergen_id);
            const subtypeOptions = selectedRule
              ? (subtypeOptionsByAllergen[selectedRule.id] ?? [])
              : [];
            const subtypeDisabled = !row.allergen_id || subtypeOptions.length === 0;
            const subtypePlaceholder = !row.allergen_id
              ? "Select allergen first"
              : subtypeOptions.length === 0
                ? "No subtype available"
                : "No subtype";

            return (
              <div
                key={`${index}-${row.allergen_id}-${row.subtype_id}`}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Allergen
                    </span>
                    <select
                      value={row.allergen_id}
                      onChange={(event) =>
                        onUpdateRow(index, {
                          allergen_id: event.target.value,
                          subtype_id: "",
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none"
                    >
                      <option value="">Select allergen</option>
                      {allergenRules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                          {rule.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Subtype
                    </span>
                    <select
                      value={row.subtype_id}
                      onChange={(event) => onUpdateRow(index, { subtype_id: event.target.value })}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                        subtypeDisabled
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                          : "border-zinc-300 bg-white text-zinc-900"
                      }`}
                      disabled={subtypeDisabled}
                    >
                      <option value="">{subtypePlaceholder}</option>
                      {subtypeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {row.allergen_id && subtypeOptions.length === 0 ? (
                      <span className="mt-1 block text-xs text-amber-700">
                        This allergen has no configured subtype options.
                      </span>
                    ) : null}
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Status
                    </span>
                    <select
                      value={row.declared_status}
                      onChange={(event) =>
                        onUpdateRow(index, {
                          declared_status: event.target.value as DeclarationStatus,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none"
                    >
                      <option value="contains">Contains</option>
                      <option value="may-contain">May contain</option>
                      <option value="does-not-contain">Does not contain</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Source
                    </span>
                    <select
                      value={row.source}
                      onChange={(event) =>
                        onUpdateRow(index, {
                          source: event.target.value as DeclarationSource,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none"
                    >
                      <option value="supplier_spec">Supplier spec</option>
                      <option value="manual_review">Manual review</option>
                      <option value="lab_test">Lab test</option>
                      <option value="inferred_from_ingredients">Inferred from ingredients</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Confidence
                    </span>
                    <select
                      value={row.confidence}
                      onChange={(event) =>
                        onUpdateRow(index, {
                          confidence: event.target.value as DeclarationConfidence,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveRow(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Notes
                  </span>
                  <input
                    value={row.notes}
                    onChange={(event) => onUpdateRow(index, { notes: event.target.value })}
                    placeholder="Evidence or review notes"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={onSave} disabled={isBusy}>
            {isBusy ? "Saving..." : "Save declarations"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
