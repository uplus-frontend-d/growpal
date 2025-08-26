"use client";

import { useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useUserStore } from "./userStore";

export function useUserData() {
  const { setUser, setLoading, clearUser } = useUserStore();

  const getUserData = useCallback(async () => {
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
        // 먼저 세션 확인
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          // 세션 에러가 발생하면 세션을 클리어
          await supabase.auth.signOut();
          clearUser();
          setLoading(false);
          return { success: false, error: "세션을 확인할 수 없습니다." };
        }

        // 세션이 없으면 사용자도 없음
        if (!sessionData.session) {
          clearUser();
          setLoading(false);
          return { success: false, error: "로그인 세션이 없습니다." };
        }

        // 사용자 정보 가져오기
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          // JWT 관련 에러인 경우 세션을 클리어
          if (
            authError.message?.includes("does not exist") ||
            authError.message?.includes("invalid") ||
            authError.status === 403
          ) {
            await supabase.auth.signOut();
            clearUser();
            setLoading(false);
            return {
              success: false,
              error: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
            };
          }

          throw new Error("인증 정보를 가져올 수 없습니다.");
        }

        if (authData.user) {
          // auth user ID를 사용하여 users 테이블에서 직접 조회
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          // users 테이블에 사용자가 없으면 회원탈퇴된 계정으로 판단
          if (userError || !userData) {
            console.error("회원탈퇴된 계정 사용자 데이터 조회 시도:", {
              userId: authData.user.id,
              email: authData.user.email,
              error: userError?.message,
            });

            // 세션 클리어
            await supabase.auth.signOut();
            clearUser();
            setLoading(false);

            return {
              success: false,
              error: "회원탈퇴된 계정입니다. 다시 가입해주세요.",
            };
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
      } else if (error.message?.includes("세션")) {
        return { success: false, error: "로그인 세션이 만료되었습니다." };
      } else {
        return {
          success: false,
          error: error.message || "사용자 데이터 처리 실패",
        };
      }
    }
  }, [setUser, setLoading, clearUser]);

  return { getUserData };
}
