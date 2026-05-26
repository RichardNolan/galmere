import { RawMaterialFormFields } from "#/components/raw-materials/raw-material-form-fields";
import type { FormDraft } from "#/components/raw-materials/types";
import { Button } from "#/components/ui/button";

type Props = {
  open: boolean;
  isBusy: boolean;
  draft: FormDraft;
  onPatchDraft: (patch: Partial<FormDraft>) => void;
  onCreate: () => void;
  onClose: () => void;
};

export function CreateRawMaterialDialog({
  open,
  isBusy,
  draft,
  onPatchDraft,
  onCreate,
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
            <h2 className="text-xl font-bold text-zinc-900">Create Raw Material</h2>
            <p className="text-sm text-zinc-700">
              Add a new raw material record before linking it to recipes.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <RawMaterialFormFields draft={draft} onPatch={onPatchDraft} includePlaceholders />

        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={onCreate} disabled={isBusy}>
            {isBusy ? "Saving..." : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
