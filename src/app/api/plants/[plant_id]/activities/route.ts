import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";
import {
  GetPlantActivitiesRequest,
  GetPlantActivitiesResponse,
} from "@/lib/api";

/**
 * GET /api/plants/[plant_id]/activities
 * 특정 식물의 모든 활동 조회 (Diary + Todo)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<GetPlantActivitiesRequest> }
): Promise<NextResponse<GetPlantActivitiesResponse | { error: string }>> {
  try {
    const { plant_id } = await params;

    // 식물 존재 여부 확인
    const { data: plant, error: plantError } = await supabase
      .from("plants")
      .select("id")
      .eq("id", plant_id)
      .single();

    if (plantError || !plant) {
      return NextResponse.json(
        { error: "식물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Diary와 Todo를 병렬로 조회
    const [diariesResult, todosResult] = await Promise.all([
      supabase
        .from("plant_diaries")
        .select("*")
        .eq("plant_id", plant_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("plant_todos")
        .select("*")
        .eq("plant_id", plant_id)
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

    const response: GetPlantActivitiesResponse = {
      diaries: diariesResult.data || [],
      todos: todosResult.data || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Plant activities 조회 오류:", error);
    return NextResponse.json(
      { error: "활동 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
