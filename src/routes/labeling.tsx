import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";

export const Route = createFileRoute("/labeling")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Label Compliance"
      title="Labeling"
      subtitle="Review package copy and required declarations to keep every product launch compliant and consistent."
      icon={BookOpenText}
      imageUrl="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
