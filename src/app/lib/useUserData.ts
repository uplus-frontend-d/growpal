"use client";

import { supabase } from "./supabaseClient";
import { useUserStore } from "./userStore";

export function useUserData() {
  const { setUser, setLoading, clearUser } = useUserStore();

  const getUserData = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      // users 테이블에서 사용자 정보 가져오기
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        console.error("사용자 데이터 조회 실패:", error);
        clearUser();
        setLoading(false);
        return { success: false, error: "사용자 데이터 조회 실패" };
      }

      if (userData) {
        setUser(userData);
        setLoading(false);
        return { success: true, user: userData };
      }
    }

    clearUser();
    setLoading(false);
    return { success: false, error: "사용자 없음" };
  };

  return { getUserData };
}
