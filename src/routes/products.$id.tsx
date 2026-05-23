import type { Product as ProductType } from "#/api/Products";
import { CommentsPanel } from "#/components/comments";
import { Product } from "#/components/product";
import { requireAuth } from "#/lib/require-auth";
import { supabase } from "#/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$id")({
  beforeLoad: async () => await requireAuth(),
  loader: async ({ params: { id } }) => {
    const { data: product, error } = await supabase
      .from("products")
      .select(`
      *,
      brand:brand(*),
      nutrition:nutrition(*)
    `)
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to load products: ${error.message}`);
    }

    return { product: product ?? [] };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { product } = Route.useLoaderData();
  return (
    <>
      <Product key={product.id} product={product as ProductType} />
      <CommentsPanel type="product" id={product.id} />
    </>
  );
}
