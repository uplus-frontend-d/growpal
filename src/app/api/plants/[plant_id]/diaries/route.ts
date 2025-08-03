import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  GetPlantDiariesRequest,
  GetPlantDiariesResponse,
  CreatePlantDiaryRequest,
  CreatePlantDiaryResponse,
} from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<GetPlantDiariesRequest> }
): Promise<NextResponse<GetPlantDiariesResponse | { error: string }>> {
  const { plant_id } = await params;
  if (!plant_id) {
    return NextResponse.json(
      { error: "plant_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("plant_diaries")
    .select("*")
    .eq("plant_id", plant_id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<GetPlantDiariesRequest> }
): Promise<NextResponse<CreatePlantDiaryResponse | { error: string }>> {
  try {
    const { plant_id } = await params;
    const body: CreatePlantDiaryRequest = await req.json();
    const { image_url, note } = body;

    if (!note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("plant_diaries")
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
