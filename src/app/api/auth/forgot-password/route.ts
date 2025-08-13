import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "@/lib/api";

// 비밀번호 찾기 (이메일 전송)
export async function POST(
  req: NextRequest
): Promise<NextResponse<ForgotPasswordResponse | { error: string }>> {
  try {
    const body: ForgotPasswordRequest = await req.json();
    const { email } = body;

    // 필수 필드 검증
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // users 테이블에서 해당 이메일이 존재하는지 확인 (provider 정보도 포함)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, provider")
      .eq("email", email)
      .single();

    if (userError) {
      if (userError.code === "PGRST116") {
        // 데이터가 없는 경우 (PGRST116: No rows returned)
        return NextResponse.json(
          {
            error:
              "등록되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요.",
          },
          { status: 404 }
        );
      } else {
        console.error("사용자 조회 오류:", userError);
        return NextResponse.json(
          {
            error: "사용자 정보 조회 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }
    }

    if (!userData) {
      return NextResponse.json(
        {
          error:
            "등록되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요.",
        },
        { status: 404 }
      );
    }

    // provider 체크 - OAuth 사용자는 비밀번호 찾기 불가
    if (userData.provider && userData.provider !== "email") {
      let providerName = "소셜 계정";
      if (userData.provider.includes("google")) {
        providerName = "Google";
      } else if (userData.provider.includes("github")) {
        providerName = "GitHub";
      }

      return NextResponse.json(
        {
          error: `${providerName}으로 가입한 계정은 비밀번호 찾기를 사용할 수 없습니다. ${providerName} 로그인을 이용해주세요.`,
        },
        { status: 400 }
      );
    }

    // 유효한 사용자인 경우에만 비밀번호 재설정 이메일 전송
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${
          req.headers.get("origin") || "http://localhost:3000"
        }/reset-password`,
      }
    );

    if (resetError) {
      console.error("비밀번호 재설정 이메일 전송 오류:", resetError);
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    const response: ForgotPasswordResponse = {
      message:
        "비밀번호 재설정 링크를 이메일로 보내드렸습니다. 이메일을 확인하고 비밀번호를 재설정해주세요.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("비밀번호 재설정 처리 오류:", error);
    return NextResponse.json(
      {
        error: "비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
