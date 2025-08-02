import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { ResetPasswordRequest, ResetPasswordResponse } from "@/lib/api";

// 비밀번호 재설정
export async function POST(
  req: NextRequest
): Promise<NextResponse<ResetPasswordResponse | { error: string }>> {
  try {
    const body: ResetPasswordRequest = await req.json();
    const { password } = body;

    // 필수 필드 검증
    if (!password) {
      return NextResponse.json(
        { error: "password is required" },
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

    // 현재 세션 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json(
        { error: "No valid session found" },
        { status: 401 }
      );
    }

    // 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const response: ResetPasswordResponse = {
      message: "비밀번호가 성공적으로 재설정되었습니다.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    return NextResponse.json(
      {
        error: "비밀번호 재설정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
