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
          const currentProvider =
            authData.user.app_metadata?.provider || "email";

          // 이메일과 provider 조합으로 사용자 검색
          let existingUser = null;

          if (authData.user.email) {
            // 이메일로 모든 사용자 조회 (여러 행이 반환될 수 있음)
            const { data: emailUsers, error: emailError } = await supabase
              .from("users")
              .select("*")
              .eq("email", authData.user.email);

            if (!emailError && emailUsers && emailUsers.length > 0) {
              // 같은 이메일과 provider를 가진 사용자 찾기
              existingUser = emailUsers.find(
                (user) =>
                  user.email === authData.user.email &&
                  user.provider === currentProvider
              );
            }
          }

          // 사용자가 존재하지 않으면 세션 클리어
          if (!existingUser) {
            await supabase.auth.signOut();
            clearUser();
            setLoading(false);
            return {
              success: false,
              error: "사용자 데이터가 없습니다. 다시 로그인해주세요.",
            };
          }

          // Provider 일치 확인 (이미 위에서 확인했지만 추가 검증)
          if (existingUser.provider !== currentProvider) {
            // 세션 클리어
            await supabase.auth.signOut();
            clearUser();
            setLoading(false);

            // Provider 이름 추출
            let providerName = "이메일";
            if (existingUser.provider.includes("google")) {
              providerName = "구글";
            } else if (existingUser.provider.includes("github")) {
              providerName = "GitHub";
            }

            return {
              success: false,
              error: `이미 '${providerName}'으로 가입하셨습니다. 같은 계정으로 로그인해주세요.`,
            };
          }

          // 기존 사용자 데이터 설정
          setUser(existingUser);
          setLoading(false);
          return { success: true, user: existingUser };
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
