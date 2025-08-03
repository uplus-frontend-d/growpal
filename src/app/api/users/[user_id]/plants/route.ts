import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("user_id", user_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
