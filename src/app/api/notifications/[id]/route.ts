import { supabase } from "@/app/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

// 알림 확인 (읽음 처리)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { sent } = body;

    const { data, error } = await supabase
      .from("notifications")
      .update({ sent: sent || true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("알림 업데이트 오류:", error);
      return NextResponse.json(
        { error: "알림 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    console.error("알림 업데이트 오류:", error);
    return NextResponse.json(
      { error: "알림 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 알림 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("알림 삭제 오류:", error);
      return NextResponse.json(
        { error: "알림 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return NextResponse.json(
      { error: "알림 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

