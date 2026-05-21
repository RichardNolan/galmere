import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import WelcomeUser from "#/components/welcome-user";
import { Show } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Beaker, FileCheck2, FlaskConical, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden rounded-3xl border-slate-200/70 shadow-xl shadow-slate-300/35">
        <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <Badge className="tracking-[0.18em]">Food Services Intelligence</Badge>
            <h1 className="mt-4 font-[Fraunces] text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Welcome to Galmere Portal
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
              Centralize additive and flavouring intelligence, product readiness, compliance
              records, and operational documents in one workspace built for fast food service
              decisions.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/additives"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Browse additives
              </Link>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1200&q=80"
              alt="Ingredients and fresh produce on a food prep surface"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/65 via-slate-900/10 to-transparent" />
          </div>
        </div>
      </Card>

      <Show when="signed-in">
        <WelcomeUser />
      </Show>

      <Show when="signed-out">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600">
          Please sign in or sign up to access the dashboard and internal documents.
          <nav className="mt-3 flex items-center gap-4 text-sm font-semibold text-emerald-700">
            <Link to="/sign-in/$" className="hover:text-emerald-900">
              Sign In
            </Link>
            <Link to="/sign-up/$" className="hover:text-emerald-900">
              Sign Up
            </Link>
          </nav>
        </div>
      </Show>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="rounded-2xl p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          asChild
        >
          <Link to="/additives">
            <CardContent className="p-5">
              <Beaker className="size-5 text-emerald-700" />
              <p className="mt-3 text-base font-semibold text-slate-900">Additives</p>
              <p className="mt-1 text-sm text-slate-600">Search by E-code, type, and references.</p>
            </CardContent>
          </Link>
        </Card>

        <Card
          className="rounded-2xl p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          asChild
        >
          <Link to="/flavourings">
            <CardContent className="p-5">
              <FlaskConical className="size-5 text-cyan-700" />
              <p className="mt-3 text-base font-semibold text-slate-900">Flavourings</p>
              <p className="mt-1 text-sm text-slate-600">Find flavouring policy items quickly.</p>
            </CardContent>
          </Link>
        </Card>

        <Card
          className="rounded-2xl p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          asChild
        >
          <Link to="/documents">
            <CardContent className="p-5">
              <FileCheck2 className="size-5 text-amber-700" />
              <p className="mt-3 text-base font-semibold text-slate-900">Documents</p>
              <p className="mt-1 text-sm text-slate-600">Store supporting records and specs.</p>
            </CardContent>
          </Link>
        </Card>

        <Card
          className="rounded-2xl p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          asChild
        >
          <Link to="/process-haccp">
            <CardContent className="p-5">
              <ShieldCheck className="size-5 text-rose-700" />
              <p className="mt-3 text-base font-semibold text-slate-900">HACCP</p>
              <p className="mt-1 text-sm text-slate-600">Build process controls with confidence.</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </section>
  );
}
