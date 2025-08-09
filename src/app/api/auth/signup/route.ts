import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { SignUpRequest, SignUpResponse } from "@/lib/api";

// 회원가입
export async function POST(
  req: NextRequest
): Promise<
  NextResponse<SignUpResponse | { error: string; provider?: string }>
> {
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

    // 기존 사용자 확인 (이메일로) - 대소문자 구분
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (checkError) {
      console.error("사용자 확인 오류:", checkError);
      return NextResponse.json(
        { error: "사용자 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 정확히 일치하는 이메일 찾기 (대소문자 구분)
    const existingUser = existingUsers?.find((user) => user.email === email);

    // 기존 사용자가 있는 경우 - 첫 번째 가입 provider 정보 반환
    if (existingUser) {
      console.log("중복 이메일 가입 시도:", { email, existingUser });

      // provider 정보 추출 및 포맷팅
      let providerName = "이메일";
      if (existingUser.provider) {
        if (existingUser.provider.includes("google")) {
          providerName = "구글";
        } else if (existingUser.provider.includes("github")) {
          providerName = "GitHub";
        } else if (existingUser.provider.includes("email")) {
          providerName = "이메일";
        }
      }

      return NextResponse.json(
        {
          error: `이미 '${providerName}'으로 가입하셨습니다.`,
          provider: existingUser.provider,
          code: "EMAIL_ALREADY_EXISTS",
        },
        { status: 409 }
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
