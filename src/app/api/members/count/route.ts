import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { count, error } = await getSupabaseAdmin()
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  if (error) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  return NextResponse.json(
    { count: count || 0 },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
