import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetPlantTodosRequest,
  GetPlantTodosResponse,
  CreatePlantTodoRequest,
  CreatePlantTodoResponse,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<GetPlantTodosRequest> }
): Promise<NextResponse<GetPlantTodosResponse | { error: string }>> {
  const { plant_id } = await params;
  if (!plant_id) {
    return NextResponse.json(
      { error: "plant_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("plant_todos")
    .select("*")
    .eq("plant_id", plant_id)
    .order("due_date", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<GetPlantTodosRequest> }
): Promise<NextResponse<CreatePlantTodoResponse | { error: string }>> {
  try {
    const { plant_id } = await params;
    const body: CreatePlantTodoRequest = await req.json();
    const { task_type, due_date } = body;

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

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("plant_todos")
      .insert({
        plant_id,
        task_type,
        due_date,
        is_done: false,
        executed_at: null,
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
