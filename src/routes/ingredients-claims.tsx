import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { SearchCheck } from "lucide-react";

export const Route = createFileRoute("/ingredients-claims")({
  beforeLoad: async () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Regulatory Review"
      title="Ingredients Claims"
      subtitle="Validate claim language and ingredient statements before they are released into labels, menus, and product documentation."
      icon={SearchCheck}
      imageUrl="https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
