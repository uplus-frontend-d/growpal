import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 시간
    const now = new Date().toISOString();

    // 기한이 지난 할 일 조회
    console.log("할 일 조회 시작:", { user_id, now });

    // 사용자의 식물들을 먼저 조회
    const { data: userPlants, error: plantsError } = await supabase
      .from("plants")
      .select("id")
      .eq("user_id", user_id);

    if (plantsError) {
      console.error("식물 조회 오류:", plantsError);
      return NextResponse.json(
        {
          error: "식물 조회 중 오류가 발생했습니다.",
          details: plantsError.message,
        },
        { status: 500 }
      );
    }

    if (!userPlants || userPlants.length === 0) {
      return NextResponse.json({ message: "등록된 식물이 없습니다." });
    }

    const plantIds = userPlants.map((plant) => plant.id);

    // 기한이 지난 할 일 조회
    const { data: overdueTodos, error: todosError } = await supabase
      .from("plant_todos")
      .select(
        `
        *,
        plants!inner(
          id,
          name,
          user_id
        )
      `
      )
      .in("plant_id", plantIds)
      .eq("is_done", false)
      .lt("due_date", now);

    if (todosError) {
      console.error("할 일 조회 오류:", todosError);
      return NextResponse.json(
        {
          error: "할 일 조회 중 오류가 발생했습니다.",
          details: todosError.message,
        },
        { status: 500 }
      );
    }

    console.log("할 일 조회 결과:", {
      count: overdueTodos?.length || 0,
      todos: overdueTodos,
    });

    if (!overdueTodos || overdueTodos.length === 0) {
      return NextResponse.json({ message: "기한이 지난 할 일이 없습니다." });
    }

    // 기한이 지난 할 일에 대한 알림 생성 (1일, 2일, 3일 후 주기)
    const notifications = [];

    for (const todo of overdueTodos) {
      const dueDate = new Date(todo.due_date);
      const nowDate = new Date();
      const daysOverdue = Math.floor(
        (nowDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 1일, 2일, 3일 후마다 알림 생성
      if (daysOverdue >= 1 && daysOverdue <= 3) {
        const dayText =
          daysOverdue === 1 ? "1일" : daysOverdue === 2 ? "2일" : "3일";

        // 이미 해당 할 일에 대한 알림이 있는지 확인
        const { data: existingNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user_id)
          .eq("plant_id", todo.plant_id)
          .eq("sent", false)
          .ilike("message", `%${todo.task_type}%`)
          .ilike("message", `%${dayText}%`)
          .single();

        // 중복 알림이 없을 때만 생성
        if (!existingNotification) {
          notifications.push({
            user_id,
            plant_id: todo.plant_id,
            message: `${todo.plants.name} 식물의 ${todo.task_type} 할일이 ${dayText}이 지났습니다`,
            send_at: now,
            sent: false,
          });
        }
      }
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("알림 생성 오류:", notificationError);
      return NextResponse.json(
        { error: "알림 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${overdueTodos.length}개의 기한이 지난 할 일에 대한 알림이 생성되었습니다.`,
      overdue_count: overdueTodos.length,
    });
  } catch (error) {
    console.error("알림 확인 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
