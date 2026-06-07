import { ProductsTable } from "#/components/products/products-table";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/brands/$brandId/")({
  component: RouteComponent,
});

const brandRouteApi = getRouteApi("/brands");

function RouteComponent() {
  const { brands } = brandRouteApi.useLoaderData();
  const { brandId } = Route.useParams();

  const brand = useMemo(() => {
    return brands.find((b) => b.id?.toString() === brandId);
  }, [brands, brandId]);

  return (
    <div>
      <ProductsTable products={brand?.products ?? []} />
    </div>
  );
}
