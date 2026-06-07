import { Brand } from "#/components/brand/brand";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/brands/")({
  component: RouteComponent,
});
const brandRouteApi = getRouteApi("/brands");

function RouteComponent() {
  const { brands } = brandRouteApi.useLoaderData();

  return (
    <section>
      {brands.map((brand) => (
        <Link to={`/brands/$brandId`} params={{ brandId: brand.id.toString() }} key={brand.id}>
          <Brand brand={brand} productCount={brand.products.length} />
        </Link>
      ))}
    </section>
  );
}
