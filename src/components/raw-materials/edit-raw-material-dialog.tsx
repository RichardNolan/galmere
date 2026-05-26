import { RawMaterialFormFields } from "#/components/raw-materials/raw-material-form-fields";
import type { FormDraft, RawMaterialRow } from "#/components/raw-materials/types";
import { Button } from "#/components/ui/button";

type Props = {
  open: boolean;
  isBusy: boolean;
  draft: FormDraft;
  selectedRawMaterial: RawMaterialRow | null;
  onPatchDraft: (patch: Partial<FormDraft>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function EditRawMaterialDialog({
  open,
  isBusy,
  draft,
  selectedRawMaterial,
  onPatchDraft,
  onSave,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto mt-6 w-full max-w-5xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl sm:mt-10 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Edit Raw Material</h2>
            <p className="text-sm text-zinc-700">
              {selectedRawMaterial
                ? `${selectedRawMaterial.rm_code} - ${selectedRawMaterial.name}`
                : "Update the selected raw material record."}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <RawMaterialFormFields draft={draft} onPatch={onPatchDraft} />

        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={onSave} disabled={isBusy}>
            {isBusy ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
