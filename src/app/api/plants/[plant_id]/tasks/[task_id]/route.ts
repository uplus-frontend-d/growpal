import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  UpdatePlantTaskRequest,
  UpdatePlantTaskResponse,
  DeletePlantTaskRequest,
  DeletePlantTaskResponse,
} from "@/lib/api";

// 식물 작업 완료 상태 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { plant_id: string; task_id: string } }
): Promise<NextResponse<UpdatePlantTaskResponse | { error: string }>> {
  try {
    const { task_id } = params;
    const body: UpdatePlantTaskRequest = await req.json();
    const { is_done } = body;

    // is_done 값만 허용
    if (typeof is_done !== "boolean") {
      return NextResponse.json(
        { error: "is_done must be a boolean value" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("plant_tasks")
      .update({ is_done })
      .eq("id", task_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

// 식물 작업 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: DeletePlantTaskRequest }
): Promise<NextResponse<DeletePlantTaskResponse | { error: string }>> {
  const { task_id } = params;

  const { error } = await supabase
    .from("plant_tasks")
    .delete()
    .eq("id", task_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Task deleted successfully" },
    { status: 200 }
  );
}
