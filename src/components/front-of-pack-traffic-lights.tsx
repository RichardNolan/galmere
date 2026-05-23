import type { Product as ProductType } from "#/api/Products";
import { useProductNutritionSummary } from "#/hooks/use-product-nutrition";

type FrontOfPackTrafficLightsProps = {
  product: ProductType;
};

type TrafficLightMetric = "fat" | "sat" | "sugar" | "salt";
type TrafficLightLevel = "green" | "amber" | "red";

const metricDefs: Array<{ key: TrafficLightMetric; label: string }> = [
  { key: "fat", label: "Fat" },
  { key: "sat", label: "Sat Fat" },
  { key: "sugar", label: "Sugars" },
  { key: "salt", label: "Salt" },
];

const trafficLightLimits: Record<
  TrafficLightMetric,
  {
    greenMax: number;
    amberMax: number;
  }
> = {
  fat: { greenMax: 3, amberMax: 17.5 },
  sat: { greenMax: 1.5, amberMax: 5 },
  sugar: { greenMax: 5, amberMax: 22.5 },
  salt: { greenMax: 0.3, amberMax: 1.5 },
};

function getTrafficLightLevel(metric: TrafficLightMetric, value: number): TrafficLightLevel {
  const limits = trafficLightLimits[metric];

  if (value <= limits.greenMax) {
    return "green";
  }

  if (value <= limits.amberMax) {
    return "amber";
  }

  return "red";
}

function getTrafficLightLabel(level: TrafficLightLevel): string {
  if (level === "green") {
    return "Low Per Serving";
  }

  if (level === "amber") {
    return "Medium Per Serving";
  }

  return "High Per Serving";
}

function formatGrams(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, "")}${value % 1 === 0 ? ".0" : ""}g`;
}

function getLevelClasses(level: TrafficLightLevel) {
  if (level === "green") {
    return {
      accent: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-900",
    };
  }

  if (level === "amber") {
    return {
      accent: "bg-amber-500",
      badge: "bg-amber-100 text-amber-900",
    };
  }

  return {
    accent: "bg-rose-500",
    badge: "bg-rose-100 text-rose-900",
  };
}

export function FrontOfPackTrafficLights({ product }: FrontOfPackTrafficLightsProps) {
  const { effectiveNutrition } = useProductNutritionSummary(product);

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
      <h3 className="mb-5 text-base font-semibold text-slate-900">Front-of-Pack Traffic Lights</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {metricDefs.map((metric) => {
          const value = effectiveNutrition[metric.key];
          const level = getTrafficLightLevel(metric.key, value);
          const classes = getLevelClasses(level);

          return (
            <article
              key={metric.key}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
            >
              <div className="grid grid-cols-[6px_1fr] items-stretch gap-4">
                <div className={`w-1.5 rounded-full ${classes.accent}`} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold leading-none text-slate-900">
                    {formatGrams(value)}
                  </p>
                  <span
                    className={`mt-5 inline-flex rounded-full px-4 py-2 text-base font-semibold ${classes.badge}`}
                  >
                    {getTrafficLightLabel(level)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
