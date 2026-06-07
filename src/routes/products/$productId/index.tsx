import { CommentsPanel } from "#/components/comments";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$productId/")({
  component: RouteComponent,
});

const productRouteApi = getRouteApi("/products/$productId");

function RouteComponent() {
  const { product } = productRouteApi.useLoaderData();
  return (
    <div>
      Hello {`/${product.id}/`}!<p>{product.name}</p>
      <CommentsPanel type="product" id={product.id} />
    </div>
  );
}
