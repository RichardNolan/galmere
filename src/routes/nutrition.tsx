import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/nutrition")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Nutritional Data"
      title="Nutrition"
      subtitle="Maintain nutrient values, serving data, and formulation assumptions for product and regulatory teams."
      icon={Scale}
      imageUrl="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
