import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { LogoutResponse } from "@/lib/api";

// 로그아웃
export async function POST(
  req: NextRequest
): Promise<NextResponse<LogoutResponse | { error: string }>> {
  try {
    // 타임아웃 설정 (10초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("로그아웃 요청 시간이 초과되었습니다.")),
        10000
      );
    });

    const logoutPromise = async () => {
      // Supabase Auth 로그아웃
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 오류:", error);

        // 구체적인 에러 메시지 처리
        if (error.message?.includes("network")) {
          throw new Error("네트워크 연결을 확인해주세요.");
        } else if (error.message?.includes("session")) {
          throw new Error("세션이 이미 만료되었습니다.");
        } else {
          throw new Error(error.message || "로그아웃 중 오류가 발생했습니다.");
        }
      }

      const response: LogoutResponse = {
        message: "로그아웃이 완료되었습니다.",
      };

      return NextResponse.json(response, { status: 200 });
    };

    // 타임아웃과 함께 실행
    return await Promise.race([logoutPromise(), timeoutPromise]);
  } catch (error: any) {
    console.error("로그아웃 처리 오류:", error);

    // 네트워크 오류 처리
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network")
    ) {
      return NextResponse.json(
        {
          error: "네트워크 연결을 확인해주세요.",
        },
        { status: 503 }
      );
    } else if (error.message?.includes("시간이 초과")) {
      return NextResponse.json(
        {
          error: "로그아웃 요청 시간이 초과되었습니다.",
        },
        { status: 408 }
      );
    } else {
      return NextResponse.json(
        {
          error: error.message || "로그아웃 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }
  }
}
