import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";

const requireSupabasePublicConfig = () => {
  if (!appEnv.supabaseUrl || !appEnv.supabasePublicKey) {
    throw new Error("Supabase public URL/key are required when AUTH_PROVIDER=supabase.");
  }
  return {
    url: appEnv.supabaseUrl,
    key: appEnv.supabasePublicKey,
  };
};

const requireSupabaseAdminConfig = () => {
  if (!appEnv.supabaseUrl || !appEnv.supabaseSecretKey) {
    throw new Error("Supabase URL and secret/service role key are required for server-side database writes.");
  }
  return {
    url: appEnv.supabaseUrl,
    key: appEnv.supabaseSecretKey,
  };
};

export async function createSupabaseServerClient() {
  const { url, key } = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Middleware and Route Handlers refresh them.
        }
      },
    },
  });
}

export async function createSupabaseRouteHandlerClient(response: NextResponse) {
  const { url, key } = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);

          try {
            cookieStore.set(name, value, options);
          } catch {
            // The redirect response above is the source of truth for Route Handlers.
          }
        });
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, key } = requireSupabaseAdminConfig();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
