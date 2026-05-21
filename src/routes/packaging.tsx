import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

export const Route = createFileRoute("/packaging")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Format Standards"
      title="Packaging"
      subtitle="Coordinate packaging constraints, claims area, and approved material specs across SKUs and facilities."
      icon={Package}
      imageUrl="https://images.unsplash.com/photo-1584473457409-ce71dcec165f?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
