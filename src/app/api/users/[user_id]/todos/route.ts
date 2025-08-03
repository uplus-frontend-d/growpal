import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { GetUserTodosRequest, GetUserTodosResponse } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: GetUserTodosRequest }
): Promise<NextResponse<GetUserTodosResponse | { error: string }>> {
  const { user_id } = params;
  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("plant_todos")
    .select(
      `
      *,
      plants!inner(
        id,
        name,
        location,
        user_id
      )
    `
    )
    .eq("plants.user_id", user_id)
    .order("due_date", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
