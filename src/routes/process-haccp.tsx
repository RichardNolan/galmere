import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/process-haccp")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Food Safety"
      title="Process HACCP"
      subtitle="Map control points, hazards, and preventive actions so every product line maintains documented safety workflows."
      icon={ShieldCheck}
      imageUrl="https://images.unsplash.com/photo-1582719478185-219f8f53f3f5?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
