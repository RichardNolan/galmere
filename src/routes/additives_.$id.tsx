import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/additives_/$id")({
  loader: async ({ params }) => {
    const response = await fetch(
      `https://api.datalake.sante.service.ec.europa.eu/feed-additives/feed-additives-details?policy_item_id=${params.id}&format=json&api-version=v2.0`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch additive detail: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = Route.useLoaderData();

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Additive Detail</p>
        <h1 className="mt-2 font-[Fraunces] text-3xl font-semibold text-slate-900 sm:text-4xl">
          Additive Record Snapshot
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Raw API payload for this additive is shown below. A richer detail view can be layered onto this structure.
        </p>
      </header>

      <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-5 text-xs leading-relaxed text-emerald-100 shadow-lg shadow-slate-800/20 sm:text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}
