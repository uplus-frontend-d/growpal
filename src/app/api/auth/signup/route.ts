import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { SignUpRequest, SignUpResponse } from "@/lib/api";

// 회원가입
export async function POST(
  req: NextRequest
): Promise<NextResponse<SignUpResponse | { error: string }>> {
  try {
    const body: SignUpRequest = await req.json();
    const { email, password } = body;

    // 필수 필드 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Supabase Auth로 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Sign up failed" }, { status: 400 });
    }

    // users 테이블에 사용자 정보 저장
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: authData.user.email,
        provider: authData.user.app_metadata?.provider || "email",
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("사용자 데이터 저장 실패:", insertError);
      return NextResponse.json(
        { error: "Failed to save user data" },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const response: SignUpResponse = {
      user: {
        id: authData.user.id,
        email: authData.user.email || "",
        provider: authData.user.app_metadata?.provider || "email",
        created_at: new Date().toISOString(),
      },
      message:
        "회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("회원가입 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
