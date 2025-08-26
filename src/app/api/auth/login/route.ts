import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { LoginRequest, LoginResponse } from "@/lib/api";

// 로그인
export async function POST(
  req: NextRequest
): Promise<NextResponse<LoginResponse | { error: string }>> {
  try {
    const body: LoginRequest = await req.json();
    const { email, password } = body;

    // 필수 필드 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    // Supabase Auth로 로그인
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    // users 테이블에서 사용자 정보 가져오기 (보안 검증)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    // users 테이블에 사용자가 없으면 회원탈퇴된 계정으로 판단
    if (userError || !userData) {
      console.error("회원탈퇴된 계정 로그인 시도:", {
        userId: authData.user.id,
        email: authData.user.email,
        error: userError?.message,
      });

      // Supabase Auth 세션도 종료
      await supabase.auth.signOut();

      return NextResponse.json(
        { error: "회원탈퇴된 계정입니다. 다시 가입해주세요." },
        { status: 403 }
      );
    }

    // 응답 데이터 구성
    const response: LoginResponse = {
      user: {
        id: userData.id,
        email: userData.email,
        provider: userData.provider,
        created_at: userData.created_at,
      },
      session: {
        access_token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("로그인 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
