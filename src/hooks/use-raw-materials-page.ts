import {
  EMPTY_DECLARATION_DRAFT,
  EMPTY_FORM_DRAFT,
  type AllergenDeclarationRow,
  type DeclarationDraftRow,
  type FormDraft,
  type RawMaterialRow,
  type RawMaterialsLoaderData,
} from "#/components/raw-materials/types";
import { supabase } from "#/lib/supabase";
import { useMemo, useState } from "react";

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toFormDraft(row: RawMaterialRow): FormDraft {
  return {
    rm_code: row.rm_code,
    name: row.name,
    supplier_name: row.supplier_name ?? "",
    country_of_origin: row.country_of_origin ?? "",
    declaration_text: row.declaration_text ?? "",
    spec_file_path: row.spec_file_path ?? "",
    is_active: row.is_active,
  };
}

function toDeclarationDraftRows(rows: AllergenDeclarationRow[]): DeclarationDraftRow[] {
  if (!rows.length) {
    return [{ ...EMPTY_DECLARATION_DRAFT }];
  }

  return rows.map((row) => ({
    allergen_id: row.allergen_id,
    subtype_id: row.subtype_id ?? "",
    declared_status: row.declared_status,
    source: row.source,
    confidence: row.confidence,
    notes: row.notes ?? "",
  }));
}

export function useRawMaterialsPage(loaderData: RawMaterialsLoaderData) {
  const [rawMaterials, setRawMaterials] = useState(loaderData.rawMaterials);
  const [allergenRules] = useState(loaderData.allergenRules);
  const [allergenSubtypes] = useState(loaderData.allergenSubtypes);

  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<FormDraft>(EMPTY_FORM_DRAFT);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FormDraft>(EMPTY_FORM_DRAFT);

  const [allergenEditorId, setAllergenEditorId] = useState<string | null>(null);
  const [allergenDraftRows, setAllergenDraftRows] = useState<DeclarationDraftRow[]>([
    { ...EMPTY_DECLARATION_DRAFT },
  ]);
  const [allergenStatusMessage, setAllergenStatusMessage] = useState<string | null>(null);
  const [isAllergenBusy, setIsAllergenBusy] = useState(false);

  const filteredRawMaterials = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized.length) return rawMaterials;

    return rawMaterials.filter((row) => {
      return (
        row.rm_code.toLowerCase().includes(normalized) ||
        row.name.toLowerCase().includes(normalized) ||
        (row.supplier_name ?? "").toLowerCase().includes(normalized) ||
        (row.country_of_origin ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [rawMaterials, search]);

  const selectedRawMaterial = useMemo(
    () => rawMaterials.find((row) => row.id === allergenEditorId) ?? null,
    [allergenEditorId, rawMaterials],
  );

  const selectedEditRawMaterial = useMemo(
    () => rawMaterials.find((row) => row.id === editingId) ?? null,
    [editingId, rawMaterials],
  );

  const subtypeOptionsByAllergen = useMemo(() => {
    return allergenSubtypes.reduce<Record<string, typeof allergenSubtypes>>((acc, subtype) => {
      const key = subtype.allergen_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(subtype);
      return acc;
    }, {});
  }, [allergenSubtypes]);

  const refreshRawMaterials = async () => {
    const { data, error } = await supabase
      .from("raw_materials")
      .select(
        "id, rm_code, name, supplier_name, country_of_origin, declaration_text, spec_file_path, is_active",
      )
      .order("rm_code", { ascending: true });

    if (error) {
      setStatusMessage(`Failed to refresh raw materials: ${error.message}`);
      return;
    }

    setRawMaterials((data ?? []) as RawMaterialRow[]);
  };

  const openCreateDialog = () => {
    setCreateDraft(EMPTY_FORM_DRAFT);
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCreateDraft(EMPTY_FORM_DRAFT);
  };

  const updateCreateDraft = (patch: Partial<FormDraft>) => {
    setCreateDraft((current) => ({ ...current, ...patch }));
  };

  const createRawMaterial = async () => {
    if (!createDraft.rm_code.trim() || !createDraft.name.trim()) {
      setStatusMessage("RM code and ingredient name are required.");
      return;
    }

    setIsBusy(true);
    setStatusMessage(null);

    const payload = {
      rm_code: createDraft.rm_code.trim(),
      name: createDraft.name.trim(),
      supplier_name: toNullableText(createDraft.supplier_name),
      country_of_origin: toNullableText(createDraft.country_of_origin),
      declaration_text: toNullableText(createDraft.declaration_text),
      spec_file_path: toNullableText(createDraft.spec_file_path),
      is_active: createDraft.is_active,
    };

    const { error } = await supabase.from("raw_materials").insert(payload);

    if (error) {
      setStatusMessage(`Failed to create raw material: ${error.message}`);
      setIsBusy(false);
      return;
    }

    closeCreateDialog();
    await refreshRawMaterials();
    setStatusMessage("Raw material created successfully.");
    setIsBusy(false);
  };

  const beginEdit = (row: RawMaterialRow) => {
    setEditingId(row.id);
    setEditDraft(toFormDraft(row));
    setStatusMessage(null);
  };

  const closeEditDialog = () => {
    setEditingId(null);
    setEditDraft(EMPTY_FORM_DRAFT);
  };

  const updateEditDraft = (patch: Partial<FormDraft>) => {
    setEditDraft((current) => ({ ...current, ...patch }));
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (!editDraft.rm_code.trim() || !editDraft.name.trim()) {
      setStatusMessage("RM code and ingredient name are required.");
      return;
    }

    setIsBusy(true);
    setStatusMessage(null);

    const payload = {
      rm_code: editDraft.rm_code.trim(),
      name: editDraft.name.trim(),
      supplier_name: toNullableText(editDraft.supplier_name),
      country_of_origin: toNullableText(editDraft.country_of_origin),
      declaration_text: toNullableText(editDraft.declaration_text),
      spec_file_path: toNullableText(editDraft.spec_file_path),
      is_active: editDraft.is_active,
    };

    const { error } = await supabase.from("raw_materials").update(payload).eq("id", editingId);

    if (error) {
      setStatusMessage(`Failed to update raw material: ${error.message}`);
      setIsBusy(false);
      return;
    }

    await refreshRawMaterials();
    closeEditDialog();
    setStatusMessage("Raw material updated successfully.");
    setIsBusy(false);
  };

  const deleteRawMaterial = async (row: RawMaterialRow) => {
    const confirmed = window.confirm(
      `Delete ${row.rm_code} - ${row.name}? This cannot be undone and may fail if linked to recipes.`,
    );
    if (!confirmed) return;

    setIsBusy(true);
    setStatusMessage(null);

    const { error } = await supabase.from("raw_materials").delete().eq("id", row.id);

    if (error) {
      setStatusMessage(`Failed to delete raw material: ${error.message}`);
      setIsBusy(false);
      return;
    }

    if (allergenEditorId === row.id) {
      closeAllergenDialog();
    }

    await refreshRawMaterials();
    setStatusMessage("Raw material deleted successfully.");
    setIsBusy(false);
  };

  const openAllergenEditor = async (row: RawMaterialRow) => {
    setIsAllergenBusy(true);
    setAllergenStatusMessage(null);
    setAllergenEditorId(row.id);

    const { data, error } = await supabase
      .from("raw_material_allergen_declarations")
      .select(
        "id, raw_material_id, allergen_id, subtype_id, declared_status, source, confidence, notes",
      )
      .eq("raw_material_id", row.id)
      .eq("is_current", true)
      .order("created_at", { ascending: true });

    if (error) {
      setAllergenStatusMessage(`Failed to load declarations: ${error.message}`);
      setAllergenDraftRows([{ ...EMPTY_DECLARATION_DRAFT }]);
      setIsAllergenBusy(false);
      return;
    }

    setAllergenDraftRows(toDeclarationDraftRows((data ?? []) as AllergenDeclarationRow[]));
    setIsAllergenBusy(false);
  };

  const closeAllergenDialog = () => {
    setAllergenEditorId(null);
    setAllergenDraftRows([{ ...EMPTY_DECLARATION_DRAFT }]);
    setAllergenStatusMessage(null);
  };

  const updateDeclarationDraft = (index: number, patch: Partial<DeclarationDraftRow>) => {
    setAllergenDraftRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  };

  const addDeclarationDraft = () => {
    setAllergenDraftRows((current) => [...current, { ...EMPTY_DECLARATION_DRAFT }]);
  };

  const removeDeclarationDraft = (index: number) => {
    setAllergenDraftRows((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index);
      return next.length ? next : [{ ...EMPTY_DECLARATION_DRAFT }];
    });
  };

  const saveAllergenDeclarations = async () => {
    if (!allergenEditorId) return;

    const validRows = allergenDraftRows.filter((row) => row.allergen_id.trim().length > 0);
    const duplicateKeySet = new Set<string>();

    for (const row of validRows) {
      const uniqueKey = `${row.allergen_id}::${row.subtype_id || ""}`;
      if (duplicateKeySet.has(uniqueKey)) {
        setAllergenStatusMessage(
          "Each allergen/subtype combination can only appear once per raw material.",
        );
        return;
      }
      duplicateKeySet.add(uniqueKey);
    }

    setIsAllergenBusy(true);
    setAllergenStatusMessage(null);

    const { error: deleteError } = await supabase
      .from("raw_material_allergen_declarations")
      .delete()
      .eq("raw_material_id", allergenEditorId)
      .eq("is_current", true);

    if (deleteError) {
      setAllergenStatusMessage(`Failed to replace existing declarations: ${deleteError.message}`);
      setIsAllergenBusy(false);
      return;
    }

    if (validRows.length > 0) {
      const payload = validRows.map((row) => ({
        raw_material_id: allergenEditorId,
        allergen_id: row.allergen_id,
        subtype_id: row.subtype_id.trim().length ? row.subtype_id : null,
        declared_status: row.declared_status,
        source: row.source,
        confidence: row.confidence,
        notes: toNullableText(row.notes),
        is_current: true,
      }));

      const { error: insertError } = await supabase
        .from("raw_material_allergen_declarations")
        .insert(payload);

      if (insertError) {
        setAllergenStatusMessage(`Failed to save declarations: ${insertError.message}`);
        setIsAllergenBusy(false);
        return;
      }
    }

    setAllergenStatusMessage("Allergen declarations updated successfully.");
    setIsAllergenBusy(false);
  };

  return {
    rawMaterials,
    allergenRules,
    filteredRawMaterials,
    selectedRawMaterial,
    selectedEditRawMaterial,
    subtypeOptionsByAllergen,

    search,
    statusMessage,
    isBusy,
    isAllergenBusy,

    isCreateDialogOpen,
    createDraft,
    editingId,
    editDraft,
    allergenEditorId,
    allergenDraftRows,
    allergenStatusMessage,

    setSearch,
    openCreateDialog,
    closeCreateDialog,
    updateCreateDraft,
    createRawMaterial,

    beginEdit,
    closeEditDialog,
    updateEditDraft,
    saveEdit,
    deleteRawMaterial,

    openAllergenEditor,
    closeAllergenDialog,
    updateDeclarationDraft,
    addDeclarationDraft,
    removeDeclarationDraft,
    saveAllergenDeclarations,
  };
}
