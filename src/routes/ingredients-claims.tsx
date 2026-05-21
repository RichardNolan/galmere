import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ingredients-claims")({
  beforeLoad: async () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/ingredients-claims"!</div>;
}
