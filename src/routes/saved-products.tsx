import { Product } from "#/components/product";
import { requireAuth } from "#/lib/require-auth";
import { supabase } from "@/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/saved-products")({
  beforeLoad: async () => await requireAuth(),
  loader: async () => {
    const { data: products } = await supabase.from("products").select();
    return { products };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { products } = Route.useLoaderData();

  return (
    <div>
      <ul>
        {products?.map((product) => (
          <Product key={product.id} name={product.name} id={product.id} />
        ))}
      </ul>
    </div>
  );
}
