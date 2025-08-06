import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  UpdatePlantDiaryRequest,
  UpdatePlantDiaryResponse,
  DeletePlantDiaryRequest,
  DeletePlantDiaryResponse,
} from "@/lib/api";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string; diary_id: string }> }
): Promise<NextResponse<UpdatePlantDiaryResponse | { error: string }>> {
  try {
    const { diary_id } = await params;
    const body: UpdatePlantDiaryRequest = await req.json();
    const { image_url, note } = body;

    if (!image_url && !note) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (note !== undefined) updateData.note = note;

    const { data, error } = await supabase
      .from("plant_diaries")
      .update(updateData)
      .eq("id", diary_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Diary not found" }, { status: 404 });
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string; diary_id: string }> }
): Promise<NextResponse<UpdatePlantDiaryResponse | { error: string }>> {
  try {
    const { diary_id } = await params;
    const body: UpdatePlantDiaryRequest = await req.json();
    const { image_url, note } = body;

    if (!image_url && !note) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (note !== undefined) updateData.note = note;

    const { data, error } = await supabase
      .from("plant_diaries")
      .update(updateData)
      .eq("id", diary_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Diary not found" }, { status: 404 });
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
  { params }: { params: Promise<{ plant_id: string; diary_id: string }> }
): Promise<NextResponse<DeletePlantDiaryResponse | { error: string }>> {
  try {
    const { diary_id } = await params;

    const { error } = await supabase
      .from("plant_diaries")
      .delete()
      .eq("id", diary_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Diary deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
