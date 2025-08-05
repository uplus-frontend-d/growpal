import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetUserTodosByDateRequest,
  GetUserTodosByDateResponse,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  context: { params: GetUserTodosByDateRequest }
): Promise<NextResponse<GetUserTodosByDateResponse | { error: string }>> {
  const { user_id } = await context.params;
  const { searchParams } = new URL(req.url);
  const from_date = searchParams.get("from_date");

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  if (!from_date) {
    return NextResponse.json(
      { error: "from_date query parameter is required" },
      { status: 400 }
    );
  }

  // 날짜 형식 검증 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from_date)) {
    return NextResponse.json(
      { error: "from_date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
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
    .gte("due_date", from_date)
    .order("due_date", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}
