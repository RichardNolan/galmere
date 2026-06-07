import type { TypeProduct } from "#/api/Common";
import { Button } from "#/components/ui/button";
import { Link } from "@tanstack/react-router";

export const ProductsTable = ({ products }: { products: TypeProduct[] }) => {
  return (
    <div className="px-2 py-1 sm:px-4">
      {products?.length ? (
        <ul className="divide-y divide-slate-200">
          {products.map((product) => (
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
                  <span className="text-slate-500">Serving Size:</span> {product.servingSizeValue}{" "}
                  {product.servingSizeUnit}
                </p>

                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="h-8 w-full rounded-full px-5 font-semibold text-cyan-900 sm:w-auto"
                >
                  <Link
                    to="/products1/$id"
                    params={{
                      id: product.id,
                    }}
                  >
                    Open1
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="h-8 w-full rounded-full px-5 font-semibold text-cyan-900 sm:w-auto"
                >
                  <Link
                    to="/products/$productId"
                    params={{
                      productId: product.id,
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
  );
};
