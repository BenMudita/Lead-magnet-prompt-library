import { handleSupabaseAuthCallback } from "@/lib/supabase/auth-callback";

export async function GET(request: Request) {
  return handleSupabaseAuthCallback(request);
}
