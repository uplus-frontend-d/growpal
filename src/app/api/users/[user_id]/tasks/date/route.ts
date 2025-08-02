import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetUserTasksByDateRequest,
  GetUserTasksByDateResponse,
} from "@/lib/api";

// 특정 유저의 특정 날짜 이후 작업 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
): Promise<NextResponse<GetUserTasksByDateResponse | { error: string }>> {
  const { user_id } = params;
  const { searchParams } = new URL(req.url);
  const from_date = searchParams.get("from_date");

  // from_date 파라미터 검증
  if (!from_date) {
    return NextResponse.json(
      { error: "from_date parameter is required" },
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

  // JOIN을 사용해서 식물 정보와 함께 작업 목록 조회 (특정 날짜 이후)
  const { data, error } = await supabase
    .from("plant_tasks")
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
    .gte("due_date", from_date) // due_date >= from_date
    .order("due_date", { ascending: true }); // 마감일순 정렬

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
