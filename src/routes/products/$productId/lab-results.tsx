import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$productId/lab-results")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/products/$productId/lab-results"!</div>;
}
