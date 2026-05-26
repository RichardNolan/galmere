import type { FormDraft } from "#/components/raw-materials/types";

type Props = {
  draft: FormDraft;
  onPatch: (patch: Partial<FormDraft>) => void;
  includePlaceholders?: boolean;
};

export function RawMaterialFormFields({ draft, onPatch, includePlaceholders = false }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            RM Code
          </span>
          <input
            value={draft.rm_code}
            onChange={(event) => onPatch({ rm_code: event.target.value })}
            placeholder={includePlaceholders ? "RM-XXX-001" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Ingredient Name
          </span>
          <input
            value={draft.name}
            onChange={(event) => onPatch({ name: event.target.value })}
            placeholder={includePlaceholders ? "Tomato Concentrate" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Supplier
          </span>
          <input
            value={draft.supplier_name}
            onChange={(event) => onPatch({ supplier_name: event.target.value })}
            placeholder={includePlaceholders ? "Supplier Name" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Country of Origin
          </span>
          <input
            value={draft.country_of_origin}
            onChange={(event) => onPatch({ country_of_origin: event.target.value })}
            placeholder={includePlaceholders ? "Ireland" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Declaration Text
          </span>
          <textarea
            value={draft.declaration_text}
            onChange={(event) => onPatch({ declaration_text: event.target.value })}
            rows={3}
            placeholder={includePlaceholders ? "Tomatoes, Citric Acid (E330)" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Spec File Path
          </span>
          <input
            value={draft.spec_file_path}
            onChange={(event) => onPatch({ spec_file_path: event.target.value })}
            placeholder={includePlaceholders ? "specs/rm-123.pdf" : undefined}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <div className="flex items-end gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(event) => onPatch({ is_active: event.target.checked })}
            />
            Active
          </label>
        </div>
      </div>
    </div>
  );
}
