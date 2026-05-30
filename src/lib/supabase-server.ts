import { auth } from "@clerk/tanstack-react-start/server";

import { createSupabaseUserClient } from "#/lib/supabase";

export async function createServerSupabaseClient() {
  const authState = await auth();

  if (!authState.isAuthenticated) {
    throw new Error("Unauthenticated request to Supabase");
  }

  const token = await authState.getToken?.();

  if (!token) {
    throw new Error("Missing Clerk session token for Supabase request");
  }

  return createSupabaseUserClient(token);
}
