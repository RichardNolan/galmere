import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { TestTube2 } from "lucide-react";

export const Route = createFileRoute("/lab-average")({
  beforeLoad: async () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Quality Metrics"
      title="Lab Average"
      subtitle="Consolidate baseline values from lab reports to monitor consistency across batches and suppliers."
      icon={TestTube2}
      imageUrl="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
