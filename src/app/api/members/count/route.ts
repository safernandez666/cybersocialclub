import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const { count, error } = await getSupabaseAdmin()
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  if (error) {
    return NextResponse.json({ count: 0 }, { status: 200, headers: corsHeaders });
  }

  return NextResponse.json(
    { count: count || 0 },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
