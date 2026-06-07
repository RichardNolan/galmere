import { requireAuth } from "#/lib/require-auth";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/products1")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Outlet />
    </section>
  );
}
