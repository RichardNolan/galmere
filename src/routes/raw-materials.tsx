import { PdfExtractor } from "#/components/pdf-extractor";
import { AllergenDeclarationsDialog } from "#/components/raw-materials/allergen-declarations-dialog";
import { CreateRawMaterialDialog } from "#/components/raw-materials/create-raw-material-dialog";
import { EditRawMaterialDialog } from "#/components/raw-materials/edit-raw-material-dialog";
import { RawMaterialsTable } from "#/components/raw-materials/raw-materials-table";
import type {
  AllergenRuleRow,
  AllergenSubtypeRow,
  RawMaterialRow,
} from "#/components/raw-materials/types";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { useRawMaterialsPage } from "#/hooks/use-raw-materials-page";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/raw-materials")({
  beforeLoad: async () => requireAuth(),
  loader: async () => {
    const supabase = await createServerSupabaseClient();

    const [rawMaterialsResult, allergenRulesResult, allergenSubtypesResult] = await Promise.all([
      supabase
        .from("raw_materials")
        .select(
          "id, rm_code, name, supplier_name, country_of_origin, declaration_text, spec_file_path, is_active",
        )
        .order("rm_code", { ascending: true }),
      supabase
        .from("allergen_rules")
        .select("id, label, short_label, has_subtypes, sort_order, is_active")
        .order("sort_order", { ascending: true }),
      supabase
        .from("allergen_subtypes")
        .select("id, allergen_id, label, sort_order, is_active")
        .order("sort_order", { ascending: true }),
    ]);

    if (rawMaterialsResult.error) {
      throw new Error(`Failed to load raw materials: ${rawMaterialsResult.error.message}`);
    }

    if (allergenRulesResult.error) {
      throw new Error(`Failed to load allergen rules: ${allergenRulesResult.error.message}`);
    }

    if (allergenSubtypesResult.error) {
      throw new Error(`Failed to load allergen subtypes: ${allergenSubtypesResult.error.message}`);
    }

    const allergenRules = ((allergenRulesResult.data ?? []) as AllergenRuleRow[])
      .filter((row) => row.is_active !== false)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

    const allergenSubtypes = ((allergenSubtypesResult.data ?? []) as AllergenSubtypeRow[])
      .filter((row) => row.is_active !== false)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

    return {
      rawMaterials: (rawMaterialsResult.data ?? []) as RawMaterialRow[],
      allergenRules,
      allergenSubtypes,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const page = useRawMaterialsPage(Route.useLoaderData());

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-2xl border-emerald-200/70 bg-white/90 shadow-[0_22px_70px_-35px_rgba(16,185,129,0.45)]">
        <CardContent className="p-5 sm:p-6">
          <Badge className="tracking-[0.24em]">RAW MATERIAL CONTROL</Badge>
          <h1 className="mt-2 text-3xl font-black leading-tight text-zinc-900 sm:text-4xl">
            Raw Materials
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-zinc-700 sm:text-base">
            Create, edit, and maintain raw materials and manage allergen declarations per material.
            This drives product-level allergen detection and review workflows.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-200 bg-white/95 shadow-xl shadow-zinc-200/60">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex justify-end">
            <Button type="button" onClick={page.openCreateDialog}>
              Create raw material
            </Button>
            <PdfExtractor
              skipUpload
              extractionType="lab-cert"
              onResult={(result) => console.log(result)}
              onError={(err) => console.error(err)}
              triggerLabel="Extract from PDF"
            />
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Search raw materials
              </span>
              <input
                value={page.search}
                onChange={(event) => page.setSearch(event.target.value)}
                placeholder="Search by RM code, name, supplier, or country"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <div className="flex items-end">
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Showing {page.filteredRawMaterials.length} of {page.rawMaterials.length}
              </p>
            </div>
          </div>

          {page.statusMessage ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {page.statusMessage}
            </p>
          ) : null}

          <RawMaterialsTable
            rows={page.filteredRawMaterials}
            editingId={page.editingId}
            allergenEditorId={page.allergenEditorId}
            isBusy={page.isBusy}
            isAllergenBusy={page.isAllergenBusy}
            onEdit={page.beginEdit}
            onOpenAllergens={page.openAllergenEditor}
            onDelete={page.deleteRawMaterial}
          />
        </CardContent>
      </Card>

      <EditRawMaterialDialog
        open={Boolean(page.editingId)}
        isBusy={page.isBusy}
        draft={page.editDraft}
        selectedRawMaterial={page.selectedEditRawMaterial}
        onPatchDraft={page.updateEditDraft}
        onSave={page.saveEdit}
        onClose={page.closeEditDialog}
      />

      <CreateRawMaterialDialog
        open={page.isCreateDialogOpen}
        isBusy={page.isBusy}
        draft={page.createDraft}
        onPatchDraft={page.updateCreateDraft}
        onCreate={page.createRawMaterial}
        onClose={page.closeCreateDialog}
      />

      <AllergenDeclarationsDialog
        open={Boolean(page.allergenEditorId)}
        selectedRawMaterial={page.selectedRawMaterial}
        allergenRules={page.allergenRules}
        subtypeOptionsByAllergen={page.subtypeOptionsByAllergen}
        draftRows={page.allergenDraftRows}
        statusMessage={page.allergenStatusMessage}
        isBusy={page.isAllergenBusy}
        onAddRow={page.addDeclarationDraft}
        onUpdateRow={page.updateDeclarationDraft}
        onRemoveRow={page.removeDeclarationDraft}
        onSave={page.saveAllergenDeclarations}
        onClose={page.closeAllergenDialog}
      />
    </main>
  );
}
