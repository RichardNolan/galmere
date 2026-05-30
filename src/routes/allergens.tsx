import AllergenManagement from "#/components/AllergenManagement";
import { requireAuth } from "#/lib/require-auth";
import { createServerSupabaseClient } from "#/lib/supabase-server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/allergens")({
  beforeLoad: async () => await requireAuth(),
  loader: async () => {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: allergens } = await supabase.from("allergen_rules").select();
      return { allergens, error: null };
    } catch (e) {
      console.error("Error fetching allergens:", e);
      return { allergens: [], error: e };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { allergens, error } = Route.useLoaderData();
  console.log(error);

  return (
    <div>
      Hello "/allergens"!
      {allergens?.map((a) => (
        <div key={a.id}>
          {a.label} -{" "}
          {a.keywords.map((k: string) => (
            <div key={k}>{k}</div>
          ))}
        </div>
      ))}
      <AllergenManagement
        currentProductId={"demo-tkr-creamy-tomato-basil-soup"}
        currentProductTitle={"Creamy Tomato & Basil Soup"}
        recipeRows={[]}
        onSave={async (payload) => {
          // optionally call your existing save endpoint / function
          return true;
        }}
      />
    </div>
  );
}
