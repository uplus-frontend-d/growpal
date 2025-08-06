"use client";

import { supabase } from "./supabaseClient";
import { useUserStore } from "./userStore";

export function useUserData() {
  const { setUser, setLoading, clearUser } = useUserStore();

  const getUserData = async () => {
    setLoading(true);

    try {
      // 타임아웃 설정 (15초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("사용자 데이터 조회 시간이 초과되었습니다.")),
          15000
        );
      });

      const userDataPromise = async () => {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          console.error("인증 데이터 조회 오류:", authError);
          throw new Error("인증 정보를 가져올 수 없습니다.");
        }

        if (authData.user) {
          // users 테이블에서 사용자 정보 가져오기
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (error) {
            console.error("사용자 데이터 조회 오류:", error);
            throw new Error("사용자 데이터 조회 실패");
          }

          // 사용자가 존재하지 않으면 새로 생성
          if (!userData) {
            const { data: newUser, error: insertError } = await supabase
              .from("users")
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                created_at: new Date().toISOString(),
                provider: authData.user.app_metadata?.provider || "email",
              })
              .select()
              .single();

            if (insertError) {
              console.error("사용자 생성 오류:", insertError);
              throw new Error("사용자 생성 실패");
            }

            setUser(newUser);
            setLoading(false);
            return { success: true, user: newUser };
          }

          // 기존 사용자 데이터 설정
          setUser(userData);
          setLoading(false);
          return { success: true, user: userData };
        }

        clearUser();
        setLoading(false);
        return { success: false, error: "사용자 없음" };
      };

      // 타임아웃과 함께 실행
      return await Promise.race([userDataPromise(), timeoutPromise]);
    } catch (error: any) {
      console.error("사용자 데이터 처리 오류:", error);
      clearUser();
      setLoading(false);

      // 네트워크 오류 처리
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("network")
      ) {
        return { success: false, error: "네트워크 연결을 확인해주세요." };
      } else if (error.message?.includes("시간이 초과")) {
        return {
          success: false,
          error: "사용자 데이터 조회 시간이 초과되었습니다.",
        };
      } else {
        return {
          success: false,
          error: error.message || "사용자 데이터 처리 실패",
        };
      }
    }
  };

  return { getUserData };
}
