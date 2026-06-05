import { Link, createFileRoute } from '@tanstack/react-router'

import { getMockBrandById } from '@/lib/mock-brand-data'

export const Route = createFileRoute('/brands/$brandid/products')({
  component: RouteComponent,
})

function RouteComponent() {
  const { brandid } = Route.useParams()
  const brand = getMockBrandById(brandid)

  if (!brand) {
    return (
      <section className="space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Brand products</p>
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
        <p className="text-sm text-slate-500">Brand products</p>
        <h1 className="text-2xl font-semibold text-slate-900">{brand.name}</h1>
        <p className="text-sm text-slate-600">All mock products under {brand.id}.</p>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brand.products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Product ID</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{product.summary}</p>
            <p className="mt-2 text-xs text-slate-500">{product.sku}</p>
            <Link
              to="/brands/$brandid/products/$productid"
              params={{ brandid, productid: product.id }}
              className="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View product
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
