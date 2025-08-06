import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetUserDiariesByExactDateRequest,
  GetUserDiariesByExactDateResponse,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  context: { params: GetUserDiariesByExactDateRequest }
): Promise<
  NextResponse<GetUserDiariesByExactDateResponse | { error: string }>
> {
  const { user_id } = await context.params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json(
      { error: "date query parameter is required" },
      { status: 400 }
    );
  }

  // 날짜 형식 검증 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("plant_diaries")
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
    .gte("created_at", `${date}T00:00:00`) // 해당 날짜의 시작
    .lt("created_at", `${date}T23:59:59.999`) // 해당 날짜의 끝
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}
