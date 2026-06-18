import { NextResponse } from "next/server";
import { getCategories } from "@/lib/prompt-data";

export async function GET() {
  return NextResponse.json({ categories: getCategories() });
}
