import { Link, createFileRoute } from '@tanstack/react-router'

import { getMockBrandById } from '@/lib/mock-brand-data'

export const Route = createFileRoute('/brands/$brandid')({
  component: RouteComponent,
})

function RouteComponent() {
  const { brandid } = Route.useParams()
  const brand = getMockBrandById(brandid)

  if (!brand) {
    return (
      <section className="space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Brand detail</p>
          <h1 className="text-2xl font-semibold text-slate-900">Unknown brand</h1>
          <p className="text-sm text-slate-600">No mock brand exists for {brandid}.</p>
        </div>

        <Link
          to="/brands"
          className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to brands
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Brand detail</p>
        <h1 className="text-2xl font-semibold text-slate-900">{brand.name}</h1>
        <p className="text-sm text-slate-600">Products that belong to {brand.id}.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/brands"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to brands
        </Link>
        <Link
          to="/brands/$brandid/products"
          params={{ brandid }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View products
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600">
          <span>Product</span>
          <span>SKU</span>
          <span>Route</span>
        </div>
        <div className="divide-y divide-slate-200">
          {brand.products.map((product) => (
            <div key={product.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-4">
              <div>
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="mt-1 text-xs text-slate-500">{product.summary}</p>
              </div>
              <p className="text-sm text-slate-600">{product.sku}</p>
              <div className="flex flex-wrap justify-end gap-3">
                <Link
                  to="/brands/$brandid/products"
                  params={{ brandid }}
                  className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Products
                </Link>
                <Link
                  to="/brands/$brandid/products/$productid"
                  params={{ brandid, productid: product.id }}
                  className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View product
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
