import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import type { LogoutResponse } from "@/lib/api";

// 로그아웃
export async function POST(
  req: NextRequest
): Promise<NextResponse<LogoutResponse | { error: string }>> {
  try {
    // Supabase Auth 로그아웃
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("로그아웃 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response: LogoutResponse = {
      message: "로그아웃이 완료되었습니다.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("로그아웃 처리 오류:", error);
    return NextResponse.json(
      {
        error: "로그아웃 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
