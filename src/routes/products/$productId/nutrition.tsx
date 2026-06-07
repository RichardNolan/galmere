import type { Product as ProductType } from "#/api/Products";
import { NutritionDeclarationPanel } from "#/components/nutrition-declaration-panel";
import { NutritionPanel } from "#/components/nutrition-panel";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$productId/nutrition")({
  component: RouteComponent,
});

const productRouteApi = getRouteApi("/products/$productId");

function RouteComponent() {
  const { product } = productRouteApi.useLoaderData();

  return (
    <div>
      <NutritionPanel product={product as ProductType} />
      <NutritionDeclarationPanel product={product as ProductType} />
    </div>
  );
}
