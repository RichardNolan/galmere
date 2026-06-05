import { Link, createFileRoute } from '@tanstack/react-router'

import { getMockBrandById, getMockProductByIds } from '@/lib/mock-brand-data'

export const Route = createFileRoute('/brands/$brandid/products/$productid')({
  component: RouteComponent,
})

function RouteComponent() {
  const { brandid, productid } = Route.useParams()
  const brand = getMockBrandById(brandid)
  const product = getMockProductByIds(brandid, productid)

  if (!brand || !product) {
    return (
      <section className="space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Product detail</p>
          <h1 className="text-2xl font-semibold text-slate-900">Unknown product</h1>
          <p className="text-sm text-slate-600">No mock product exists for this brand and product id combination.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/brands"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Brands home
          </Link>
          {brand ? (
            <Link
              to="/brands/$brandid"
              params={{ brandid }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Brand overview
            </Link>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Product detail</p>
        <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
        <p className="text-sm text-slate-600">Product detail for {brand.name}.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Brand</dt>
            <dd className="font-medium text-slate-900">{brand.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Product</dt>
            <dd className="font-medium text-slate-900">{product.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">SKU</dt>
            <dd className="font-medium text-slate-900">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Summary</dt>
            <dd className="font-medium text-slate-900">{product.summary}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/brands"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Brands home
        </Link>
        <Link
          to="/brands/$brandid"
          params={{ brandid }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Brand overview
        </Link>
        <Link
          to="/brands/$brandid/products"
          params={{ brandid }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Brand products
        </Link>
      </div>
    </section>
  )
}
