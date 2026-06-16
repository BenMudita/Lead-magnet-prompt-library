import { NextResponse } from "next/server";
import { ensureSupabaseProfile } from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") ?? "/promptlibrary";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/promptlibrary";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await ensureSupabaseProfile(data.user);
    }
  }

  return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
}
