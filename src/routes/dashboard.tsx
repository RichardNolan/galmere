import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Clock3, FolderOpenDot, ShieldAlert } from "lucide-react";

import { requireAuth } from "#/lib/require-auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => await requireAuth(),
  loader: async ({ context }) => {
    return { userId: context.userId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useLoaderData();

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Overview
        </p>
        <h1 className="mt-2 font-[Fraunces] text-3xl font-semibold text-slate-900 sm:text-4xl">
          Welcome
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Signed in as {userId}. Review operational activity and compliance status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Activity className="size-5 text-emerald-700" />
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Active checks</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">28</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldAlert className="size-5 text-amber-700" />
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Flagged claims</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">4</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FolderOpenDot className="size-5 text-cyan-700" />
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Pending docs</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">13</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Clock3 className="size-5 text-rose-700" />
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Needs review</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">6</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Jump to catalogs</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              to="/additives"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Additives
            </Link>
            <Link
              to="/flavourings"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Flavourings
            </Link>
            <Link
              to="/saved-products"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Saved products
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
            alt="Organized food prep station"
            className="h-44 w-full object-cover"
          />
          <div className="p-5">
            <p className="text-sm text-slate-600">
              Keep documentation, labeling, and process controls aligned while product teams move
              fast.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
