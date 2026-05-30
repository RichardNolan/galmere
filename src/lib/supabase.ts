import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

let accessTokenGetter: (() => Promise<string | null>) | null = null;

export function setSupabaseAccessTokenGetter(getter: (() => Promise<string | null>) | null) {
  accessTokenGetter = getter;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    if (!accessTokenGetter) {
      return null;
    }

    return accessTokenGetter();
  },
});

export function createSupabaseUserClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => accessToken,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
