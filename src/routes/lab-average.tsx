import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lab-average")({
  beforeLoad: async () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/lab-average"!</div>;
}
