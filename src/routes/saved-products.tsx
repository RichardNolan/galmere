import { Product } from "#/components/product";
import { requireAuth } from "#/lib/require-auth";
import { supabase } from "@/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

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
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          <Package className="size-3.5" />
          Product Library
        </div>
        <h1 className="mt-3 font-[Fraunces] text-3xl font-semibold text-slate-900 sm:text-4xl">
          Saved Products
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Edit existing products and keep naming aligned across teams.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {products?.length ? (
          <ul className="space-y-2">
            {products.map((product) => (
              <Product key={product.id} name={product.name} id={product.id} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            No products saved yet.
          </p>
        )}
      </div>
    </section>
  );
}
