import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

// 알림 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, plant_id, message, send_at } = body;

    if (!user_id || !message) {
      return NextResponse.json(
        { error: "user_id and message are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        plant_id,
        message,
        send_at: send_at || new Date().toISOString(),
        sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error("알림 생성 오류:", error);
      return NextResponse.json(
        { error: "알림 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    console.error("알림 생성 오류:", error);
    return NextResponse.json(
      { error: "알림 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자의 알림 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        plants (
          id,
          name
        )
      `
      )
      .eq("user_id", user_id)
      .eq("sent", false)
      .order("send_at", { ascending: false });

    if (error) {
      console.error("알림 조회 오류:", error);
      return NextResponse.json(
        { error: "알림 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: data });
  } catch (error) {
    console.error("알림 조회 오류:", error);
    return NextResponse.json(
      { error: "알림 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

