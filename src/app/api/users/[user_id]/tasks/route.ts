import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { GetUserTasksRequest, GetUserTasksResponse } from "@/lib/api";

// 특정 유저의 모든 작업 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: GetUserTasksRequest }
): Promise<NextResponse<GetUserTasksResponse | { error: string }>> {
  const { user_id } = params;

  // JOIN을 사용해서 식물 정보와 함께 작업 목록 조회
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
    .order("due_date", { ascending: true }); // 마감일순 정렬

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
