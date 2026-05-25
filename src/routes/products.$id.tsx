import type { Product as ProductType } from "#/api/Products";
import { Brand } from "#/components/brand/brand";
import { CommentsPanel } from "#/components/comments";
import { FrontOfPackTrafficLights } from "#/components/front-of-pack-traffic-lights";
import { IngredientsPanel } from "#/components/ingredients-panel";
import { NutritionDeclarationPanel } from "#/components/nutrition-declaration-panel";
import { NutritionPanel } from "#/components/nutrition-panel";
import { Product } from "#/components/product";
import { requireAuth } from "#/lib/require-auth";
import { supabase } from "#/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";

type FlatIngredientRow = {
  top_raw_material_id: string;
  top_raw_material_code: string;
  top_raw_material_name: string;
  leaf_raw_material_id: string;
  leaf_raw_material_code: string;
  leaf_raw_material_name: string;
  path: string;
  depth: number;
  effective_percent: number;
  declared_inherited: boolean;
};

type FopThresholdRow = {
  nutrient_code: "fat" | "saturates" | "sugars" | "salt";
  low_cutoff: number;
  medium_cutoff: number;
};

type FopMessageRow = {
  message_key: string;
  message_value: string;
};

export const Route = createFileRoute("/products/$id")({
  beforeLoad: async () => await requireAuth(),
  loader: async ({ params: { id } }) => {
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
    ]);

    const fopPolicyData =
      thresholdError || messageError
        ? null
        : {
            policyVersion,
            thresholds: (thresholdRows ?? []) as FopThresholdRow[],
            messages: (messageRows ?? []) as FopMessageRow[],
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

    return { product: product ?? [], flatIngredients, fopPolicyData };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { product, flatIngredients, fopPolicyData } = Route.useLoaderData();
  return (
    <>
      <Brand brand={product.brand} />
      <Product key={product.id} product={product as ProductType} />
      <IngredientsPanel product={product as ProductType} flatIngredients={flatIngredients} />
      <NutritionDeclarationPanel product={product as ProductType} />
      <FrontOfPackTrafficLights product={product as ProductType} fopPolicyData={fopPolicyData} />
      <NutritionPanel product={product as ProductType} />
      <CommentsPanel type="product" id={product.id} />
    </>
  );
}
