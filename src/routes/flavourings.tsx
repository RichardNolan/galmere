import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

type AdditiveRecord = {
  food_flavouring_name?: string;
  policy_item_code?: string;
  policy_item_id: string | number;
};

type AdditivesResponse = {
  value?: AdditiveRecord[];
};

const getFoodAdditives = createServerFn().handler(async () => {
  const response = await fetch(
    "https://api.datalake.sante.service.ec.europa.eu/food-flavourings/food-flavouring-list?format=json&api-version=v2.0",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch flavourings: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as AdditivesResponse;
});

export const Route = createFileRoute("/flavourings")({
  loader: async () => {
    const flavourings = await getFoodAdditives();
    return { flavourings };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { flavourings } = Route.useLoaderData();
  const items = flavourings.value ?? [];
  const [query, setQuery] = useState("");
  const [codeStartsWith, setCodeStartsWith] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "code" | "id">("name");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCodePrefix = codeStartsWith.trim().toLowerCase().replaceAll(" ", "");

    const filtered = items.filter((item) => {
      const name = item.food_flavouring_name ?? "";
      const code = (item.policy_item_code ?? "").replaceAll(" ", "");
      const id = String(item.policy_item_id ?? "");

      const matchesQuery =
        normalizedQuery.length === 0 ||
        name.toLowerCase().includes(normalizedQuery) ||
        code.toLowerCase().includes(normalizedQuery) ||
        id.toLowerCase().includes(normalizedQuery);

      const matchesCodePrefix =
        normalizedCodePrefix.length === 0 || code.toLowerCase().startsWith(normalizedCodePrefix);

      return matchesQuery && matchesCodePrefix;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "code") {
        return (a.policy_item_code ?? "").localeCompare(b.policy_item_code ?? "", undefined, {
          numeric: true,
        });
      }

      if (sortBy === "id") {
        return Number(a.policy_item_id) - Number(b.policy_item_id);
      }

      return (a.food_flavouring_name ?? "").localeCompare(b.food_flavouring_name ?? "");
    });

    return sorted;
  }, [codeStartsWith, items, query, sortBy]);

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#fef3c7_0%,#fff7ed_35%,#ffffff_75%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(251,146,60,0.12),rgba(16,185,129,0.08)_50%,rgba(6,182,212,0.08))]" />

      <div className="relative mx-auto max-w-7xl space-y-7">
        <header className="rounded-2xl border border-orange-200/70 bg-white/90 p-6 shadow-[0_22px_70px_-35px_rgba(194,65,12,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
            EU Data Lake
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-zinc-900 sm:text-4xl">
            Food Flavourings Explorer
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-700 sm:text-base">
            Browse and inspect food flavourings in a focused catalog view. Search by name, code, or
            policy item id.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-xl shadow-zinc-200/70 backdrop-blur sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="xl:col-span-2 md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: Allyl octanoate, POL-FFL-IMPORT"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Code starts with
              </span>
              <input
                value={codeStartsWith}
                onChange={(event) => setCodeStartsWith(event.target.value)}
                placeholder="POL-FFL"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "name" | "code" | "id")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                <option value="name">Name (A-Z)</option>
                <option value="code">Policy code</option>
                <option value="id">Policy item id</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <p className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              Showing {filteredItems.length} of {items.length}
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((additive) => (
            <article
              key={additive.policy_item_id}
              className="group flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-lg shadow-orange-100/40 transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-200/40"
            >
              <div className="mb-3 inline-flex w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700">
                {additive.policy_item_code || "No policy code"}
              </div>

              <h2 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-900">
                {additive.food_flavouring_name || "Unknown flavouring"}
              </h2>

              <p className="mt-2 text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">Policy item id:</span>{" "}
                {additive.policy_item_id}
              </p>

              <div className="mt-auto pt-5">
                <span className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-500">
                  Details view not available
                </span>
              </div>
            </article>
          ))}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/90 p-8 text-center text-zinc-700">
            No flavourings matched your filters. Try clearing one or more filter fields.
          </div>
        ) : null}
      </div>
    </main>
  );
}
