import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/brands')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}