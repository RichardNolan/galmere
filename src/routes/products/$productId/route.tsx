import { ProductSidebar } from "#/components/products/products-sidebar";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const fetchProduct = createServerFn({ method: "GET" })
  // TODO: use zod for validations
  .inputValidator((data: { productId: string }) => data)
  .handler(async ({ data }) => {
    const id = data.productId;
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

    return { product };
  });

export const Route = createFileRoute("/products/$productId")({
  beforeLoad: async () => await requireAuth(),
  component: ProductLayout,
  loader: async ({ params }) => fetchProduct({ data: params }),
});

function ProductLayout() {
  const { product } = Route.useLoaderData();
  const x = Route.fullPath;
  return (
    <div className="flex flex-row flex-nowrap">
      <div className="w-1/4">
        <ProductSidebar product={product} />
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
