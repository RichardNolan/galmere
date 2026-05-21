import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/packaging")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/packaging"!</div>;
}
