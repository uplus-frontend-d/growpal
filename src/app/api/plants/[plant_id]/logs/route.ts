import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetPlantLogsRequest,
  GetPlantLogsResponse,
  CreatePlantLogRequest,
  CreatePlantLogResponse,
} from "@/lib/api";

// 특정 식물의 활동 로그 전체 조회
export async function GET(
  req: NextRequest,
  { params }: { params: GetPlantLogsRequest }
): Promise<NextResponse<GetPlantLogsResponse | { error: string }>> {
  const { plant_id } = params;

  const { data, error } = await supabase
    .from("plant_logs")
    .select("*")
    .eq("plant_id", plant_id)
    .order("created_at", { ascending: false }); // 최신순 정렬

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

// 식물 활동 로그 등록하기
export async function POST(
  req: NextRequest,
  { params }: { params: GetPlantLogsRequest }
): Promise<NextResponse<CreatePlantLogResponse | { error: string }>> {
  try {
    const { plant_id } = params;
    const body: CreatePlantLogRequest = await req.json();
    const { image_url, note } = body;

    // 필수 필드 검증
    if (!note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    // 현재 시간을 created_at으로 설정
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("plant_logs")
      .insert({
        plant_id,
        image_url: image_url || null,
        note,
        created_at: now,
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
