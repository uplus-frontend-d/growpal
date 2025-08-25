import { useEffect } from "react";
import { useUserStore } from "../lib/userStore";

export function useNotificationCheck() {
  const { user } = useUserStore();

  useEffect(() => {
    const checkOverdueTodos = async () => {
      if (!user?.id) return;

      try {
        // todo 기한이 지난 경우 알림 생성
        const response = await fetch("/api/notifications/check-overdue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (!response.ok) {
          // 응답이 JSON이 아닐 수 있으므로 안전하게 처리
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          console.error("알림 확인 API 오류:", errorData);
          return;
        }

        const data = await response.json();
        console.log("알림 확인 결과:", data);
      } catch (error) {
        console.error("알림 확인 오류:", error);
      }
    };

    // 앱 로드 시 한 번 실행
    checkOverdueTodos();

    // 1시간마다 실행 (선택사항)
    const interval = setInterval(checkOverdueTodos, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);
}
