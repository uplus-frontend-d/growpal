import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: process.env.NODE_ENV === "development",
  },
  global: {
    headers: {
      "X-Client-Info": "growpal-web",
    },
  },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const { user_id } = params;

    // 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증 토큰이 제공되지 않았습니다." },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);

    // 토큰을 사용하여 사용자 정보 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 토큰의 이메일을 사용하여 users 테이블에서 사용자 찾기
    const { data: dbUser, error: dbUserError } = await supabase
      .from("users")
      .select("id, email, provider")
      .eq("email", authUser.email)
      .single();

    if (dbUserError) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 요청된 user_id와 users 테이블의 사용자 ID가 일치하는지 확인
    if (dbUser.id !== user_id) {
      return NextResponse.json(
        { error: "자신의 계정만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 사용자의 모든 관련 데이터 삭제 (외래 키 제약 조건을 고려한 순서)

    // 1. 사용자의 식물 ID들 먼저 가져오기
    const { data: userPlants, error: plantsQueryError } = await supabase
      .from("plants")
      .select("id")
      .eq("user_id", user_id);

    if (plantsQueryError) {
      return NextResponse.json(
        { error: `사용자 식물 조회 실패: ${plantsQueryError.message}` },
        { status: 500 }
      );
    }

    const plantIds = userPlants?.map((plant) => plant.id) || [];

    // 2. 사용자의 할 일들 삭제 (plant_todos 테이블)
    if (plantIds.length > 0) {
      const { error: todosError } = await supabase
        .from("plant_todos")
        .delete()
        .in("plant_id", plantIds);

      if (todosError) {
        return NextResponse.json(
          { error: `할 일 삭제 실패: ${todosError.message}` },
          { status: 500 }
        );
      }
    }

    // 3. 사용자의 일기들 삭제 (plant_diaries 테이블)
    if (plantIds.length > 0) {
      const { error: diariesError } = await supabase
        .from("plant_diaries")
        .delete()
        .in("plant_id", plantIds);

      if (diariesError) {
        return NextResponse.json(
          { error: `일기 삭제 실패: ${diariesError.message}` },
          { status: 500 }
        );
      }
    }

    // 4. 사용자의 식물들 삭제 (plants 테이블)
    const { error: plantsError } = await supabase
      .from("plants")
      .delete()
      .eq("user_id", user_id);

    if (plantsError) {
      return NextResponse.json(
        { error: `식물 삭제 실패: ${plantsError.message}` },
        { status: 500 }
      );
    }

    // 5. 사용자 계정 삭제 (users 테이블)
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", user_id);

    if (userError) {
      return NextResponse.json(
        { error: `사용자 계정 삭제 실패: ${userError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "회원 탈퇴가 완료되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("회원 탈퇴 처리 중 오류:", error);
    return NextResponse.json(
      { error: "회원 탈퇴 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
