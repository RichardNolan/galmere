import type { Product as ProductType } from "#/api/Products";
import { CheckCircle2, ChevronDown, CircleAlert, CircleCheck, Info, Leaf, Tag } from "lucide-react";

type DietaryStatus = "suitable" | "not_suitable" | "unknown";

type ClaimsReviewPanelProps = {
  product: ProductType;
  claimPolicyData?: {
    policyVersion: string;
    thresholds: Array<{
      rule_code: string;
      metric: string;
      operator: string;
      threshold_value: number;
      unit: string;
      scope: string;
    }>;
    messages: Array<{
      rule_code: string;
      title_pass: string | null;
      title_warn: string | null;
      title_fail: string | null;
      subtitle_template: string | null;
      failure_template: string | null;
      recommended_text: string | null;
    }>;
  } | null;
  dietarySuitability?: {
    vegetarian?: DietaryStatus;
    vegan?: DietaryStatus;
    glutenFree?: DietaryStatus;
  };
  fiveADaySnapshot?: {
    portionsPerServing?: number | null;
  };
};

type NutritionSourceField = "kcal" | "fat" | "sat" | "sugar" | "protein" | "salt" | "fibre";

type NutritionRecordLike = {
  source: string | null;
  rejected: boolean;
  kcal: unknown;
  fat: unknown;
  sat: unknown;
  sugar: unknown;
  protein: unknown;
  salt: unknown;
  fibre: unknown;
};

type ClaimStatus = "eligible" | "missed";

type ClaimResult = {
  ruleCode: string;
  title: string;
  subtitle: string;
  eligible: boolean;
  threshold: string;
  actual: string;
  failureReason: string;
  recommended: string;
  status: ClaimStatus;
};

type ClaimWarning = {
  code: string;
  message: string;
};

type ClaimThreshold = {
  metric: string;
  operator: ">=" | "<=" | ">" | "==";
  value: number;
  unit: string;
  scope: string;
};

type ClaimMessage = {
  titlePass: string;
  titleWarn: string;
  titleFail: string;
  subtitle: string;
  failure: string;
  recommendedText: string;
};

const DEFAULT_POLICY_VERSION = "v1";

const requiredThresholdRuleCodes = [
  "validation.serving_size.required",
  "validation.kcal.required",
  "protein.source",
  "protein.high",
  "fibre.source.serving",
  "fibre.source.energy",
  "fibre.high.serving",
  "fibre.high.energy",
  "fat.low",
  "sat.low",
  "sugar.low",
  "salt.low",
  "fiveaday.claim.minimum",
  "ui.warning.salt_high",
] as const;

const requiredMessageRuleCodes = [
  "protein.source",
  "protein.high",
  "fibre.source",
  "fibre.high",
  "fat.low",
  "sat.low",
  "sugar.low",
  "salt.low",
] as const;

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, places = 1): string {
  return value.toFixed(places).replace(/\.0$/, "");
}

function formatGrams(value: number): string {
  return `${formatNumber(value)}g`;
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

function getThresholdMap(
  rows: ClaimsReviewPanelProps["claimPolicyData"] extends { thresholds: infer T } ? T : never,
): Record<string, ClaimThreshold> {
  return Object.fromEntries(
    (rows ?? []).map((row) => [
      row.rule_code,
      {
        metric: row.metric,
        operator: row.operator as ClaimThreshold["operator"],
        value: Number(row.threshold_value),
        unit: row.unit,
        scope: row.scope,
      },
    ]),
  );
}

function getMessageMap(
  rows: ClaimsReviewPanelProps["claimPolicyData"] extends { messages: infer T } ? T : never,
): Record<string, ClaimMessage> {
  return Object.fromEntries(
    (rows ?? []).map((row) => [
      row.rule_code,
      {
        titlePass: row.title_pass ?? "",
        titleWarn: row.title_warn ?? "",
        titleFail: row.title_fail ?? "",
        subtitle: row.subtitle_template ?? "",
        failure: row.failure_template ?? "",
        recommendedText: row.recommended_text ?? "",
      },
    ]),
  );
}

function resolvePer100Values(product: ProductType): Record<NutritionSourceField, number> {
  const records = (product.nutrition ?? []) as NutritionRecordLike[];
  const override = records.find((record) => record.source === null) ?? null;

  if (override) {
    return {
      kcal: toFiniteNumber(override.kcal) ?? Number.NaN,
      fat: toFiniteNumber(override.fat) ?? Number.NaN,
      sat: toFiniteNumber(override.sat) ?? Number.NaN,
      sugar: toFiniteNumber(override.sugar) ?? Number.NaN,
      protein: toFiniteNumber(override.protein) ?? Number.NaN,
      salt: toFiniteNumber(override.salt) ?? Number.NaN,
      fibre: toFiniteNumber(override.fibre) ?? Number.NaN,
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
    kcal: averageField("kcal"),
    fat: averageField("fat"),
    sat: averageField("sat"),
    sugar: averageField("sugar"),
    protein: averageField("protein"),
    salt: averageField("salt"),
    fibre: averageField("fibre"),
  };
}

function evaluateClaims(params: {
  product: ProductType;
  thresholds: Record<string, ClaimThreshold>;
  messages: Record<string, ClaimMessage>;
  hasPolicyData: boolean;
  dietarySuitability?: ClaimsReviewPanelProps["dietarySuitability"];
  fiveADaySnapshot?: ClaimsReviewPanelProps["fiveADaySnapshot"];
}): {
  eligibleClaims: ClaimResult[];
  recommendedClaims: string[];
  missedClaims: ClaimResult[];
  warnings: ClaimWarning[];
  details: ClaimResult[];
} {
  const { product, thresholds, messages, hasPolicyData, dietarySuitability, fiveADaySnapshot } =
    params;
  const per100 = resolvePer100Values(product);
  const servingSize = toFiniteNumber(product.servingSizeValue);
  const servingMultiplier = servingSize && servingSize > 0 ? servingSize / 100 : null;

  const warnings: ClaimWarning[] = [];

  if (!hasPolicyData) {
    warnings.push({
      code: "policy.claims.unavailable",
      message: "Claim policy data was not loaded from Supabase.",
    });

    return {
      eligibleClaims: [],
      recommendedClaims: [],
      missedClaims: [],
      warnings,
      details: [],
    };
  }

  const missingThresholdRules = requiredThresholdRuleCodes.filter(
    (ruleCode) => !thresholds[ruleCode],
  );
  const missingMessageRules = requiredMessageRuleCodes.filter((ruleCode) => !messages[ruleCode]);

  if (missingThresholdRules.length) {
    warnings.push({
      code: "policy.claims.thresholds_missing",
      message: `Missing claim threshold rows in Supabase: ${missingThresholdRules.join(", ")}`,
    });
  }

  if (missingMessageRules.length) {
    warnings.push({
      code: "policy.claims.messages_missing",
      message: `Missing claim message rows in Supabase: ${missingMessageRules.join(", ")}`,
    });
  }

  if (missingThresholdRules.length || missingMessageRules.length) {
    return {
      eligibleClaims: [],
      recommendedClaims: [],
      missedClaims: [],
      warnings,
      details: [],
    };
  }

  if (!servingMultiplier) {
    warnings.push({
      code: "validation.serving_size.required",
      message: "Enter a serving size greater than 0g to evaluate claims.",
    });
  }

  if (!Number.isFinite(per100.kcal) || per100.kcal <= 0) {
    warnings.push({
      code: "validation.kcal.required",
      message: "Kcal per 100g must be greater than 0 to evaluate protein and fibre energy rules.",
    });
  }

  if (!servingMultiplier) {
    return {
      eligibleClaims: [],
      recommendedClaims: [],
      missedClaims: [],
      warnings,
      details: [],
    };
  }

  const perServing = {
    kcal: per100.kcal * servingMultiplier,
    fat: per100.fat * servingMultiplier,
    sat: per100.sat * servingMultiplier,
    sugar: per100.sugar * servingMultiplier,
    protein: per100.protein * servingMultiplier,
    salt: per100.salt * servingMultiplier,
    fibre: per100.fibre * servingMultiplier,
  };

  const proteinEnergyPercent =
    perServing.kcal > 0 ? ((perServing.protein * 4) / perServing.kcal) * 100 : Number.NaN;
  const fibrePer100Kcal = per100.kcal > 0 ? (per100.fibre / per100.kcal) * 100 : Number.NaN;

  const details: ClaimResult[] = [];

  function addClaim(result: ClaimResult) {
    details.push(result);
  }

  function buildStandardClaim(paramsClaim: {
    ruleCode: string;
    titleFallback: string;
    actualValue: number;
    actualText: string;
    comparator: (actual: number, threshold: number) => boolean;
  }): ClaimResult {
    const { ruleCode, titleFallback, actualValue, actualText, comparator } = paramsClaim;
    const thresholdRule = thresholds[ruleCode];
    const message = messages[ruleCode];
    const eligible = comparator(actualValue, thresholdRule.value);

    return {
      ruleCode,
      title: eligible ? message.titlePass || titleFallback : message.titleFail || titleFallback,
      subtitle:
        message.subtitle ||
        `${titleFallback} (${thresholdRule.operator} ${thresholdRule.value}${thresholdRule.unit})`,
      eligible,
      threshold: `${thresholdRule.operator} ${thresholdRule.value}${thresholdRule.unit}`,
      actual: actualText,
      failureReason: eligible ? "" : message.failure || "Threshold not met.",
      recommended: eligible ? message.recommendedText || titleFallback.toUpperCase() : "",
      status: eligible ? "eligible" : "missed",
    };
  }

  addClaim(
    buildStandardClaim({
      ruleCode: "protein.source",
      titleFallback: "Source of protein",
      actualValue: proteinEnergyPercent,
      actualText: formatPercent(proteinEnergyPercent),
      comparator: (actual, threshold) => actual >= threshold,
    }),
  );

  addClaim(
    buildStandardClaim({
      ruleCode: "protein.high",
      titleFallback: "High protein",
      actualValue: proteinEnergyPercent,
      actualText: formatPercent(proteinEnergyPercent),
      comparator: (actual, threshold) => actual >= threshold,
    }),
  );

  const fibreSourceRuleA = thresholds["fibre.source.serving"];
  const fibreSourceRuleB = thresholds["fibre.source.energy"];
  const fibreSourceEligible =
    perServing.fibre >= fibreSourceRuleA.value || fibrePer100Kcal >= fibreSourceRuleB.value;
  const fibreSourceMsg = messages["fibre.source"];
  addClaim({
    ruleCode: "fibre.source",
    title: fibreSourceEligible
      ? fibreSourceMsg?.titlePass || "Source of fibre"
      : fibreSourceMsg?.titleFail || "Source of fibre",
    subtitle:
      fibreSourceMsg.subtitle ||
      `At least ${fibreSourceRuleA.value}g per serving or ${fibreSourceRuleB.value}g per 100kcal.`,
    eligible: fibreSourceEligible,
    threshold: `${fibreSourceRuleA.value}g per serving OR ${fibreSourceRuleB.value}g per 100kcal`,
    actual: `${formatGrams(perServing.fibre)} and ${formatNumber(fibrePer100Kcal)}g per 100kcal`,
    failureReason: fibreSourceEligible
      ? ""
      : fibreSourceMsg.failure || "Fibre source threshold not met.",
    recommended: fibreSourceEligible ? fibreSourceMsg.recommendedText || "SOURCE OF FIBRE" : "",
    status: fibreSourceEligible ? "eligible" : "missed",
  });

  const fibreHighRuleA = thresholds["fibre.high.serving"];
  const fibreHighRuleB = thresholds["fibre.high.energy"];
  const fibreHighEligible =
    perServing.fibre >= fibreHighRuleA.value || fibrePer100Kcal >= fibreHighRuleB.value;
  const fibreHighMsg = messages["fibre.high"];
  addClaim({
    ruleCode: "fibre.high",
    title: fibreHighEligible
      ? fibreHighMsg?.titlePass || "High fibre"
      : fibreHighMsg?.titleFail || "High fibre",
    subtitle:
      fibreHighMsg.subtitle ||
      `At least ${fibreHighRuleA.value}g per serving or ${fibreHighRuleB.value}g per 100kcal.`,
    eligible: fibreHighEligible,
    threshold: `${fibreHighRuleA.value}g per serving OR ${fibreHighRuleB.value}g per 100kcal`,
    actual: `${formatGrams(perServing.fibre)} and ${formatNumber(fibrePer100Kcal)}g per 100kcal`,
    failureReason: fibreHighEligible ? "" : fibreHighMsg.failure || "High fibre threshold not met.",
    recommended: fibreHighEligible ? fibreHighMsg.recommendedText || "HIGH FIBRE" : "",
    status: fibreHighEligible ? "eligible" : "missed",
  });

  addClaim(
    buildStandardClaim({
      ruleCode: "fat.low",
      titleFallback: "Low fat",
      actualValue: perServing.fat,
      actualText: formatGrams(perServing.fat),
      comparator: (actual, threshold) => actual <= threshold,
    }),
  );

  addClaim(
    buildStandardClaim({
      ruleCode: "sat.low",
      titleFallback: "Low saturated fat",
      actualValue: perServing.sat,
      actualText: formatGrams(perServing.sat),
      comparator: (actual, threshold) => actual <= threshold,
    }),
  );

  addClaim(
    buildStandardClaim({
      ruleCode: "sugar.low",
      titleFallback: "Low sugar",
      actualValue: perServing.sugar,
      actualText: formatGrams(perServing.sugar),
      comparator: (actual, threshold) => actual <= threshold,
    }),
  );

  addClaim(
    buildStandardClaim({
      ruleCode: "salt.low",
      titleFallback: "Low salt",
      actualValue: perServing.salt,
      actualText: formatGrams(perServing.salt),
      comparator: (actual, threshold) => actual <= threshold,
    }),
  );

  if ((dietarySuitability?.vegetarian ?? "unknown") === "suitable") {
    addClaim({
      ruleCode: "dietary.vegetarian",
      title: "Vegetarian",
      subtitle: "Dietary suitability snapshot indicates vegetarian suitable.",
      eligible: true,
      threshold: "suitable",
      actual: "suitable",
      failureReason: "",
      recommended: "SUITABLE FOR VEGETARIANS",
      status: "eligible",
    });
  }

  if ((dietarySuitability?.vegan ?? "unknown") === "suitable") {
    addClaim({
      ruleCode: "dietary.vegan",
      title: "Vegan",
      subtitle: "Dietary suitability snapshot indicates vegan suitable.",
      eligible: true,
      threshold: "suitable",
      actual: "suitable",
      failureReason: "",
      recommended: "SUITABLE FOR VEGANS",
      status: "eligible",
    });
  }

  if ((dietarySuitability?.glutenFree ?? "unknown") === "suitable") {
    addClaim({
      ruleCode: "dietary.gluten_free",
      title: "Gluten free",
      subtitle: "Dietary suitability snapshot indicates gluten free suitable.",
      eligible: true,
      threshold: "suitable",
      actual: "suitable",
      failureReason: "",
      recommended: "GLUTEN FREE",
      status: "eligible",
    });
  }

  const portionsPerServing = fiveADaySnapshot?.portionsPerServing;
  const fiveADayThreshold = thresholds["fiveaday.claim.minimum"].value;
  if (Number.isFinite(portionsPerServing) && (portionsPerServing ?? 0) >= fiveADayThreshold) {
    const rounded = Math.max(1, Math.round(portionsPerServing ?? 0));
    addClaim({
      ruleCode: "fiveaday.claim.minimum",
      title: `${rounded} of your 5-a-day`,
      subtitle: "Portion contribution is at least 1 portion per serving.",
      eligible: true,
      threshold: `>= ${fiveADayThreshold} portion`,
      actual: `${formatNumber(portionsPerServing ?? 0)} portions`,
      failureReason: "",
      recommended: `${rounded} OF YOUR 5-A-DAY`,
      status: "eligible",
    });
  }

  const warningSaltThreshold = thresholds["ui.warning.salt_high"].value;
  if (perServing.salt > warningSaltThreshold) {
    warnings.push({
      code: "ui.warning.salt_high",
      message: `Salt is ${formatGrams(perServing.salt)} per serving, above warning threshold ${formatGrams(
        warningSaltThreshold,
      )}.`,
    });
  }

  if ((dietarySuitability?.vegetarian ?? "unknown") === "unknown") {
    warnings.push({
      code: "dietary.vegetarian.snapshot_missing",
      message: "Vegetarian suitability snapshot is not connected yet.",
    });
  }
  if ((dietarySuitability?.vegan ?? "unknown") === "unknown") {
    warnings.push({
      code: "dietary.vegan.snapshot_missing",
      message: "Vegan suitability snapshot is not connected yet.",
    });
  }
  if ((dietarySuitability?.glutenFree ?? "unknown") === "unknown") {
    warnings.push({
      code: "dietary.gluten_free.snapshot_missing",
      message: "Gluten free suitability snapshot is not connected yet.",
    });
  }

  if (!Number.isFinite(fiveADaySnapshot?.portionsPerServing)) {
    warnings.push({
      code: "fiveaday.snapshot_missing",
      message: "5-a-day snapshot is not connected yet.",
    });
  }

  const eligibleClaims = details.filter((item) => item.eligible);
  const missedClaims = details.filter((item) => !item.eligible);
  const recommendedClaims = eligibleClaims.map((item) => item.recommended).filter(Boolean);

  return {
    eligibleClaims,
    recommendedClaims,
    missedClaims,
    warnings,
    details,
  };
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "slate" | "amber";
}) {
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-100 text-amber-800"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function ClaimsReviewPanel({
  product,
  claimPolicyData,
  dietarySuitability,
  fiveADaySnapshot,
}: ClaimsReviewPanelProps) {
  const thresholds = getThresholdMap(claimPolicyData?.thresholds);
  const messages = getMessageMap(claimPolicyData?.messages);
  const evaluation = evaluateClaims({
    product,
    thresholds,
    messages,
    hasPolicyData: Boolean(claimPolicyData),
    dietarySuitability,
    fiveADaySnapshot,
  });

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <h3 className="text-4xl font-semibold text-slate-900">Claims Review</h3>
            <p className="text-sm text-slate-600">
              Policy {claimPolicyData?.policyVersion ?? DEFAULT_POLICY_VERSION}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                <CircleCheck className="size-5" />
              </span>
              <div>
                <h4 className="text-2xl font-semibold text-slate-900">Eligible Claims</h4>
                <p className="text-sm text-slate-600">
                  Claims eligible from current product profile.
                </p>
              </div>
            </div>
            <Pill tone="green">{evaluation.eligibleClaims.length} approved</Pill>
          </header>

          <ul className="divide-y divide-slate-200">
            {evaluation.eligibleClaims.length ? (
              evaluation.eligibleClaims.map((claim) => (
                <li
                  key={claim.ruleCode}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <p className="text-xl font-semibold text-slate-900">{claim.title}</p>
                  <Pill tone="green">Eligible</Pill>
                </li>
              ))
            ) : (
              <li className="px-5 py-6 text-sm text-slate-500">
                No eligible claims yet for current inputs.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700">
                <Tag className="size-5" />
              </span>
              <div>
                <h4 className="text-2xl font-semibold text-slate-900">
                  Recommended On-Pack Claims
                </h4>
                <p className="text-sm text-slate-600">
                  Recommended claim wording you can use on pack.
                </p>
              </div>
            </div>
            <Pill tone="slate">{evaluation.recommendedClaims.length} recommended</Pill>
          </header>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evaluation.recommendedClaims.length ? (
              evaluation.recommendedClaims.map((claim) => (
                <div
                  key={claim}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold tracking-[0.16em] text-cyan-900"
                >
                  {claim}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recommended wording generated yet.</p>
            )}
          </div>
        </article>
      </div>

      <details className="rounded-3xl border border-slate-200 bg-white" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div>
            <h4 className="text-3xl font-semibold text-slate-900">View missed claims</h4>
            <p className="text-sm text-slate-600">Claims that are not met and why.</p>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="slate">{evaluation.missedClaims.length} issues</Pill>
            <ChevronDown className="size-5 text-slate-500" />
          </div>
        </summary>
        <div className="border-t border-slate-200 px-5 py-4">
          {evaluation.missedClaims.length ? (
            <ul className="space-y-3">
              {evaluation.missedClaims.map((claim) => (
                <li
                  key={claim.ruleCode}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xl font-semibold text-slate-900">{claim.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{claim.failureReason}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Threshold: {claim.threshold} | Actual: {claim.actual}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No missed claims.</p>
          )}
        </div>
      </details>

      <details className="rounded-3xl border border-slate-200 bg-white" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div>
            <h4 className="text-3xl font-semibold text-slate-900">View warnings</h4>
            <p className="text-sm text-slate-600">
              Data issues or cautionary thresholds requiring attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="amber">
              {evaluation.warnings.length} warning{evaluation.warnings.length === 1 ? "" : "s"}
            </Pill>
            <ChevronDown className="size-5 text-slate-500" />
          </div>
        </summary>
        <div className="border-t border-slate-200 px-5 py-4">
          {evaluation.warnings.length ? (
            <ul className="space-y-3">
              {evaluation.warnings.map((warning) => (
                <li
                  key={warning.code}
                  className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <CircleAlert className="mt-0.5 size-4 text-amber-700" />
                  <p className="text-sm text-amber-900">{warning.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No warnings.</p>
          )}
        </div>
      </details>

      <details className="rounded-3xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div>
            <h4 className="text-2xl font-semibold text-slate-900">View claim details</h4>
            <p className="text-sm text-slate-600">
              Threshold and actual values for each evaluated rule.
            </p>
          </div>
          <ChevronDown className="size-5 text-slate-500" />
        </summary>
        <div className="border-t border-slate-200 px-5 py-4">
          {evaluation.details.length ? (
            <ul className="space-y-3">
              {evaluation.details.map((detail) => (
                <li
                  key={detail.ruleCode}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl font-semibold text-slate-900">{detail.title}</p>
                    <Pill tone={detail.eligible ? "green" : "slate"}>
                      {detail.eligible ? "Eligible" : "Not met"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{detail.subtitle}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Threshold: {detail.threshold} | Actual: {detail.actual}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No detail rows yet.</p>
          )}
        </div>
      </details>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Info className="size-4" />
          Claims are assessed per serving unless stated otherwise.
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Leaf className="size-4" />
          Dietary and 5-a-day claims depend on connected upstream snapshots.
        </p>
      </footer>
    </section>
  );
}
