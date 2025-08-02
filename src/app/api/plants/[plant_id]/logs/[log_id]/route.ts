import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  UpdatePlantLogRequest,
  UpdatePlantLogResponse,
  DeletePlantLogRequest,
  DeletePlantLogResponse,
} from "@/lib/api";

// 식물 활동 로그 수정하기
export async function PUT(
  req: NextRequest,
  { params }: { params: { plant_id: string; log_id: string } }
): Promise<NextResponse<UpdatePlantLogResponse | { error: string }>> {
  try {
    const { log_id } = params;
    const body: UpdatePlantLogRequest = await req.json();
    const { image_url, note } = body;

    // 최소 하나의 필드는 수정되어야 함
    if (!image_url && !note) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    // 수정할 데이터 객체 생성 (undefined 값 제외)
    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (note !== undefined) updateData.note = note;

    const { data, error } = await supabase
      .from("plant_logs")
      .update(updateData)
      .eq("id", log_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Plant log not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// PATCH 메서드도 지원 (부분 업데이트)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { plant_id: string; log_id: string } }
): Promise<NextResponse<UpdatePlantLogResponse | { error: string }>> {
  return PUT(req, { params });
}

// 식물 활동 로그 삭제하기
export async function DELETE(
  req: NextRequest,
  { params }: { params: DeletePlantLogRequest }
): Promise<NextResponse<DeletePlantLogResponse | { error: string }>> {
  const { log_id } = params;

  const { error } = await supabase.from("plant_logs").delete().eq("id", log_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Plant log deleted successfully" },
    { status: 200 }
  );
}
