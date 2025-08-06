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
    const { todo_id } = await params;
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

    const { data, error } = await supabase
      .from("plant_todos")
      .update(updateData)
      .eq("id", todo_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
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
