import { NextResponse } from "next/server";
import { getSession, isAdminRole } from "./session";

export async function requireAdmin() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    return {
      session,
      response: NextResponse.json({ message: "Admin role required." }, { status: 403 }),
    };
  }
  return { session, response: null };
}

export async function parseJson<T>(request: Request, fallback: T): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return fallback;
  }
}

