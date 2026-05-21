import { Badge } from "#/components/ui/badge";
import { Card } from "#/components/ui/card";
import type { LucideIcon } from "lucide-react";

type SectionPageProps = {
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  imageUrl: string;
};

export default function SectionPage({
  title,
  subtitle,
  badge,
  icon: Icon,
  imageUrl,
}: SectionPageProps) {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden rounded-3xl border-slate-200/70 shadow-xl shadow-slate-200/60">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <Badge className="gap-2 tracking-[0.18em]">
              <Icon className="size-3.5" />
              {badge}
            </Badge>
            <h1 className="mt-4 font-[Fraunces] text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
              {subtitle}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Setup in progress</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Operations Team</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Priority</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">High</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-56 overflow-hidden bg-slate-100">
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent" />
          </div>
        </div>
      </Card>
    </section>
  );
}
