import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type {
  UpdatePlantRequest,
  UpdatePlantResponse,
  DeletePlantRequest,
  DeletePlantResponse,
  Plant,
} from "@/lib/api";

// 특정 식물 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string }> }
): Promise<NextResponse<Plant | { error: string }>> {
  try {
    const { plant_id } = await params;

    if (!plant_id) {
      return NextResponse.json(
        { error: "plant_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("id", plant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Plant not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching plant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 식물 수정하기
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string }> }
): Promise<NextResponse<UpdatePlantResponse | { error: string }>> {
  try {
    const { plant_id } = await params;
    const body: UpdatePlantRequest = await req.json();
    const { name, location, image_url, adopted_at, growth_status, species } =
      body;

    // 최소 하나의 필드는 수정되어야 함
    if (
      !name &&
      !location &&
      !image_url &&
      !adopted_at &&
      !growth_status &&
      !species
    ) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    // 수정할 데이터 객체 생성 (undefined 값 제외)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (adopted_at !== undefined) updateData.adopted_at = adopted_at;
    if (growth_status !== undefined) updateData.growth_status = growth_status;
    if (species !== undefined) updateData.species = species;

    const { data, error } = await supabase
      .from("plants")
      .update(updateData)
      .eq("id", plant_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Plant not found" }, { status: 404 });
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
  { params }: { params: Promise<{ plant_id: string }> }
): Promise<NextResponse<UpdatePlantResponse | { error: string }>> {
  return PUT(req, { params });
}

// 식물 삭제하기
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plant_id: string }> }
): Promise<NextResponse<DeletePlantResponse | { error: string }>> {
  const { plant_id } = await params;

  const { error } = await supabase.from("plants").delete().eq("id", plant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Plant deleted successfully" },
    { status: 200 }
  );
}
