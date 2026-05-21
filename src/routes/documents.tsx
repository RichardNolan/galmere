import SectionPage from "#/components/section-page";
import { requireAuth } from "#/lib/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { FileArchive } from "lucide-react";

export const Route = createFileRoute("/documents")({
  beforeLoad: async () => await requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SectionPage
      badge="Document Control"
      title="Documents"
      subtitle="Track specification sheets, supplier records, approvals, and internal files in a single audit-ready area."
      icon={FileArchive}
      imageUrl="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
    />
  );
}
