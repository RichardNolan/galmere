import type { Brand } from "#/api/Brands";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const fetchBrands = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await createServerSupabaseClient();

  // TODO: just get the count of products for each brand instead of the full product data
  const { data, error } = await supabase.from("brands").select(`
      *,
      products:products(*)
    `);

  if (error) {
    throw new Error(`Failed to load brands: ${error.message}`);
  }

  return { brands: (data ?? []) as Brand[] };
});

export const Route = createFileRoute("/brands")({
  component: BrandsLayout,
  beforeLoad: async () => await requireAuth(),
  loader: async () => fetchBrands(),
});

function BrandsLayout() {
  return <Outlet />;
}
