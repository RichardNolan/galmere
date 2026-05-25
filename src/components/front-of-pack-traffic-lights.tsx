import type { Product as ProductType } from "#/api/Products";

type FrontOfPackTrafficLightsProps = {
  product: ProductType;
  fopPolicyData?: {
    policyVersion: string;
    thresholds: Array<{
      nutrient_code: FopNutrientCode;
      low_cutoff: number;
      medium_cutoff: number;
    }>;
    messages: Array<{
      message_key: string;
      message_value: string;
    }>;
  } | null;
};

type FopNutrientCode = "fat" | "saturates" | "sugars" | "salt";
type NutritionSourceField = "fat" | "sat" | "sugar" | "salt";
type FopStatus = "LOW" | "MEDIUM" | "HIGH" | "PENDING";
type FopColorTone = "green" | "amber" | "red" | "pending";

type FopNutrientDefinition = {
  nutrientCode: FopNutrientCode;
  displayName: string;
  sourceField: NutritionSourceField;
  awaitingMessageKey: string;
  fallbackAwaitingMessage: string;
};

type FopThreshold = {
  lowCutoff: number;
  mediumCutoff: number;
};

type FopTile = {
  nutrient_code: FopNutrientCode;
  display_name: string;
  display_value: string;
  status_label: string;
  color_tone: FopColorTone;
};

type NutritionRecordLike = {
  source: string | null;
  rejected: boolean;
  fat: unknown;
  sat: unknown;
  sugar: unknown;
  salt: unknown;
};

const FOP_POLICY_VERSION = "v1";

const fopNutrientDefs: FopNutrientDefinition[] = [
  {
    nutrientCode: "fat",
    displayName: "Fat",
    sourceField: "fat",
    awaitingMessageKey: "fop.awaiting_fat",
    fallbackAwaitingMessage: "AWAITING FAT INPUT",
  },
  {
    nutrientCode: "saturates",
    displayName: "Saturated fat",
    sourceField: "sat",
    awaitingMessageKey: "fop.awaiting_sat_fat",
    fallbackAwaitingMessage: "AWAITING SAT FAT INPUT",
  },
  {
    nutrientCode: "sugars",
    displayName: "Sugars",
    sourceField: "sugar",
    awaitingMessageKey: "fop.awaiting_sugars",
    fallbackAwaitingMessage: "AWAITING SUGARS INPUT",
  },
  {
    nutrientCode: "salt",
    displayName: "Salt",
    sourceField: "salt",
    awaitingMessageKey: "fop.awaiting_salt",
    fallbackAwaitingMessage: "AWAITING SALT INPUT",
  },
];

const fopThresholdsByPolicyVersion: Record<string, Record<FopNutrientCode, FopThreshold>> = {
  [FOP_POLICY_VERSION]: {
    fat: { lowCutoff: 3, mediumCutoff: 17.5 },
    saturates: { lowCutoff: 1.5, mediumCutoff: 5 },
    sugars: { lowCutoff: 5, mediumCutoff: 22.5 },
    salt: { lowCutoff: 0.3, mediumCutoff: 1.5 },
  },
};

const statusLabelByStatus: Record<Exclude<FopStatus, "PENDING">, string> = {
  LOW: "LOW per serving",
  MEDIUM: "MEDIUM per serving",
  HIGH: "HIGH per serving",
};

const fallbackMessages: Record<string, string> = {
  "fop.awaiting_serving_size": "ENTER SERVING SIZE ON DASHBOARD",
  "fop.awaiting_fat": "AWAITING FAT INPUT",
  "fop.awaiting_sat_fat": "AWAITING SAT FAT INPUT",
  "fop.awaiting_sugars": "AWAITING SUGARS INPUT",
  "fop.awaiting_salt": "AWAITING SALT INPUT",
  "fop.status.low": "LOW per serving",
  "fop.status.medium": "MEDIUM per serving",
  "fop.status.high": "HIGH per serving",
};

function toServingSizeMultiplier(servingSizeValue: unknown): number | null {
  const servingSize = Number(servingSizeValue);

  if (!Number.isFinite(servingSize) || servingSize <= 0) {
    return null;
  }

  return servingSize / 100;
}

function toPerServingValue(per100gValue: number, servingSizeMultiplier: number): number {
  return per100gValue * servingSizeMultiplier;
}

function getFopStatus(value: number, threshold: FopThreshold): Exclude<FopStatus, "PENDING"> {
  if (value <= threshold.lowCutoff) {
    return "LOW";
  }

  if (value <= threshold.mediumCutoff) {
    return "MEDIUM";
  }

  return "HIGH";
}

function formatGrams(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, "")}g`;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPer100gValuesFromRawNutrition(
  product: ProductType,
): Record<NutritionSourceField, number> {
  const records = (product.nutrition ?? []) as NutritionRecordLike[];
  const override = records.find((record) => record.source === null) ?? null;

  if (override) {
    return {
      fat: toFiniteNumber(override.fat) ?? Number.NaN,
      sat: toFiniteNumber(override.sat) ?? Number.NaN,
      sugar: toFiniteNumber(override.sugar) ?? Number.NaN,
      salt: toFiniteNumber(override.salt) ?? Number.NaN,
    };
  }

  const includedReports = records.filter(
    (record) =>
      typeof record.source === "string" && record.source.trim().length > 0 && !record.rejected,
  );

  function averageField(field: NutritionSourceField): number {
    const values = includedReports
      .map((record) => toFiniteNumber(record[field]))
      .filter((value): value is number => value !== null);

    if (!values.length) {
      return Number.NaN;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  return {
    fat: averageField("fat"),
    sat: averageField("sat"),
    sugar: averageField("sugar"),
    salt: averageField("salt"),
  };
}

function evaluateFopTiles(params: {
  per100gValues: Record<NutritionSourceField, number>;
  servingSizeMultiplier: number | null;
  policyVersion?: string;
  thresholdsByNutrient?: Partial<Record<FopNutrientCode, FopThreshold>>;
  messageByKey?: Record<string, string>;
}): FopTile[] {
  const {
    per100gValues,
    servingSizeMultiplier,
    policyVersion = FOP_POLICY_VERSION,
    thresholdsByNutrient,
    messageByKey,
  } = params;
  const fallbackThresholds =
    fopThresholdsByPolicyVersion[policyVersion] ?? fopThresholdsByPolicyVersion[FOP_POLICY_VERSION];
  const resolvedThresholds: Record<FopNutrientCode, FopThreshold> = {
    fat: thresholdsByNutrient?.fat ?? fallbackThresholds.fat,
    saturates: thresholdsByNutrient?.saturates ?? fallbackThresholds.saturates,
    sugars: thresholdsByNutrient?.sugars ?? fallbackThresholds.sugars,
    salt: thresholdsByNutrient?.salt ?? fallbackThresholds.salt,
  };

  function getMessage(key: string): string {
    return messageByKey?.[key] ?? fallbackMessages[key] ?? key;
  }

  return fopNutrientDefs.map((metric) => {
    if (servingSizeMultiplier === null) {
      return {
        nutrient_code: metric.nutrientCode,
        display_name: metric.displayName,
        display_value: "--",
        status_label: getMessage("fop.awaiting_serving_size"),
        color_tone: "pending",
      };
    }

    const per100gValue = per100gValues[metric.sourceField];

    if (!Number.isFinite(per100gValue)) {
      return {
        nutrient_code: metric.nutrientCode,
        display_name: metric.displayName,
        display_value: "--",
        status_label: getMessage(metric.awaitingMessageKey) || metric.fallbackAwaitingMessage,
        color_tone: "pending",
      };
    }

    const perServingValue = toPerServingValue(per100gValue, servingSizeMultiplier);
    const status = getFopStatus(perServingValue, resolvedThresholds[metric.nutrientCode]);

    const statusKey =
      status === "LOW"
        ? "fop.status.low"
        : status === "MEDIUM"
          ? "fop.status.medium"
          : "fop.status.high";

    return {
      nutrient_code: metric.nutrientCode,
      display_name: metric.displayName,
      display_value: formatGrams(perServingValue),
      status_label: getMessage(statusKey) || statusLabelByStatus[status],
      color_tone: status === "LOW" ? "green" : status === "MEDIUM" ? "amber" : "red",
    };
  });
}

function getLevelClasses(colorTone: FopColorTone) {
  if (colorTone === "green" || colorTone === "pending") {
    return {
      accent: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-900",
    };
  }

  if (colorTone === "amber") {
    return {
      accent: "bg-amber-500",
      badge: "bg-amber-100 text-amber-900",
    };
  }

  return {
    accent: "bg-rose-500",
    badge: "bg-rose-100 text-rose-900",
  };
}

export function FrontOfPackTrafficLights({
  product,
  fopPolicyData,
}: FrontOfPackTrafficLightsProps) {
  const thresholdMap: Partial<Record<FopNutrientCode, FopThreshold>> = Object.fromEntries(
    (fopPolicyData?.thresholds ?? []).map((row) => [
      row.nutrient_code,
      { lowCutoff: row.low_cutoff, mediumCutoff: row.medium_cutoff },
    ]),
  ) as Partial<Record<FopNutrientCode, FopThreshold>>;

  const messageMap: Record<string, string> = Object.fromEntries(
    (fopPolicyData?.messages ?? []).map((row) => [row.message_key, row.message_value]),
  );

  const tiles = evaluateFopTiles({
    per100gValues: toPer100gValuesFromRawNutrition(product),
    servingSizeMultiplier: toServingSizeMultiplier(product.servingSizeValue),
    policyVersion: fopPolicyData?.policyVersion,
    thresholdsByNutrient: thresholdMap,
    messageByKey: messageMap,
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
      <h3 className="mb-5 text-base font-semibold text-slate-900">Front-of-Pack Traffic Lights</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => {
          const classes = getLevelClasses(tile.color_tone);

          return (
            <article
              key={tile.nutrient_code}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
            >
              <div className="grid grid-cols-[6px_1fr] items-stretch gap-4">
                <div className={`w-1.5 rounded-full ${classes.accent}`} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {tile.display_name}
                  </p>
                  <p className="mt-2 text-3xl font-bold leading-none text-slate-900">
                    {tile.display_value}
                  </p>
                  <span
                    className={`mt-5 inline-flex rounded-full px-4 py-2 text-base font-semibold ${classes.badge}`}
                  >
                    {tile.status_label}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
