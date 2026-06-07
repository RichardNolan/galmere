import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId/documents')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/products/$productId/documents"!</div>
}
