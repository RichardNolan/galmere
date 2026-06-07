import { ProductsTable } from "#/components/products/products-table";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const fetchProductsIndexData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await createServerSupabaseClient();

  const { data: brands, error } = await supabase.from("brands").select(`
      *,
      products:products(*)
    `);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return { brands: brands ?? [] };
});

export const Route = createFileRoute("/products1/")({
  beforeLoad: async () => await requireAuth(),
  loader: async () => fetchProductsIndexData(),
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
          <ProductsTable products={brand.products} />
        </section>
      ))}
    </div>
  );
}
