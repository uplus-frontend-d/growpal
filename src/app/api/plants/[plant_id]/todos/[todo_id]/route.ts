import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  UpdatePlantTodoRequest,
  UpdatePlantTodoResponse,
  DeletePlantTodoRequest,
  DeletePlantTodoResponse,
} from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string; todo_id: string }> }
): Promise<NextResponse<UpdatePlantTodoResponse | { error: string }>> {
  try {
    const { plant_id, todo_id } = await params;
    const body: UpdatePlantTodoRequest = await req.json();
    const { is_done } = body;

    if (is_done === undefined) {
      return NextResponse.json(
        { error: "is_done field is required" },
        { status: 400 }
      );
    }

    const updateData: any = { is_done };

    // 완료 상태로 변경할 때 executed_at 설정
    if (is_done) {
      updateData.executed_at = new Date().toISOString();
    } else {
      updateData.executed_at = null;
    }

    const { data: todoData, error: todoError } = await supabase
      .from("plant_todos")
      .update(updateData)
      .eq("id", todo_id)
      .select()
      .single();

    if (todoError) {
      if (todoError.code === "PGRST116") {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
      }
      return NextResponse.json({ error: todoError.message }, { status: 500 });
    }

    // 물주기 todo 완료 시 plant의 last_watered_at 업데이트
    if (is_done && todoData.task_type === "watering") {
      const { error: plantError } = await supabase
        .from("plants")
        .update({ last_watered_at: new Date().toISOString() })
        .eq("id", plant_id);

      if (plantError) {
        console.error("Failed to update plant last_watered_at:", plantError);
        // todo는 성공했지만 plant 업데이트 실패는 경고만 하고 계속 진행
      } else {
        // 성공적으로 업데이트된 경우 응답에 plant 업데이트 정보 포함
        const currentTime = new Date().toISOString();
        return NextResponse.json(
          {
            ...todoData,
            plant_updated: {
              id: plant_id,
              last_watered_at: currentTime,
            },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(todoData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string; todo_id: string }> }
): Promise<NextResponse<DeletePlantTodoResponse | { error: string }>> {
  try {
    const { todo_id } = await params;

    const { error } = await supabase
      .from("plant_todos")
      .delete()
      .eq("id", todo_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Todo deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
