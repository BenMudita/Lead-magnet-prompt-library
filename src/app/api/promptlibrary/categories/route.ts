import { NextResponse } from "next/server";
import { getCategories } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ categories: getCategories() });
}

