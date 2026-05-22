import React, { useEffect, useMemo, useState } from "react";

type DeclarationStatus = "" | "contains" | "may-contain" | "does-not-contain";
type Confidence = "low" | "medium" | "high" | "manual";

type RawMaterial = {
  id?: string;
  rmNumber?: string;
  ingredient?: string;
  allergens?: string;
  ingredientDeclaration?: string;
  subIngredients?: Array<{ name?: string } | string>;
  description?: string;
  micro?: string;
  specFileName?: string;
  specFilePath?: string;
};

type RecipeRow = {
  rm?: string;
  ingredient?: string;
};

type SubAllergen = {
  id: string;
  label: string;
  declarationStatus: "" | "contains" | "does-not-contain";
};

type SourceMaterial = {
  key: string;
  label: string;
  meta: string;
  specFilePath?: string;
};

type AllergenItem = {
  allergenId: string;
  allergenName: string;
  shortLabel: string;
  detected: boolean;
  manualAdded: boolean;
  declarationStatus: DeclarationStatus;
  notes: string;
  confidence: Confidence;
  sourceMaterials: SourceMaterial[];
  reasons: string[];
  subAllergens: SubAllergen[];
};

type SavedAllergenState = {
  productId: string;
  productTitle: string;
  lastUpdated: string;
  items: Array<{
    allergenId: string;
    allergenName: string;
    detected: boolean;
    manualAdded: boolean;
    declarationStatus: DeclarationStatus;
    presentInFinalProduct: boolean;
    mayContain: boolean;
    reviewStatus: "manually-edited" | "needs-review";
    notes: string;
    confidence: Confidence;
    sourceMaterials: SourceMaterial[];
    reasons: string[];
    subAllergens: SubAllergen[];
  }>;
};

type Props = {
  currentProductId: string;
  currentProductTitle: string;
  recipeRows: RecipeRow[];
  fetchMaterials?: () => Promise<RawMaterial[]>;
  onSave?: (payload: SavedAllergenState) => Promise<boolean> | boolean;
  storageKey?: string;
};

const DEFAULT_STORAGE_KEY = "galmereAllergenPageState";

const ALLERGEN_RULES = [
  {
    id: "gluten",
    label: "Cereals containing gluten",
    shortLabel: "Gluten",
    keywords: ["wheat", "rye", "barley", "oats", "spelt", "kamut", "semolina", "durum", "couscous", "malt", "gluten"],
    aliases: ["gluten", "cereals containing gluten"]
  },
  {
    id: "crustaceans",
    label: "Crustaceans",
    shortLabel: "Crustaceans",
    keywords: ["crustacean", "prawn", "shrimp", "crab", "lobster", "langoustine", "scampi"],
    aliases: ["crustaceans", "crustacean"]
  },
  {
    id: "eggs",
    label: "Eggs",
    shortLabel: "Eggs",
    keywords: ["egg", "albumin", "ovalbumin"],
    aliases: ["egg", "eggs"]
  },
  {
    id: "fish",
    label: "Fish",
    shortLabel: "Fish",
    keywords: ["fish", "salmon", "tuna", "cod", "anchovy", "sardine"],
    aliases: ["fish"]
  },
  {
    id: "peanuts",
    label: "Peanuts",
    shortLabel: "Peanuts",
    keywords: ["peanut", "groundnut", "arachis"],
    aliases: ["peanut", "peanuts", "groundnut"]
  },
  {
    id: "soybeans",
    label: "Soybeans",
    shortLabel: "Soy",
    keywords: ["soy", "soya", "soybean", "edamame", "tofu", "miso", "tempeh"],
    aliases: ["soy", "soya", "soybeans", "soybean"]
  },
  {
    id: "milk",
    label: "Milk",
    shortLabel: "Milk",
    keywords: ["milk", "cream", "butter", "cheese", "whey", "lactose", "casein", "yoghurt", "yogurt"],
    aliases: ["milk", "dairy"]
  },
  {
    id: "nuts",
    label: "Nuts",
    shortLabel: "Nuts",
    keywords: ["almond", "hazelnut", "walnut", "cashew", "pecan", "brazil nut", "pistachio", "macadamia", "nut"],
    aliases: ["nuts", "nut"]
  },
  {
    id: "celery",
    label: "Celery",
    shortLabel: "Celery",
    keywords: ["celery", "celeriac"],
    aliases: ["celery"]
  },
  {
    id: "mustard",
    label: "Mustard",
    shortLabel: "Mustard",
    keywords: ["mustard"],
    aliases: ["mustard"]
  },
  {
    id: "sesame",
    label: "Sesame",
    shortLabel: "Sesame",
    keywords: ["sesame", "tahini"],
    aliases: ["sesame"]
  },
  {
    id: "sulphites",
    label: "Sulphur dioxide / sulphites",
    shortLabel: "Sulphites",
    keywords: ["sulphite", "sulfite", "sulphur dioxide", "sulfur dioxide", "e220", "e221", "e222", "e223", "e224", "e226", "e227", "e228"],
    aliases: ["sulphites", "sulfites", "sulphur dioxide", "sulfur dioxide"]
  },
  {
    id: "lupin",
    label: "Lupin",
    shortLabel: "Lupin",
    keywords: ["lupin"],
    aliases: ["lupin"]
  },
  {
    id: "molluscs",
    label: "Molluscs",
    shortLabel: "Molluscs",
    keywords: ["mollusc", "molluscs", "mussel", "clam", "oyster", "squid", "octopus"],
    aliases: ["mollusc", "molluscs"]
  }
] as const;

const ALLERGEN_SUBTYPE_CONFIG: Record<
  string,
  {
    label: string;
    options: Array<{ id: string; label: string }>;
  }
> = {
  gluten: {
    label: "Cereal declaration",
    options: [
      { id: "wheat", label: "Wheat" },
      { id: "rye", label: "Rye" },
      { id: "barley", label: "Barley" },
      { id: "oats", label: "Oats" },
      { id: "spelt", label: "Spelt" },
      { id: "kamut", label: "Kamut" },
      { id: "hybridised-strains", label: "Hybridised strains of the above" }
    ]
  },
  nuts: {
    label: "Nut declaration",
    options: [
      { id: "almonds", label: "Almonds" },
      { id: "hazelnuts", label: "Hazelnuts" },
      { id: "walnuts", label: "Walnuts" },
      { id: "cashews", label: "Cashews" },
      { id: "pecan-nuts", label: "Pecan nuts" },
      { id: "brazil-nuts", label: "Brazil nuts" },
      { id: "pistachio-nuts", label: "Pistachio nuts" },
      { id: "macadamia-queensland", label: "Macadamia / Queensland nuts" }
    ]
  }
};

const CONFIDENCE_SCORES: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
  manual: 4
};

function normaliseAllergenText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normaliseRmCode(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function buildDefaultSubAllergens(allergenId: string): SubAllergen[] {
  const config = ALLERGEN_SUBTYPE_CONFIG[allergenId];
  if (!config) return [];

  return config.options.map((option) => ({
    id: option.id,
    label: option.label,
    declarationStatus: ""
  }));
}

function normaliseSubAllergens(allergenId: string, savedSubAllergens: SubAllergen[] | undefined): SubAllergen[] {
  const defaults = buildDefaultSubAllergens(allergenId);
  if (!defaults.length) return [];

  const savedMap = new Map((savedSubAllergens ?? []).map((item) => [item.id, item]));

  return defaults.map((item) => ({
    ...item,
    declarationStatus: savedMap.get(item.id)?.declarationStatus ?? ""
  }));
}

function parentRequiresSubtypeSelection(item: AllergenItem): boolean {
  return Boolean(
    ALLERGEN_SUBTYPE_CONFIG[item.allergenId] &&
      (item.declarationStatus === "contains" || item.declarationStatus === "may-contain")
  );
}

function hasContainsSubtypeSelection(item: AllergenItem): boolean {
  return item.subAllergens.some((entry) => entry.declarationStatus === "contains");
}

function hasCompletedSubtypeSelection(item: AllergenItem): boolean {
  return item.subAllergens.some(
    (entry) => entry.declarationStatus === "contains" || entry.declarationStatus === "does-not-contain"
  );
}

function getSubtypeValidationMessage(item: AllergenItem): string {
  if (!parentRequiresSubtypeSelection(item)) return "";

  if (item.declarationStatus === "contains") {
    if (hasContainsSubtypeSelection(item)) return "";
    if (item.allergenId === "gluten") {
      return "Marked as Contains. Select at least one named cereal as Contains.";
    }
    if (item.allergenId === "nuts") {
      return "Marked as Contains. Select at least one named nut as Contains.";
    }
    return "Select at least one named subtype as Contains.";
  }

  if (hasCompletedSubtypeSelection(item)) return "";
  return "Complete at least one subtype declaration before saving.";
}

function getRecipeMatchedMaterials(materials: RawMaterial[], recipeRows: RecipeRow[]): RawMaterial[] {
  const normalizedRows = recipeRows
    .map((row) => ({
      rm: normaliseRmCode(row.rm),
      ingredient: String(row.ingredient ?? "").trim().toLowerCase()
    }))
    .filter((row) => row.rm || row.ingredient);

  if (!normalizedRows.length) return [];

  return materials.filter((material) => {
    const materialRm = normaliseRmCode(material.rmNumber);
    const materialIngredient = String(material.ingredient ?? "").trim().toLowerCase();

    return normalizedRows.some((row) => {
      if (row.rm && materialRm && row.rm === materialRm) return true;
      if (row.ingredient && materialIngredient && row.ingredient === materialIngredient) return true;
      return false;
    });
  });
}

function getMaterialFieldChecks(material: RawMaterial): Array<{ label: string; value: string; confidence: Confidence }> {
  return [
    { label: "saved allergen field", value: material.allergens ?? "", confidence: "high" },
    { label: "raw material name", value: material.ingredient ?? "", confidence: "medium" },
    { label: "ingredient declaration", value: material.ingredientDeclaration ?? "", confidence: "high" },
    {
      label: "sub-ingredients",
      value: Array.isArray(material.subIngredients)
        ? material.subIngredients.map((item) => (typeof item === "string" ? item : item.name ?? "")).join(" ")
        : "",
      confidence: "high"
    },
    { label: "supplier description", value: material.description ?? "", confidence: "medium" },
    { label: "supplier/spec notes", value: material.micro ?? "", confidence: "low" },
    { label: "supplier spec reference", value: material.specFileName ?? "", confidence: "low" }
  ];
}

function getHighestConfidence(values: Confidence[]): Confidence {
  return values.reduce((best, current) => {
    return CONFIDENCE_SCORES[current] > CONFIDENCE_SCORES[best] ? current : best;
  }, "low" as Confidence);
}

function buildDetectedItems(materials: RawMaterial[]): AllergenItem[] {
  const byRule = new Map<string, AllergenItem>();

  for (const material of materials) {
    for (const rule of ALLERGEN_RULES) {
      const evidence = getMaterialFieldChecks(material)
        .map((field) => {
          const haystack = normaliseAllergenText(field.value);
          const keyword = rule.keywords.find((kw) => haystack.includes(normaliseAllergenText(kw)));
          if (!keyword) return null;
          return {
            confidence: field.confidence,
            reason: `Matched \"${keyword}\" in ${field.label}.`
          };
        })
        .filter((item): item is { confidence: Confidence; reason: string } => Boolean(item));

      if (!evidence.length) continue;

      const existing = byRule.get(rule.id) ?? {
        allergenId: rule.id,
        allergenName: rule.label,
        shortLabel: rule.shortLabel,
        detected: true,
        manualAdded: false,
        declarationStatus: "contains" as DeclarationStatus,
        notes: "",
        confidence: "low" as Confidence,
        sourceMaterials: [],
        reasons: [],
        subAllergens: buildDefaultSubAllergens(rule.id)
      };

      const materialKey = material.id ?? material.rmNumber ?? material.ingredient ?? "unknown-material";
      const materialLabel = material.ingredient ?? material.rmNumber ?? "Unnamed material";
      const materialMeta = `${material.rmNumber ?? "No RM"} - ${material.ingredient ?? "Unnamed material"}`;

      if (!existing.sourceMaterials.some((entry) => entry.key === materialKey)) {
        existing.sourceMaterials.push({
          key: materialKey,
          label: materialLabel,
          meta: materialMeta,
          specFilePath: material.specFilePath
        });
      }

      for (const item of evidence) {
        const reasonLabel = `${materialMeta}: ${item.reason}`;
        if (!existing.reasons.includes(reasonLabel)) existing.reasons.push(reasonLabel);
      }

      existing.confidence = getHighestConfidence([existing.confidence, ...evidence.map((entry) => entry.confidence)]);
      byRule.set(rule.id, existing);
    }
  }

  return ALLERGEN_RULES.map((rule) => byRule.get(rule.id)).filter((item): item is AllergenItem => Boolean(item));
}

function mergeDetectedWithSaved(baseItems: AllergenItem[], savedItems: SavedAllergenState["items"] | undefined): AllergenItem[] {
  const savedMap = new Map((savedItems ?? []).map((item) => [item.allergenId, item]));

  return ALLERGEN_RULES.map((rule) => {
    const base =
      baseItems.find((entry) => entry.allergenId === rule.id) ??
      ({
        allergenId: rule.id,
        allergenName: rule.label,
        shortLabel: rule.shortLabel,
        detected: false,
        manualAdded: false,
        declarationStatus: "",
        notes: "",
        confidence: "low",
        sourceMaterials: [],
        reasons: [],
        subAllergens: buildDefaultSubAllergens(rule.id)
      } as AllergenItem);

    const saved = savedMap.get(rule.id);
    if (!saved) return base;

    return {
      ...base,
      declarationStatus: saved.declarationStatus ?? base.declarationStatus,
      notes: saved.notes ?? "",
      manualAdded: Boolean(saved.manualAdded),
      subAllergens: normaliseSubAllergens(rule.id, saved.subAllergens)
    };
  });
}

function getStatusPillTone(status: DeclarationStatus): string {
  if (status === "contains") return "bg-rose-100 text-rose-700";
  if (status === "may-contain") return "bg-amber-100 text-amber-700";
  if (status === "does-not-contain") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-500";
}

function getStatusLabel(status: DeclarationStatus): string {
  if (status === "contains") return "Contains";
  if (status === "may-contain") return "May contain";
  if (status === "does-not-contain") return "Does not contain";
  return "Pending";
}

export default function AllergenManagement({
  currentProductId,
  currentProductTitle,
  recipeRows,
  fetchMaterials,
  onSave,
  storageKey = DEFAULT_STORAGE_KEY
}: Props): React.JSX.Element {
  const [items, setItems] = useState<AllergenItem[]>([]);
  const [materialCount, setMaterialCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [invalidParentId, setInvalidParentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError("");
      setSaveMessage("");

      try {
        const materials = fetchMaterials
          ? await fetchMaterials()
          : await fetch("/api/raw-materials").then((res) => res.json() as Promise<RawMaterial[]>);

        const safeMaterials = Array.isArray(materials) ? materials : [];
        const matched = getRecipeMatchedMaterials(safeMaterials, recipeRows);
        const detected = buildDetectedItems(matched);

        const saved = (() => {
          try {
            const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
            return parsed as SavedAllergenState;
          } catch {
            return null;
          }
        })();

        const canReuseSaved =
          saved &&
          typeof saved === "object" &&
          (saved.productId === currentProductId || saved.productTitle === currentProductTitle);

        const merged = mergeDetectedWithSaved(detected, canReuseSaved ? saved.items : undefined);

        if (!cancelled) {
          setItems(merged);
          setMaterialCount(matched.length);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load allergen review for the current product.");
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentProductId, currentProductTitle, recipeRows, fetchMaterials, storageKey]);

  const summary = useMemo(() => {
    const detectedCount = items.filter((item) => item.detected).length;
    const selectedCount = items.filter((item) => item.declarationStatus).length;

    if (!materialCount) return "No recipe-linked raw materials found for this product yet.";

    return `${detectedCount} auto-detected across ${materialCount} recipe materials. ${selectedCount} decisions completed.`;
  }, [items, materialCount]);

  const payload: SavedAllergenState = useMemo(
    () => ({
      productId: currentProductId,
      productTitle: currentProductTitle,
      lastUpdated: new Date().toISOString(),
      items: items.map((item) => ({
        allergenId: item.allergenId,
        allergenName: item.allergenName,
        detected: item.detected,
        manualAdded: item.manualAdded,
        declarationStatus: item.declarationStatus,
        presentInFinalProduct: item.declarationStatus === "contains",
        mayContain: item.declarationStatus === "may-contain",
        reviewStatus: item.declarationStatus ? "manually-edited" : "needs-review",
        notes: item.notes,
        confidence: item.confidence,
        sourceMaterials: item.sourceMaterials,
        reasons: item.reasons,
        subAllergens: item.subAllergens
      }))
    }),
    [currentProductId, currentProductTitle, items]
  );

  function updateItem(index: number, patch: Partial<AllergenItem>): void {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (!parentRequiresSubtypeSelection(next)) {
          next.subAllergens = next.subAllergens.map((entry) => ({ ...entry, declarationStatus: "" }));
        }
        return next;
      })
    );
  }

  function updateSubStatus(index: number, subtypeId: string, value: "contains" | "does-not-contain"): void {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return {
          ...item,
          subAllergens: item.subAllergens.map((entry) =>
            entry.id === subtypeId ? { ...entry, declarationStatus: value } : entry
          )
        };
      })
    );
  }

  async function handleSave(): Promise<void> {
    const invalid = items.find((item) => getSubtypeValidationMessage(item));
    if (invalid) {
      setInvalidParentId(invalid.allergenId);
      setSaveMessage(getSubtypeValidationMessage(invalid));
      return;
    }

    setInvalidParentId(null);
    localStorage.setItem(storageKey, JSON.stringify(payload));

    if (!onSave) {
      setSaveMessage("Allergen decisions saved locally.");
      return;
    }

    const result = await onSave(payload);
    setSaveMessage(result ? "Allergen decisions saved." : "Could not save allergen decisions.");
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading current product allergen review...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">{error}</div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
        <p className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
          Product review
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-800">Allergen Management</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Current product</p>
        <h2 className="text-lg font-semibold text-slate-800">{currentProductTitle || "Untitled Product"}</h2>
        <p className="mt-2 text-sm text-slate-600">{summary}</p>
        {saveMessage ? (
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{saveMessage}</p>
        ) : null}
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="space-y-3">
          {items.map((item, index) => {
            const subtypeMessage = getSubtypeValidationMessage(item);
            const needsSubtype = parentRequiresSubtypeSelection(item);
            const showSubtypeError = invalidParentId === item.allergenId && Boolean(subtypeMessage);

            return (
              <article
                key={item.allergenId}
                className={`rounded-xl border p-4 transition ${
                  item.detected ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">{item.allergenName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusPillTone(item.declarationStatus)}`}>
                        {getStatusLabel(item.declarationStatus)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.detected ? "Auto-detected from recipe-linked materials" : "No detection evidence found"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.sourceMaterials.length ? (
                        item.sourceMaterials.map((source) => (
                          <span key={source.key} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {source.label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">No linked source material</span>
                      )}
                    </div>
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto">
                    {(["contains", "may-contain", "does-not-contain"] as DeclarationStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateItem(index, { declarationStatus: status })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          item.declarationStatus === status
                            ? status === "contains"
                              ? "border-rose-300 bg-rose-100 text-rose-700"
                              : status === "may-contain"
                                ? "border-amber-300 bg-amber-100 text-amber-700"
                                : "border-slate-300 bg-slate-200 text-slate-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {needsSubtype ? (
                  <div
                    className={`mt-3 rounded-lg border p-3 ${
                      showSubtypeError ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {ALLERGEN_SUBTYPE_CONFIG[item.allergenId]?.label ?? "Subtype declaration"}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {item.subAllergens.map((entry) => (
                        <div key={entry.id} className="rounded-md border border-slate-200 bg-white p-2">
                          <p className="text-xs font-medium text-slate-700">{entry.label}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateSubStatus(index, entry.id, "contains")}
                              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                entry.declarationStatus === "contains"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              Contains
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSubStatus(index, entry.id, "does-not-contain")}
                              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                entry.declarationStatus === "does-not-contain"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              Does not contain
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {showSubtypeError ? <p className="mt-2 text-xs font-semibold text-rose-700">{subtypeMessage}</p> : null}
                  </div>
                ) : null}

                <div className="mt-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</label>
                  <textarea
                    value={item.notes}
                    onChange={(event) => updateItem(index, { notes: event.target.value })}
                    placeholder="Add compliance notes, supplier evidence, or review comments"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-teal-300 focus:ring"
                    rows={3}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">Review complete rows and save decisions when finished.</p>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Save decisions
        </button>
      </div>
    </section>
  );
}
