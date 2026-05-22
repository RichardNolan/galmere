import type { TypeProduct } from "#/api/Common";
import { requireAuth } from "#/lib/require-auth";
import { supabase } from "@/lib/supabase";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/products/")({
  beforeLoad: async () => await requireAuth(),
  loader: async () => {
    const { data: brands, error } = await supabase.from("brands").select(`
      *,
      products:products(*)
    `);

    if (error) {
      throw new Error(`Failed to load products: ${error.message}`);
    }

    return { brands: brands ?? [] };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { brands } = Route.useLoaderData();

  return (
    <div>
      {brands.map((brand) => (
        <div key={brand.id}>
          <h2 className="text-xl font-semibold">{brand.brandName}</h2>
          <div className="ml-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {brand.products?.length ? (
              <ul className="space-y-2">
                {brand.products.map((product: TypeProduct) => (
                  <Link
                    to="/products/$id"
                    params={{
                      id: product.id,
                    }}
                    key={product.id}
                    className="block"
                  >
                    {product.productName}
                  </Link>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No products saved yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
