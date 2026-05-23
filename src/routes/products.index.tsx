import type { TypeProduct } from "#/api/Common";
import { Button } from "#/components/ui/button";
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
    <div className="mx-auto max-w-6xl space-y-4">
      {brands.map((brand) => (
        <section
          key={brand.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <header className="border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {brand.brandName}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {brand.products?.length ?? 0} saved products
            </p>
          </header>

          <div className="px-2 py-1 sm:px-4">
            {brand.products?.length ? (
              <ul className="divide-y divide-slate-200">
                {brand.products.map((product: TypeProduct) => (
                  <li key={product.id} className="px-3 py-3 sm:px-2 sm:py-4">
                    <div className="grid items-center gap-2 text-sm text-slate-600 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_auto] sm:gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-900">
                          {product.productName}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          Saved: {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <p className="truncate">
                        <span className="text-slate-500">Code:</span> {product.versionNumber || "-"}
                      </p>

                      <p className="truncate">
                        <span className="text-slate-500">Serving Size:</span>{" "}
                        {product.servingSizeValue} {product.servingSizeUnit}
                      </p>

                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-8 w-full rounded-full px-5 font-semibold text-cyan-900 sm:w-auto"
                      >
                        <Link
                          to="/products/$id"
                          params={{
                            id: product.id,
                          }}
                        >
                          Open
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="my-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No products saved yet.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
