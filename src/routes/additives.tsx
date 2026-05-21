import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

type AdditiveRecord = {
  policy_item_id: string | number;
  additive_name?: string;
  additive_e_code?: string;
  additive_type?: string;
  additive_group?: string;
  fip_url?: string;
};

type AdditivesResponse = {
  value?: AdditiveRecord[];
};

const getFoodAdditives = createServerFn().handler(async () => {
  const response = await fetch(
    "https://api.datalake.sante.service.ec.europa.eu/food-additives/food-additives-list?format=json&api-version=v2.0",
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

  return (await response.json()) as AdditivesResponse;
});

export const Route = createFileRoute("/additives")({
  loader: async () => {
    const additives = await getFoodAdditives();
    return { additives };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { additives } = Route.useLoaderData();
  const items = additives.value ?? [];
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [eCodeStartsWith, setECodeStartsWith] = useState("");
  const [onlyWithReference, setOnlyWithReference] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "code">("name");

  const availableTypes = useMemo(() => {
    return [
      ...new Set(items.map((item) => item.additive_type?.trim()).filter(Boolean) as string[]),
    ].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCodePrefix = eCodeStartsWith.trim().toLowerCase().replaceAll(" ", "");

    const filtered = items.filter((item) => {
      const name = item.additive_name ?? "";
      const code = (item.additive_e_code ?? "").replaceAll(" ", "");
      const type = item.additive_type ?? "";
      const reference = item.fip_url ?? "";

      const matchesQuery =
        normalizedQuery.length === 0 ||
        name.toLowerCase().includes(normalizedQuery) ||
        code.toLowerCase().includes(normalizedQuery) ||
        type.toLowerCase().includes(normalizedQuery);

      const matchesType = selectedType === "all" || type === selectedType;
      const matchesCodePrefix =
        normalizedCodePrefix.length === 0 || code.toLowerCase().startsWith(normalizedCodePrefix);
      const matchesReference = !onlyWithReference || reference.length > 0;

      return matchesQuery && matchesType && matchesCodePrefix && matchesReference;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "code") {
        return (a.additive_e_code ?? "").localeCompare(b.additive_e_code ?? "", undefined, {
          numeric: true,
        });
      }

      return (a.additive_name ?? "").localeCompare(b.additive_name ?? "");
    });

    return sorted;
  }, [eCodeStartsWith, items, onlyWithReference, query, selectedType, sortBy]);

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#fef3c7_0%,#fff7ed_35%,#ffffff_75%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(251,146,60,0.12),rgba(16,185,129,0.08)_50%,rgba(6,182,212,0.08))]" />

      <div className="relative mx-auto max-w-7xl space-y-7">
        <header className="rounded-2xl border border-orange-200/70 bg-white/90 p-6 shadow-[0_22px_70px_-35px_rgba(194,65,12,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
            EU Data Lake
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-zinc-900 sm:text-4xl">
            Food Additives Explorer
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-700 sm:text-base">
            Browse and inspect food additives in a focused catalog view. Filter by type, search by
            name or E-code, and jump to the official reference.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-xl shadow-zinc-200/70 backdrop-blur sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: benzoate, E210, preservative"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Additive Type
              </span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                <option value="all">All types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                E-code starts with
              </span>
              <input
                value={eCodeStartsWith}
                onChange={(event) => setECodeStartsWith(event.target.value)}
                placeholder="E1"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "name" | "code")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                <option value="name">Name (A-Z)</option>
                <option value="code">E-code</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={onlyWithReference}
                onChange={(event) => setOnlyWithReference(event.target.checked)}
                className="size-4 rounded border-zinc-400 text-orange-600 focus:ring-orange-500"
              />
              Only show additives with reference URL
            </label>

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
                {additive.additive_e_code || "No E-code"}
              </div>

              <h2 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-900">
                {additive.additive_name || "Unknown additive"}
              </h2>

              <p className="mt-2 text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">Type:</span>{" "}
                {additive.additive_type || "Unknown"}
              </p>

              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">Group:</span>{" "}
                {additive.additive_group || "Not specified"}
              </p>

              <div className="mt-auto pt-5">
                {additive.fip_url ? (
                  <a
                    href={additive.fip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition group-hover:bg-orange-600"
                  >
                    Open reference
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-500">
                    No reference link
                  </span>
                )}

                <Link
                  to="/additives/$id"
                  params={{ id: String(additive.policy_item_id) }}
                  className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition group-hover:bg-orange-600"
                >
                  Details
                </Link>
              </div>
            </article>
          ))}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/90 p-8 text-center text-zinc-700">
            No additives matched your filters. Try clearing one or more filter fields.
          </div>
        ) : null}
      </div>
    </main>
  );
}
