import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetPlantTasksRequest,
  GetPlantTasksResponse,
  CreatePlantTaskRequest,
  CreatePlantTaskResponse,
} from "@/lib/api";

// 특정 식물의 작업 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: GetPlantTasksRequest }
): Promise<NextResponse<GetPlantTasksResponse | { error: string }>> {
  const { plant_id } = params;

  const { data, error } = await supabase
    .from("plant_tasks")
    .select("*")
    .eq("plant_id", plant_id)
    .order("due_date", { ascending: true }); // 마감일순 정렬

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

// 식물 작업 등록하기
export async function POST(
  req: NextRequest,
  { params }: { params: GetPlantTasksRequest }
): Promise<NextResponse<CreatePlantTaskResponse | { error: string }>> {
  try {
    const { plant_id } = params;
    const body: CreatePlantTaskRequest = await req.json();
    const { task_type, due_date, icon } = body;

    // 필수 필드 검증
    if (!task_type || !due_date) {
      return NextResponse.json(
        { error: "task_type and due_date are required" },
        { status: 400 }
      );
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(due_date)) {
      return NextResponse.json(
        { error: "due_date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("plant_tasks")
      .insert({
        plant_id,
        task_type,
        due_date,
        is_done: false, // 기본값: 미완료
        icon: icon || "📝", // 기본 아이콘
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
