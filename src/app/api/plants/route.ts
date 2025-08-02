import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { CreatePlantRequest, CreatePlantResponse } from "@/lib/api";

// 식물 등록하기
export async function POST(
  req: NextRequest
): Promise<NextResponse<CreatePlantResponse | { error: string }>> {
  try {
    const body: CreatePlantRequest = await req.json();
    const { user_id, name, location, image_url } = body;

    // 필수 필드 검증
    if (!user_id || !name || !location) {
      return NextResponse.json(
        { error: "user_id, name, location are required" },
        { status: 400 }
      );
    }

    // 현재 시간을 last_watered_at으로 설정
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("plants")
      .insert({
        user_id,
        name,
        location,
        image_url: image_url || null,
        last_watered_at: now,
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

// 모든 식물 목록 조회 (선택적: user_id 쿼리 파라미터로 필터링)
export async function GET(req: NextRequest): Promise<NextResponse<any>> {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  let query = supabase.from("plants").select("*");

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
