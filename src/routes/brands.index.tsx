import { Link, createFileRoute } from '@tanstack/react-router'

import { mockBrands } from '@/lib/mock-brand-data'

const brandsIndexPath = '/brands/' as never

export const Route = createFileRoute(brandsIndexPath)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
        <p className="text-sm text-slate-600">Mock links for testing the brands route tree.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockBrands.map((brand) => (
          <article key={brand.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Brand ID</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{brand.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{brand.products.length} mock products available for this brand.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/brands/$brandid"
                params={{ brandid: brand.id }}
                className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View brand
              </Link>
              <Link
                to="/brands/$brandid/products"
                params={{ brandid: brand.id }}
                className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Products
              </Link>
              <Link
                to="/brands/$brandid/products/$productid"
                params={{ brandid: brand.id, productid: brand.products[0].id }}
                className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                First product
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
