import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/products/$productId/additives',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/brands/$brandId/products/$productId/additives"!</div>
}
