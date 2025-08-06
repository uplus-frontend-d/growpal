import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import { GetUserActivitiesRequest, GetUserActivitiesResponse } from "@/lib/api";

/**
 * GET /api/users/[user_id]/activities
 * 특정 유저의 모든 활동 조회 (Diary + Todo)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<GetUserActivitiesRequest> }
): Promise<NextResponse<GetUserActivitiesResponse | { error: string }>> {
  try {
    const { user_id } = await params;

    // 유저 존재 여부 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Diary와 Todo를 병렬로 조회 (해당 유저의 모든 식물에 대한 활동)
    const [diariesResult, todosResult] = await Promise.all([
      supabase
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
        .order("created_at", { ascending: false }),
      supabase
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
        .order("created_at", { ascending: false }),
    ]);

    if (diariesResult.error) {
      console.error("Diary 조회 오류:", diariesResult.error);
      return NextResponse.json(
        { error: "일지 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (todosResult.error) {
      console.error("Todo 조회 오류:", todosResult.error);
      return NextResponse.json(
        { error: "할 일 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const response: GetUserActivitiesResponse = {
      diaries: diariesResult.data || [],
      todos: todosResult.data || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("User activities 조회 오류:", error);
    return NextResponse.json(
      { error: "활동 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
