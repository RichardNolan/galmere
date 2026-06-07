import type { Product as ProductType } from "#/api/Products";
import { Brand } from "#/components/brand/brand";
import { ClaimsReviewPanel } from "#/components/claims-review-panel";
import { CommentsPanel } from "#/components/comments";
import { FrontOfPackTrafficLights } from "#/components/front-of-pack-traffic-lights";
import { IngredientsPanel } from "#/components/ingredients-panel";
import { NutritionDeclarationPanel } from "#/components/nutrition-declaration-panel";
import { NutritionPanel } from "#/components/nutrition-panel";
import { Product } from "#/components/product";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import type {
  ClaimMessageRow,
  ClaimThresholdRow,
  DietaryStatus,
  DietarySuitabilitySnapshot,
  FiveADaySnapshot,
  FlatIngredientRow,
  FopMessageRow,
  FopThresholdRow,
} from "#/lib/types/product";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

function toDietaryStatus(value: unknown): DietaryStatus {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "suitable") {
    return "suitable";
  }

  if (
    normalized === "not_suitable" ||
    normalized === "not-suitable" ||
    normalized === "unsuitable"
  ) {
    return "not_suitable";
  }

  return "unknown";
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const fetchProductDetailData = createServerFn({ method: "GET" }).handler(async (ctx: unknown) => {
  const id = (ctx as { data?: { id?: string } })?.data?.id;

  if (!id) {
    throw new Error("Missing product id for products detail loader");
  }

  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      brand:brand(*),
      nutrition:nutrition(*),
      product_recipes:product_recipes(
        *,
        product_ingredients:product_ingredients(
          *,
          raw_material:raw_materials(*)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const policyVersion = "v1";

  const [
    { data: thresholdRows, error: thresholdError },
    { data: messageRows, error: messageError },
    { data: claimThresholdRows, error: claimThresholdError },
    { data: claimMessageRows, error: claimMessageError },
  ] = await Promise.all([
    supabase
      .from("fop_nutrient_thresholds")
      .select("nutrient_code, low_cutoff, medium_cutoff")
      .eq("policy_version", policyVersion)
      .eq("is_active", true),
    supabase
      .from("fop_display_messages")
      .select("message_key, message_value")
      .eq("policy_version", policyVersion)
      .eq("locale", "en-GB"),
    supabase
      .from("claim_rule_thresholds")
      .select("rule_code, metric, operator, threshold_value, unit, scope")
      .eq("policy_version", policyVersion)
      .eq("is_active", true),
    supabase
      .from("claim_rule_messages")
      .select(
        "rule_code, title_pass, title_warn, title_fail, subtitle_template, failure_template, recommended_text",
      )
      .eq("policy_version", policyVersion),
  ]);

  const fopPolicyData =
    thresholdError || messageError
      ? null
      : {
          policyVersion,
          thresholds: (thresholdRows ?? []) as FopThresholdRow[],
          messages: (messageRows ?? []) as FopMessageRow[],
        };

  const claimPolicyData =
    claimThresholdError || claimMessageError
      ? null
      : {
          policyVersion,
          thresholds: (claimThresholdRows ?? []) as ClaimThresholdRow[],
          messages: (claimMessageRows ?? []) as ClaimMessageRow[],
        };

  const [
    { data: dietaryStatusesRow },
    { data: dietarySnapshotRow },
    { data: fiveADayRow },
    { data: fiveADaysRow },
  ] = await Promise.all([
    supabase
      .from("dietary_suitability_statuses")
      .select("vegetarian, vegan, gluten_free")
      .eq("product_id", id)
      .maybeSingle(),
    supabase
      .from("dietary_suitability_snapshots")
      .select("vegetarian_status, vegan_status, gluten_free_status")
      .eq("product_id", id)
      .maybeSingle(),
    supabase
      .from("fiveaday_snapshot")
      .select("portions_per_serving")
      .eq("product_id", id)
      .maybeSingle(),
    supabase
      .from("fiveaday_snapshots")
      .select("portions_per_serving")
      .eq("product_id", id)
      .maybeSingle(),
  ]);

  const productRecord = product as Record<string, unknown>;

  const dietarySuitability: DietarySuitabilitySnapshot = {
    vegetarian: toDietaryStatus(
      dietaryStatusesRow?.vegetarian ??
        dietarySnapshotRow?.vegetarian_status ??
        productRecord.vegetarian_status ??
        productRecord.vegetarian,
    ),
    vegan: toDietaryStatus(
      dietaryStatusesRow?.vegan ??
        dietarySnapshotRow?.vegan_status ??
        productRecord.vegan_status ??
        productRecord.vegan,
    ),
    glutenFree: toDietaryStatus(
      dietaryStatusesRow?.gluten_free ??
        dietarySnapshotRow?.gluten_free_status ??
        productRecord.gluten_free_status ??
        productRecord.gluten_free ??
        productRecord.glutenFree,
    ),
  };

  const fiveADaySnapshot: FiveADaySnapshot = {
    portionsPerServing:
      toFiniteNumber(
        fiveADayRow?.portions_per_serving ??
          fiveADaysRow?.portions_per_serving ??
          productRecord.portions_per_serving ??
          productRecord.fiveaday_portions_per_serving,
      ) ?? null,
  };

  const recipes = product?.product_recipes ?? [];
  const currentRecipe =
    recipes.find((recipe: { is_current: boolean }) => recipe.is_current) ?? recipes[0] ?? null;

  let flatIngredients: FlatIngredientRow[] = [];

  if (currentRecipe?.id) {
    const { data: flatData, error: flatError } = await supabase.rpc(
      "get_flat_product_ingredients",
      {
        p_product_recipe_id: currentRecipe.id,
      },
    );

    if (!flatError) {
      flatIngredients = (flatData ?? []) as FlatIngredientRow[];
    }
  }

  return {
    product: product ?? [],
    flatIngredients,
    fopPolicyData,
    claimPolicyData,
    dietarySuitability,
    fiveADaySnapshot,
  };
});

export const Route = createFileRoute("/products1/$id")({
  beforeLoad: async () => await requireAuth(),
  loader: async ({ params: { id } }) => fetchProductDetailData({ data: { id } }),
  component: RouteComponent,
});

function RouteComponent() {
  const {
    product,
    flatIngredients,
    fopPolicyData,
    claimPolicyData,
    dietarySuitability,
    fiveADaySnapshot,
  } = Route.useLoaderData();
  return (
    <>
      <Brand brand={product.brand} />
      <Product key={product.id} product={product as ProductType} />
      <IngredientsPanel product={product as ProductType} flatIngredients={flatIngredients} />
      <NutritionDeclarationPanel product={product as ProductType} />
      <FrontOfPackTrafficLights product={product as ProductType} fopPolicyData={fopPolicyData} />
      <ClaimsReviewPanel
        product={product as ProductType}
        claimPolicyData={claimPolicyData}
        dietarySuitability={dietarySuitability}
        fiveADaySnapshot={fiveADaySnapshot}
      />
      <NutritionPanel product={product as ProductType} />
      <CommentsPanel type="product" id={product.id} />
    </>
  );
}
