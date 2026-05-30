import { createSupabaseUserClient } from "#/lib/supabase";
import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function logAuthDebugClaims(): Promise<void> {
  if (import.meta.env.VITE_DEBUG_AUTH_CLAIMS !== "true") {
    return;
  }

  const authState = await auth();
  const getToken = (authState as { getToken?: () => Promise<string | null> }).getToken;

  const sessionToken = getToken ? await getToken() : null;

  const claims = sessionToken ? decodeJwtPayload(sessionToken) : null;
  let supabaseWhoami: unknown = null;

  if (sessionToken) {
    const supabaseUserClient = createSupabaseUserClient(sessionToken);
    const { data, error } = await supabaseUserClient.rpc("debug_whoami");

    supabaseWhoami = error ? { error: error.message, code: error.code, hint: error.hint } : data;
  }

  console.info("[auth-debug] Clerk auth state", {
    isAuthenticated: authState.isAuthenticated,
    userId: authState.userId,
    hasClerkSessionToken: Boolean(sessionToken),
    clerkSessionClaims: claims,
    supabaseWhoami,
  });
}

export const requireAuth = createServerFn().handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw redirect({ to: "/sign-in/$" });
  }

  await logAuthDebugClaims();

  return { userId };
});
