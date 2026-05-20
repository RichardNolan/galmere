import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '#/lib/require-auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => await requireAuth(),
  loader: async ({ context }) => {
    return { userId: context.userId }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { userId } = Route.useLoaderData()

  return <div>Welcome to your dashboard, {userId}.</div>
}
