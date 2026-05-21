import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getFoodAdditive = createServerFn({ method: "GET" })
  // .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    console.log({ data });

    const response = await fetch(
      `https://api.datalake.sante.service.ec.europa.eu/feed-additives/feed-additives-details?policy_item_id=${data.id}&format=json&api-version=v2.0`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch additives: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  });

export const Route = createFileRoute("/additives_/$id")({
  loader: async ({ params }) => {
    const data = await getFoodAdditive({ data: { id: params.id } });
    return { data };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = Route.useLoaderData();
  return (
    <div>
      Hello "/additives/id"!
      {JSON.stringify(data)}
    </div>
  );
}
