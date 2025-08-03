import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { CreatePlantRequest, CreatePlantResponse } from "@/lib/api";

// 식물 등록하기
export async function POST(
  req: NextRequest
): Promise<NextResponse<CreatePlantResponse | { error: string }>> {
  try {
    const body: CreatePlantRequest = await req.json();
    console.log("Received plant data:", body);

    const {
      user_id,
      name,
      location,
      image_url,
      adopted_at,
      growth_status,
      species,
    } = body;

    // 필수 필드 검증
    if (!user_id || !name || !location) {
      console.log("Missing required fields:", { user_id, name, location });
      return NextResponse.json(
        { error: "user_id, name, location are required" },
        { status: 400 }
      );
    }

    // 현재 시간을 last_watered_at으로 설정
    const now = new Date().toISOString();

    // adopted_at이 없으면 현재 날짜로 설정 (YYYY-MM-DD 형식)
    const currentDate = new Date().toISOString().split("T")[0];

    const insertData = {
      user_id,
      name,
      location,
      image_url: image_url || null, // nullable로 설정
      last_watered_at: now,
      adopted_at: adopted_at || currentDate, // NULL이면 현재 날짜로 설정
      growth_status: growth_status || null, // nullable로 설정
      species: species || null,
    };

    console.log("Inserting data:", insertData);

    const { data, error } = await supabase
      .from("plants")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
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
  try {
    console.log("GET /api/plants called");

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    console.log("User ID from query params:", user_id);

    let query = supabase.from("plants").select("*");

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    console.log("Executing Supabase query...");
    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Query successful, data count:", data?.length || 0);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/plants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
